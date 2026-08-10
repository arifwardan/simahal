# SIMAHAL Phase 4: Progress Dashboards & Parent Monitoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the role-aware home dashboards (PRD §5 "Santri melihat progres", "Orang tua memantau anak", and MVP 9 "Dashboard progres" and 11 "Parent monitoring") so each role lands on a useful overview of targets, progress, and mutabaah riwayat.

**Architecture:** A single `DashboardController` renders a role-specific Inertia page (`dashboard/admin.tsx`, `dashboard/ustadz.tsx`, `dashboard/santri.tsx`, `dashboard/orang-tua.tsx`) selected by `$request->user()->role`. Santri and parent pages reuse a shared `SantriProgressView` component. Parent data is scoped via `OrangTua::where('user_id', ...)` and its `santris` relationship. All authorization is backend-driven at render time.

**Tech Stack:** Laravel 13, Inertia v3 + React 19 + TypeScript, shadcn/ui, Wayfinder actions/routes, Pest.

## Global Constraints

- Dashboard route stays `GET /dashboard` behind `middleware(['auth', 'verified'])`; role-specific data is decided inside the controller (no separate nav links needed).
- `route('dashboard')` stays the Fortify `home` redirect target (unchanged).
- Reuse `RecalculateTargetProgress` (Phase 3) if a dashboard mutates progress; for read-only dashboards, use `progressPercent()`.
- Indonesian copy. Follow existing conventions (`Inertia::render`, `Inertia::flash`, `Form`/`.form()`, `InputError`, `page.layout = { breadcrumbs }`).
- Regenerate Wayfinder after adding routes (`php artisan wayfinder:generate`); delete stale generated files.
- Run `vendor/bin/pint --dirty --format agent` after PHP edits.

---

### Task 1: Role-aware dashboard controller

**Files:**
- Create: `app/Http/Controllers/DashboardController.php`
- Modify: `routes/web.php`
- Test: `tests/Feature/DashboardTest.php` (extend existing)

**Interfaces:**
- Consumes: `UserRole`, `User`, `Santri`, `Ustadz`, `OrangTua`, `Halaqah`, `TargetHafalan`, `Mutabaah` models and relationships (Phases 1-3).
- Produces `DashboardController::__invoke(Request): Response` rendering one of `dashboard/admin`, `dashboard/ustadz`, `dashboard/santri`, `dashboard/orang-tua`. The four page files are created in Tasks 2-4; this task wires the switch and provides a shared `santriProgressData(Santri $santri): array` shape used by santri and parent pages.

- [ ] **Step 1: Extend the failing feature tests**

Edit `tests/Feature/DashboardTest.php` — keep the existing two tests, then add:

```php
<?php

use App\Enums\UserRole;
use App\Models\Halaqah;
use App\Models\Mutabaah;
use App\Models\OrangTua;
use App\Models\Santri;
use App\Models\TargetHafalan;
use App\Models\Ustadz;
use App\Models\User;

test('admin dashboard renders the admin component', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);

    $this->actingAs($admin)->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('dashboard/admin'));
});

test('ustadz dashboard renders the ustadz component with their halaqah', function () {
    $user = User::factory()->create(['role' => UserRole::Ustadz]);
    $ustadz = Ustadz::factory()->create(['user_id' => $user->id]);
    Halaqah::factory()->count(2)->create(['ustadz_id' => $ustadz->id]);

    $this->actingAs($user)->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard/ustadz')
            ->has('halaqahs', 2));
});

test('santri dashboard renders the santri component with progress', function () {
    $user = User::factory()->create(['role' => UserRole::Santri]);
    $santri = Santri::factory()->create(['user_id' => $user->id]);
    TargetHafalan::factory()->create(['santri_id' => $santri->id, 'target' => 40, 'progress' => 10]);
    Mutabaah::factory()->count(2)->create(['santri_id' => $santri->id]);

    $this->actingAs($user)->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard/santri')
            ->has('progress.target', 40)
            ->has('progress.progress', 10)
            ->has('progress.percent', 25)
            ->has('riwayat', 2));
});

test('orang tua dashboard renders only their own children', function () {
    $user = User::factory()->create(['role' => UserRole::OrangTua]);
    $orangTua = OrangTua::factory()->create(['user_id' => $user->id]);
    $ownChild = Santri::factory()->create(['orang_tua_id' => $orangTua->id, 'nama' => 'Anak Saya']);
    $otherParent = OrangTua::factory()->create();
    Santri::factory()->create(['orang_tua_id' => $otherParent->id, 'nama' => 'Anak Orang Lain']);

    $this->actingAs($user)->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard/orang-tua')
            ->has('children', 1)
            ->where('children.0.nama', 'Anak Saya'));
});

test('admin dashboard shows global counts', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    Santri::factory()->count(4)->create();
    Ustadz::factory()->count(2)->create();
    OrangTua::factory()->count(1)->create();
    Halaqah::factory()->count(3)->create();

    $this->actingAs($admin)->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('counts.santris', 4)
            ->has('counts.ustadzs', 2)
            ->has('counts.halaqahs', 3));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --compact tests/Feature/DashboardTest.php`
Expected: FAIL — `dashboard/admin` etc. page files don't exist; the existing route renders `dashboard` and would resolve none of the four files.

- [ ] **Step 3: Create the controller**

Create `app/Http/Controllers/DashboardController.php`:

```php
<?php

namespace App\Http\Controllers;

use App\Enums\TargetHafalanStatus;
use App\Enums\UserRole;
use App\Models\Halaqah;
use App\Models\Mutabaah;
use App\Models\OrangTua;
use App\Models\Santri;
use App\Models\TargetHafalan;
use App\Models\Ustadz;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        return match ($user->role) {
            UserRole::Admin => $this->admin(),
            UserRole::Ustadz => $this->ustadz($user),
            UserRole::Santri => $this->santri($user->santri),
            UserRole::OrangTua => $this->orangTua($user->orangTua),
        };
    }

    private function admin(): Response
    {
        return Inertia::render('dashboard/admin', [
            'counts' => [
                'santris' => Santri::count(),
                'ustadzs' => Ustadz::count(),
                'orangTuas' => OrangTua::count(),
                'halaqahs' => Halaqah::count(),
                'mutabaahs' => Mutabaah::count(),
            ],
            'recentMutabaahs' => Mutabaah::query()
                ->with('santri')
                ->orderBy('tanggal', 'desc')
                ->limit(5)
                ->get(),
        ]);
    }

    private function ustadz(User $user): Response
    {
        $ustadz = $user->ustadz;

        abort_unless($ustadz !== null, 403, __('You do not have a ustadz profile.'));

        $halaqahs = $ustadz->halaqahs()
            ->withCount('santris')
            ->orderBy('nama')
            ->get();

        $recentMutabaahs = $ustadz->mutabaahs()
            ->with('santri')
            ->orderBy('tanggal', 'desc')
            ->limit(5)
            ->get();

        return Inertia::render('dashboard/ustadz', [
            'halaqahs' => $halaqahs,
            'recentMutabaahs' => $recentMutabaahs,
        ]);
    }

    private function santri(Santri $santri): Response
    {
        abort_unless($santri !== null, 403, __('You do not have a santri profile.'));

        return Inertia::render('dashboard/santri', [
            'santri' => $santri->only(['id', 'nama', 'nis']),
            'progress' => $this->progressData($santri),
            'riwayat' => $santri->mutabaahs()->orderBy('tanggal', 'desc')->limit(10)->get(),
            'halaqahs' => $santri->halaqahs()->get(['id', 'nama']),
        ]);
    }

    private function orangTua(OrangTua $orangTua): Response
    {
        abort_unless($orangTua !== null, 403, __('You do not have an orang tua profile.'));

        $children = $orangTua->santris()
            ->orderBy('nama')
            ->get()
            ->map(fn (Santri $santri) => [
                'id' => $santri->id,
                'nama' => $santri->nama,
                'nis' => $santri->nis,
                'progress' => $this->progressData($santri),
            ]);

        return Inertia::render('dashboard/orang-tua', [
            'children' => $children,
        ]);
    }

    /**
     * @return array{
     *     target: int,
     *     progress: int,
     *     percent: int,
     *     status: string,
     *     status_label: string,
     *     periode: string|null
     * }
     */
    private function progressData(Santri $santri): array
    {
        $target = $santri->targetHafalans()
            ->orderBy('id', 'desc')
            ->first();

        if ($target === null) {
            return ['target' => 0, 'progress' => 0, 'percent' => 0, 'status' => '', 'status_label' => '', 'periode' => null];
        }

        return [
            'target' => $target->target,
            'progress' => $target->progress,
            'percent' => $target->progressPercent(),
            'status' => $target->status->value,
            'status_label' => $target->status->label(),
            'periode' => $target->periode,
        ];
    }
}
```

Note: `User` is auto-imported in `ustadz(User $user)`; ensure `use App\Models\User;` is present if not already.

- [ ] **Step 4: Point the dashboard route at the controller**

Edit `routes/web.php` — replace the `Route::inertia('dashboard', 'dashboard')` line with:

```php
Route::get('dashboard', DashboardController::class)->name('dashboard');
```

And add the import at the top of `routes/web.php`:

```php
use App\Http\Controllers\DashboardController;
```

- [ ] **Step 5: Run tests (expect the four page files to fail) and verify the controller**

```bash
php artisan test --compact tests/Feature/DashboardTest.php
```

Expected: tests fail only because the page components `dashboard/admin` etc. are missing (Inertia cannot resolve). Continue to Tasks 2-4 to create them.

---

### Task 2: Dashboard pages (admin, ustadz, santri)

**Files:**
- Create: `resources/js/pages/dashboard/admin.tsx`
- Create: `resources/js/pages/dashboard/ustadz.tsx`
- Create: `resources/js/pages/dashboard/santri.tsx`
- Update: `resources/js/pages/dashboard.tsx` → becomes a shared shell shelling out to the four role pages via dynamic props

**Interfaces:**
- Consumes: controller props from Task 1 (`counts`, `recentMutabaahs`, `halaqahs`, `santri`, `progress`, `riwayat`, `halaqahs`).
- Produces: three of the four page files (parent page in Task 3). Each page sets `page.layout = { breadcrumbs: [{ title: 'Dashboard', href: dashboard() }] }`.

- [ ] **Step 1: Add a shared stat card unit** (optional, keep small)

Create `resources/js/components/dashboard/stat-card.tsx`:

```tsx
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type StatCardProps = {
    label: string;
    value: string | number;
};

export default function StatCard({ label, value }: StatCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-semibold">{value}</p>
            </CardContent>
        </Card>
    );
}
```

- [ ] **Step 2: Create the admin page**

Create `resources/js/pages/dashboard/admin.tsx`:

```tsx
import { Head, Link } from '@inertiajs/react';
import StatCard from '@/components/dashboard/stat-card';
import { dashboard } from '@/routes/dashboard';
import { users } from '@/routes/users';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type MutabaahRow = {
    id: number;
    tanggal: string;
    jenis: string;
    surah: string;
    ayat_mulai: number;
    ayat_selesai: number;
    status: string;
    santri?: { id: number; nama: string } | null;
};

type PageProps = {
    counts: {
        santris: number;
        ustadzs: number;
        orangTuas: number;
        halaqahs: number;
        mutabaahs: number;
    };
    recentMutabaahs: MutabaahRow[];
};

export default function AdminDashboard({ counts, recentMutabaahs }: PageProps) {
    return (
        <>
            <Head title="Dashboard Admin" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <StatCard label="Santri" value={counts.santris} />
                <StatCard label="Ustadz" value={counts.ustadzs} />
                <StatCard label="Orang Tua" value={counts.orangTuas} />
                <StatCard label="Halaqah" value={counts.halaqahs} />
                <StatCard label="Mutabaah" value={counts.mutabaahs} />
            </div>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Mutabaah Terbaru</CardTitle>
                </CardHeader>
                <CardContent>
                    {recentMutabaahs.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Belum ada mutabaah tercatat.</p>
                    ) : (
                        <ul className="divide-y rounded-lg border">
                            {recentMutabaahs.map((m) => (
                                <li key={m.id} className="flex items-center justify-between gap-4 p-4">
                                    <p className="text-sm">
                                        {m.santri?.nama ?? '-'} · {m.tanggal} · {m.jenis} · {m.surah} {m.ayat_mulai}-{m.ayat_selesai}
                                    </p>
                                    <Badge variant="secondary">{m.status}</Badge>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </>
    );
}

AdminDashboard.layout = {
    breadcrumbs: [{
        title: 'Dashboard',
        href: dashboard(),
    }],
};
```

- [ ] **Step 3: Create the ustadz page**

Create `resources/js/pages/dashboard/ustadz.tsx`:

```tsx
import { Head, Link } from '@inertiajs/react';
import StatCard from '@/components/dashboard/stat-card';
import { dashboard } from '@/routes/dashboard';
import { index as halaqahsIndex } from '@/routes/ustadz/halaqah';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type HalaqahRow = {
    id: number;
    nama: string;
    santris_count: number;
};

type MutabaahRow = {
    id: number;
    tanggal: string;
    jenis: string;
    surah: string;
    ayat_mulai: number;
    ayat_selesai: number;
    status: string;
    santri?: { id: number; nama: string } | null;
};

type PageProps = {
    halaqahs: HalaqahRow[];
    recentMutabaahs: MutabaahRow[];
};

export default function UstadzDashboard({ halaqahs, recentMutabaahs }: PageProps) {
    const totalSantri = halaqahs.reduce((sum, h) => sum + h.santris_count, 0);

    return (
        <>
            <Head title="Dashboard Ustadz" />
            <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label="Halaqah" value={halaqahs.length} />
                <StatCard label="Santri" value={totalSantri} />
                <StatCard label="Mutabaah" value={recentMutabaahs.length} />
            </div>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Halaqah Saya</CardTitle>
                </CardHeader>
                <CardContent>
                    {halaqahs.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Belum ada halaqah.</p>
                    ) : (
                        <ul className="divide-y rounded-lg border">
                            {halaqahs.map((h) => (
                                <li key={h.id} className="flex items-center justify-between gap-4 p-4">
                                    <p className="font-medium">{h.nama}</p>
                                    <span className="text-sm text-muted-foreground">{h.santris_count} santri</span>
                                </li>
                            ))}
                        </ul>
                    )}
                    <Button asChild variant="outline" className="mt-4">
                        <Link href={halaqahsIndex()}>Kelola Halaqah</Link>
                    </Button>
                </CardContent>
            </Card>
        </>
    );
}

UstadzDashboard.layout = {
    breadcrumbs: [{
        title: 'Dashboard',
        href: dashboard(),
    }],
};
```

- [ ] **Step 4: Create the santri page (shared progress view wire-in)**

Create `resources/js/pages/dashboard/santri.tsx`:

```tsx
import { Head } from '@inertiajs/react';
import SantriProgressView from '@/components/santri-progress-view';
import { dashboard } from '@/routes/dashboard';

type PageProps = {
    santri: { id: number; nama: string; nis: string | null };
    progress: {
        target: number;
        progress: number;
        percent: number;
        status: string;
        status_label: string;
        periode: string | null;
    };
    riwayat: {
        id: number;
        tanggal: string;
        jenis: string;
        surah: string;
        ayat_mulai: number;
        ayat_selesai: number;
        status: string;
    }[];
    halaqahs: { id: number; nama: string }[];
};

export default function SantriDashboard({ santri, progress, riwayat, halaqahs }: PageProps) {
    return (
        <>
            <Head title="Dashboard Santri" />
            <SantriProgressView
                headline={`Selamat datang, ${santri.nama}`}
                progress={progress}
                riwayat={riwayat}
                halaqahs={halaqahs}
            />
        </>
    );
}

SantriDashboard.layout = {
    breadcrumbs: [{
        title: 'Dashboard',
        href: dashboard(),
    }],
};
```

- [ ] **Step 5: Create the shared santri progress component**

Create `resources/js/components/santri-progress-view.tsx` — reused by the santri dashboard (Task 2) and the parent dashboard (Task 3):

```tsx
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type RiwayatRow = {
    id: number;
    tanggal: string;
    jenis: string;
    surah: string;
    ayat_mulai: number;
    ayat_selesai: number;
    status: string;
};

type Progress = {
    target: number;
    progress: number;
    percent: number;
    status: string;
    status_label: string;
    periode: string | null;
};

export default function SantriProgressView({
    headline,
    progress,
    riwayat,
    halaqahs,
}: {
    headline: string;
    progress: Progress;
    riwayat: RiwayatRow[];
    halaqahs: { id: number; nama: string }[];
}) {
    return (
        <>
            <h1 className="text-lg font-semibold">{headline}</h1>

            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>Target Hafalan {progress.periode ? `· Periode ${progress.periode}` : ''}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                            {progress.progress}/{progress.target} ayat · {progress.percent}%
                        </p>
                        {progress.status && (
                            <Badge variant="secondary">{progress.status_label}</Badge>
                        )}
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                        <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${Math.min(100, progress.percent)}%` }}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Halaqah</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {halaqahs.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Belum terdaftar di halaqah.</p>
                        ) : (
                            <ul className="space-y-1">
                                {halaqahs.map((h) => (
                                    <li key={h.id} className="text-sm">{h.nama}</li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Riwayat Mutabaah</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {riwayat.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Belum ada mutabaah.</p>
                        ) : (
                            <ul className="divide-y rounded-lg border">
                                {riwayat.map((m) => (
                                    <li key={m.id} className="flex items-center justify-between gap-4 p-3">
                                        <p className="text-sm">
                                            {m.tanggal} · {m.jenis} · {m.surah} {m.ayat_mulai}-{m.ayat_selesai}
                                        </p>
                                        <Badge variant="secondary">{m.status}</Badge>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
```

- [ ] **Step 6: Redirect the old dashboard entry to a role shell**

Replace the placeholders in `resources/js/pages/dashboard.tsx` — keep `Head` wrapping the app shell and render the new `AppSidebar`/shell, but since the controller already picks the right component, `dashboard.tsx` is no longer a rendered page. Delete `resources/js/pages/dashboard.tsx` (its shell role is fulfilled by `resources/js/layouts/app-layout.tsx`). Verify no other file imports `pages/dashboard`.

```bash
rg -l "pages/dashboard" resources/js
```

Expected: no matches (the shell lives in `layouts/app-layout.tsx`).

- [ ] **Step 7: Run the frontend type check**

```bash
npm run types:check
```

- [ ] **Step 8: Verify, format, commit**

```bash
php artisan wayfinder:generate
php artisan test --compact tests/Feature/DashboardTest.php
vendor/bin/pint --dirty --format agent
git add app/Http/Controllers/DashboardController.php routes/web.php resources/js/components/dashboard resources/js/components/santri-progress-view.tsx resources/js/pages/dashboard tests/Feature/DashboardTest.php
git commit -m "feat: role-aware home dashboards"
```

Expected: all DashboardTest cases pass.

---

### Task 3: Orang tua dashboard (children monitoring)

**Files:**
- Create: `resources/js/pages/dashboard/orang-tua.tsx`
- Update: `routes/web.php` (if a child-detail route is added; optional for MVP)
- Test: `tests/Feature/DashboardTest.php` (already covers scoping in Task 1)

**Interfaces:**
- Consumes: `DashboardController::orangTua()` props (`children: [{ id, nama, nis, progress }]`).
- Produces page `dashboard/orang-tua` listing each child with a progress card via `SantriProgressView`, plus a link to a dedicated child detail (MVP 12 "Orang tua melihat detail anak" — optional stretch, wire to `santri.progress` if not adding a new page).

- [ ] **Step 1: Create the parent page**

Create `resources/js/pages/dashboard/orang-tua.tsx`:

```tsx
import { Head, Link } from '@inertiajs/react';
import SantriProgressView from '@/components/santri-progress-view';
import { dashboard } from '@/routes/dashboard';
import { Button } from '@/components/ui/button';

type Child = {
    id: number;
    nama: string;
    nis: string | null;
    progress: {
        target: number;
        progress: number;
        percent: number;
        status: string;
        status_label: string;
        periode: string | null;
    };
};

type PageProps = {
    children: Child[];
};

export default function OrangTuaDashboard({ children }: PageProps) {
    return (
        <>
            <Head title="Dashboard Orang Tua" />
            {children.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    Anda belum memiliki anak yang terdaftar di SIMAHAL.
                </p>
            ) : (
                <div className="space-y-8">
                    {children.map((child) => (
                        <SantriProgressView
                            key={child.id}
                            headline={child.nama}
                            progress={child.progress}
                            riwayat={[]}
                            halaqahs={[]}
                        />
                    ))}
                </div>
            )}
        </>
    );
}

OrangTuaDashboard.layout = {
    breadcrumbs: [{
        title: 'Dashboard',
        href: dashboard(),
    }],
};
```

Note: For MVP the parent page omits per-child mutabaah riwayat (kept simple); the stretch task (MVP 12) would add a `GET /orang-tua/anak/{santri}` showing full riwayat via a dedicated controller.

- [ ] **Step 2: Run the frontend type check and full suite**

```bash
npm run types:check
php artisan test --compact
```

Expected: all tests green.

- [ ] **Step 3: Verify, format, commit**

```bash
vendor/bin/pint --dirty --format agent
git add resources/js/pages/dashboard/orang-tua.tsx tests/Feature/DashboardTest.php
git commit -m "feat: parent monitoring dashboard"
```

---

## Self-Review

1. **Spec coverage:** Phase 4 closes PRD §5 dashboard items: admin overview counts, ustadz halaqah summary, santri progress with riwayat, and orang tua children monitoring (MVP 9, 11). MVP 12 (per-child detail) is explicitly marked a stretch task.
2. **Placeholder scan:** No TBDs. `dashboard.tsx` placeholder deletion is verified with `rg` before removing.
3. **Type consistency:** One role switch in the controller (`match ($user->role)`), matching the four page files; the shared `progressData()` shape is identical between santri and parent pages so `SantriProgressView` accepts the same `Progress` type.
4. **Ambiguity:** Santri-without-profile (`$user->santri === null`) aborts 403 on the santri branch; parent branch likewise. The OLD `dashboard.tsx` placeholder is deleted only after `rg` confirms no imports.