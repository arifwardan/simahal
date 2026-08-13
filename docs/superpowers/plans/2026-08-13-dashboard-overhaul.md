# Dashboard Overhaul (Violet Brand + Chart Distribusi) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Perbagus seluruh dashboard (admin, ustadz, santri, orang tua) — brand color baru violet, donut chart distribusi dari agregasi backend, hero greeting, section heading, dan kartu statistik dengan subtitle/delta.

**Architecture:** Backend (`DashboardController`) menambahkan payload agregasi distribusi (`mutabaahByStatus`, `santriByJenis`, `childrenProgress`) dan hitungan delta bulan ini vs bulan lalu. Frontend memakai komponen shadcn `chart` (recharts) lewat komponen donut shared, hero/section-heading shared, dan `StatCard` yang di-upgrade. Tema violet diterapkan di CSS tokens + sidebar + gradient.

**Tech Stack:** Laravel 12 (PHP 8.5), Inertia.js v3, React 19, TypeScript, Tailwind v4, shadcn/ui, recharts, Pest, Wayfinder.

## Global Constraints

- Copy UI dalam Bahasa Indonesia (hero, heading, empty state, label chart).
- Brand color: violet. Nilai oklch target di Bagian 1 `docs/superpowers/specs/2026-08-13-dashboard-overhaul-design.md` (primary `oklch(0.541 0.245 293)` light / `oklch(0.686 0.246 293)` dark; sidebar `oklch(0.216 0.069 293)`; chart-1..5 violet/indigo/fuchsia/teal/amber).
- Tanpa backend tren/deret waktu; hanya agregasi point-in-time.
- Route dashboard tidak berubah → **tanpa** `php artisan wayfinder:generate`.
- Perubahan PHP wajib diakhiri `vendor/bin/pint --dirty --format agent`.
- Verifikasi tiap task frontend: `npm run types:check` dan `npm run build`. Verifikasi akhir: `php artisan test --compact`, `npm run types:check`, `vendor/bin/pint --dirty --format agent`, `npm run lint:check`.
- Jangan ikut commit WIP yang tidak terkait (fitur Import Excel + file `.ai/rules/*` + `opencode.json` yang belum di-commit di working tree). Hanya `git add` file yang termasuk scope task.
- `StatCard` lama tidak dipakai lagi setelah Task 5-8 — jangan hapus selain di-replace di halaman.

---

### Task 1: Instal komponen chart shadcn + recharts

**Files:**
- Create: `resources/js/components/ui/chart.tsx` (dihasilkan CLI)
- Modify: `package.json`, `package-lock.json` (dependensi `recharts` ditambah CLI)

**Interfaces:**
- Produces: export `ChartConfig`, `ChartContainer`, `ChartTooltip`, `ChartTooltipContent` dari `@/components/ui/chart`; package `recharts` tersedia.

- [ ] **Step 1: Tambah komponen chart via CLI**

Run:
```powershell
npx shadcn@latest add chart --yes
```
Expected: `resources/js/components/ui/chart.tsx` terbuat; `recharts` (+ `@types/recharts` bila perlu) masuk `package.json`.

- [ ] **Step 2: Pastikan dependensi terpasang**

Run: `npm install`
Expected: selesai tanpa error.

- [ ] **Step 3: Verifikasi type + build**

Run: `npm run types:check; if ($?) { npm run build }`
Expected: keduanya sukses.

- [ ] **Step 4: Commit**

```powershell
git add resources/js/components/ui/chart.tsx package.json package-lock.json
git commit -m "chore: add shadcn chart component with recharts"
```

---

### Task 2: Backend — agregasi distribusi + delta di DashboardController

**Files:**
- Modify: `app/Http/Controllers/DashboardController.php`
- Test: `tests/Feature/DashboardTest.php`

**Interfaces:**
- Consumes: model `Mutabaah`, `Santri`, `TargetHafalan`; enum `MutabaahStatus`, `SantriJenis`, `TargetHafalanStatus`; enum `UserRole` (sudah dipakai).
- Produces (props Inertia baru):
  - Admin: `mutabaahByStatus`, `santriByJenis` (`list<{key, label, count}>`), `mutabaahsThisMonth`, `mutabaahsLastMonth`, `santrisThisMonth` (`int`).
  - Ustadz: `mutabaahByStatus`, `mutabaahsThisMonth`, `mutabaahsLastMonth`.
  - Santri: `mutabaahByStatus`.
  - Orang tua: `childrenProgress` (`list<{key, label, count}>`).

- [ ] **Step 1: Tulis failing test**

Tambahkan ke `tests/Feature/DashboardTest.php` (import: `use App\Enums\MutabaahStatus;`, `use App\Enums\SantriJenis;`, `use App\Enums\TargetHafalanStatus;` di blok `use` atas):

```php
test('admin dashboard includes mutabaah status distribution', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);

    Mutabaah::factory()->count(3)->create(['status' => MutabaahStatus::Lulus]);
    Mutabaah::factory()->count(2)->create(['status' => MutabaahStatus::PerluMurajaah]);
    Mutabaah::factory()->count(1)->create(['status' => MutabaahStatus::Mengulang]);

    $this->actingAs($admin)->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('mutabaahByStatus.0', ['key' => 'lulus', 'label' => 'Lulus', 'count' => 3])
            ->where('mutabaahByStatus.1', ['key' => 'perlu_murajaah', 'label' => 'Perlu Murajaah', 'count' => 2])
            ->where('mutabaahByStatus.2', ['key' => 'mengulang', 'label' => 'Mengulang', 'count' => 1]));
});

test('admin dashboard includes santri jenis distribution', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);

    Santri::factory()->count(2)->create(['jenis' => SantriJenis::Ikhwan]);
    Santri::factory()->count(3)->create(['jenis' => SantriJenis::Akhwat]);
    Santri::factory()->count(1)->create(['jenis' => null]);

    $this->actingAs($admin)->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('santriByJenis', [
                ['key' => 'akhwat', 'label' => 'Akhwat', 'count' => 3],
                ['key' => 'ikhwan', 'label' => 'Ikhwan', 'count' => 2],
            ]));
});

test('admin dashboard includes mutabaah count delta for this and last month', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);

    Mutabaah::factory()->count(2)->create(['tanggal' => now()->subMonth()]);
    Mutabaah::factory()->count(4)->create(['tanggal' => now()]);

    $this->actingAs($admin)->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('mutabaahsThisMonth', 4)
            ->where('mutabaahsLastMonth', 2));
});

test('admin dashboard includes santris created this month', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);

    Santri::factory()->count(3)->create();

    $this->actingAs($admin)->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('santrisThisMonth', 3));
});

test('ustadz dashboard includes only their mutabaah status distribution', function () {
    $user = User::factory()->create(['role' => UserRole::Ustadz]);
    $ustadz = Ustadz::factory()->create(['user_id' => $user->id]);

    Mutabaah::factory()->count(2)->create(['ustadz_id' => $ustadz->id, 'status' => MutabaahStatus::Lulus]);
    Mutabaah::factory()->count(1)->create(['ustadz_id' => $ustadz->id, 'status' => MutabaahStatus::Mengulang]);

    $other = Ustadz::factory()->create();
    Mutabaah::factory()->count(5)->create(['ustadz_id' => $other->id, 'status' => MutabaahStatus::Lulus]);

    $this->actingAs($user)->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('mutabaahByStatus', [
                ['key' => 'lulus', 'label' => 'Lulus', 'count' => 2],
                ['key' => 'mengulang', 'label' => 'Mengulang', 'count' => 1],
            ]));
});

test('santri dashboard includes only their mutabaah status distribution', function () {
    $user = User::factory()->create(['role' => UserRole::Santri]);
    $santri = Santri::factory()->create(['user_id' => $user->id]);

    Mutabaah::factory()->count(2)->create(['santri_id' => $santri->id, 'status' => MutabaahStatus::Lulus]);
    Mutabaah::factory()->count(1)->create(['santri_id' => $santri->id, 'status' => MutabaahStatus::PerluMurajaah]);

    $other = Santri::factory()->create();
    Mutabaah::factory()->count(4)->create(['santri_id' => $other->id, 'status' => MutabaahStatus::Lulus]);

    $this->actingAs($user)->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('mutabaahByStatus', [
                ['key' => 'lulus', 'label' => 'Lulus', 'count' => 2],
                ['key' => 'perlu_murajaah', 'label' => 'Perlu Murajaah', 'count' => 1],
            ]));
});

test('orang tua dashboard includes children progress status distribution', function () {
    $user = User::factory()->create(['role' => UserRole::OrangTua]);
    $orangTua = OrangTua::factory()->create(['user_id' => $user->id]);

    $berlangsung = Santri::factory()->create(['orang_tua_id' => $orangTua->id, 'nama' => 'Anak A']);
    TargetHafalan::factory()->create(['santri_id' => $berlangsung->id, 'status' => TargetHafalanStatus::Berlangsung]);
    $selesai = Santri::factory()->create(['orang_tua_id' => $orangTua->id, 'nama' => 'Anak B']);
    TargetHafalan::factory()->create(['santri_id' => $selesai->id, 'status' => TargetHafalanStatus::Selesai]);

    $this->actingAs($user)->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('childrenProgress', [
                ['key' => 'berlangsung', 'label' => 'Berlangsung', 'count' => 1],
                ['key' => 'selesai', 'label' => 'Selesai', 'count' => 1],
            ]));
});
```

- [ ] **Step 2: Jalankan untuk memastikan gagal**

Run: `php artisan test --compact --filter=DashboardTest`
Expected: FAIL — prop baru (`mutabaahByStatus`, dst.) tidak ada.

- [ ] **Step 3: Implementasi**

Tambahkan `use` di `DashboardController.php`:

```php
use App\Enums\MutabaahStatus;
use App\Enums\SantriJenis;
use App\Enums\TargetHafalanStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
```

Ubah `admin()` menjadi:

```php
    private function admin(): Response
    {
        $now = now();

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
            'mutabaahByStatus' => $this->mutabaahStatusDistribution(Mutabaah::query()),
            'santriByJenis' => $this->santriJenisDistribution(),
            'mutabaahsThisMonth' => $this->mutabaahCountInMonth(Mutabaah::query(), $now),
            'mutabaahsLastMonth' => $this->mutabaahCountInMonth(Mutabaah::query(), $now->copy()->subMonth()),
            'santrisThisMonth' => Santri::query()
                ->whereYear('created_at', $now->year)
                ->whereMonth('created_at', $now->month)
                ->count(),
        ]);
    }
```

Ubah `ustadz()` menjadi (ganti baris `return Inertia::render(...)`):

```php
        $now = now();

        return Inertia::render('dashboard/ustadz', [
            'halaqahs' => $halaqahs,
            'recentMutabaahs' => $recentMutabaahs,
            'totalMutabaahs' => $ustadz->mutabaahs()->count(),
            'mutabaahByStatus' => $this->mutabaahStatusDistribution($ustadz->mutabaahs()),
            'mutabaahsThisMonth' => $this->mutabaahCountInMonth($ustadz->mutabaahs(), $now),
            'mutabaahsLastMonth' => $this->mutabaahCountInMonth($ustadz->mutabaahs(), $now->copy()->subMonth()),
        ]);
```

Ubah `santri()` menjadi:

```php
    private function santri(?Santri $santri): Response
    {
        abort_unless($santri !== null, 403, __('You do not have a santri profile.'));

        return Inertia::render('dashboard/santri', [
            'santri' => $santri->only(['id', 'nama', 'nis']),
            'progress' => $this->progressData($santri),
            'riwayat' => $santri->mutabaahs()->orderBy('tanggal', 'desc')->limit(10)->get(),
            'halaqahs' => $santri->halaqahs()->get(['halaqahs.id', 'halaqahs.nama']),
            'mutabaahByStatus' => $this->mutabaahStatusDistribution($santri->mutabaahs()),
        ]);
    }
```

Ubah `orangTua()` menjadi (simpan `$children` dulu):

```php
    private function orangTua(?OrangTua $orangTua): Response
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
            'childrenProgress' => $this->childrenProgressDistribution($children),
        ]);
    }
```

Tambahkan helper baru (sebelum `progressData`):

```php
    /**
     * @param  Builder<mixed>  $query
     * @return list<array{key: string, label: string, count: int}>
     */
    private function mutabaahStatusDistribution(Builder $query): array
    {
        return $query->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->orderByDesc('total')
            ->pluck('total', 'status')
            ->map(fn (int $count, string $status) => [
                'key' => $status,
                'label' => MutabaahStatus::tryFrom($status)?->label() ?? $status,
                'count' => $count,
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<array{key: string, label: string, count: int}>
     */
    private function santriJenisDistribution(): array
    {
        return Santri::query()
            ->whereNotNull('jenis')
            ->selectRaw('jenis, count(*) as total')
            ->groupBy('jenis')
            ->orderByDesc('total')
            ->pluck('total', 'jenis')
            ->map(fn (int $count, string $jenis) => [
                'key' => $jenis,
                'label' => SantriJenis::tryFrom($jenis)?->label() ?? $jenis,
                'count' => $count,
            ])
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, array{progress: array{status: string}}>  $children
     * @return list<array{key: string, label: string, count: int}>
     */
    private function childrenProgressDistribution(Collection $children): array
    {
        return $children
            ->map(fn (array $child) => $child['progress']['status'] ?? '')
            ->filter()
            ->countBy()
            ->sortKeys()
            ->map(fn (int $count, string $status) => [
                'key' => $status,
                'label' => TargetHafalanStatus::tryFrom($status)?->label() ?? $status,
                'count' => $count,
            ])
            ->values()
            ->all();
    }

    /**
     * @param  Builder<mixed>  $query
     */
    private function mutabaahCountInMonth(Builder $query, Carbon $month): int
    {
        return (clone $query)
            ->whereYear('tanggal', $month->year)
            ->whereMonth('tanggal', $month->month)
            ->count();
    }
```

- [ ] **Step 4: Jalankan test untuk memastikan lulus**

Run: `php artisan test --compact --filter=DashboardTest`
Expected: PASS (8 test baru + test lama tetap hijau).

- [ ] **Step 5: Pint + commit**

```powershell
vendor/bin/pint --dirty --format agent
git add app/Http/Controllers/DashboardController.php tests/Feature/DashboardTest.php
git commit -m "feat: add distribution aggregation payloads to dashboards"
```

---

### Task 3: Komponen shared frontend (hero, section, stat-card, donut)

**Files:**
- Create: `resources/js/components/dashboard/dashboard-hero.tsx`
- Create: `resources/js/components/dashboard/section-heading.tsx`
- Modify: `resources/js/components/dashboard/stat-card.tsx`
- Create: `resources/js/components/dashboard/charts/distribution-donut.tsx`
- Create: `resources/js/components/dashboard/charts/mutabaah-status-donut.tsx`
- Create: `resources/js/components/dashboard/charts/santri-jenis-donut.tsx`
- Create: `resources/js/components/dashboard/charts/children-progress-donut.tsx`

**Interfaces:**
- Consumes: `@/components/ui/chart` (Task 1), `recharts`, `@/lib/utils` (`cn`), `@inertiajs/react` `usePage`/`Link`, type `ChartConfig`.
- Produces:
  - `DashboardHero({ subtitle }: { subtitle: string })`
  - `SectionHeading({ title, description? }: { title: string; description?: string })`
  - `StatCard` props: `{ label, value, icon?, tone?, subtitle?, delta?, href? }` dengan `Tone = 'violet'|'indigo'|'fuchsia'|'teal'|'amber'`, `Delta = { direction: 'up'|'down'; value: string }`.
  - `ChartSlice = { key: string; label: string; count: number }` (export dari `distribution-donut.tsx`).
  - `DistributionDonut({ title, description?, data, config }: { title: string; description?: string; data: ChartSlice[]; config: ChartConfig })`
  - `MutabaahStatusDonut({ data }: { data: ChartSlice[] })`, `SantriJenisDonut({ data }: { data: ChartSlice[] })`, `ChildrenProgressDonut({ data }: { data: ChartSlice[] })`.

- [ ] **Step 1: Buat `dashboard-hero.tsx`**

```tsx
import { usePage } from '@inertiajs/react';

export default function DashboardHero({ subtitle }: { subtitle: string }) {
    const { auth } = usePage().props;

    const dateLabel = new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date());

    return (
        <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Selamat datang, {auth.user.name}</h1>
            <p className="text-sm text-muted-foreground">{dateLabel}</p>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
    );
}
```

- [ ] **Step 2: Buat `section-heading.tsx`**

```tsx
export default function SectionHeading({ title, description }: { title: string; description?: string }) {
    return (
        <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
    );
}
```

- [ ] **Step 3: Upgrade `stat-card.tsx`**

Ganti seluruh isi file dengan:

```tsx
import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Tone = 'violet' | 'indigo' | 'fuchsia' | 'teal' | 'amber';

type Delta = {
    direction: 'up' | 'down';
    value: string;
};

type StatCardProps = {
    label: string;
    value: string | number;
    icon?: LucideIcon;
    tone?: Tone;
    subtitle?: string;
    delta?: Delta;
    href?: string;
};

const toneClasses: Record<Tone, string> = {
    violet: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
    indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
    fuchsia: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300',
    teal: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
};

export default function StatCard({ label, value, icon: Icon, tone = 'violet', subtitle, delta, href }: StatCardProps) {
    const content = (
        <>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                {Icon && (
                    <span className={cn('flex size-9 items-center justify-center rounded-lg', toneClasses[tone])}>
                        <Icon className="size-4.5" />
                    </span>
                )}
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-semibold">{value}</p>
                {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
                {delta && (
                    <p className={cn('text-xs font-medium', delta.direction === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                        {delta.direction === 'up' ? '↑' : '↓'} {delta.value}
                    </p>
                )}
            </CardContent>
        </>
    );

    if (href) {
        return (
            <Link href={href} className="block">
                <Card className="transition-colors hover:border-foreground/20">{content}</Card>
            </Link>
        );
    }

    return <Card>{content}</Card>;
}
```

- [ ] **Step 4: Buat `charts/distribution-donut.tsx`**

```tsx
import { Cell, Pie, PieChart } from 'recharts';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { ChartConfig } from '@/components/ui/chart';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

export type ChartSlice = {
    key: string;
    label: string;
    count: number;
};

type Props = {
    title: string;
    description?: string;
    data: ChartSlice[];
    config: ChartConfig;
};

export default function DistributionDonut({ title, description, data, config }: Props) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Belum ada data</p>
                ) : (
                    <ChartContainer config={config} className="mx-auto aspect-square max-h-[250px]">
                        <PieChart>
                            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                            <Pie data={data} dataKey="count" nameKey="label" innerRadius={60} strokeWidth={5}>
                                {data.map((entry) => (
                                    <Cell key={entry.key} fill={`var(--color-${entry.key})`} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    );
}
```

- [ ] **Step 5: Buat `charts/mutabaah-status-donut.tsx`**

```tsx
import type { ChartConfig } from '@/components/ui/chart';
import DistributionDonut, { type ChartSlice } from '@/components/dashboard/charts/distribution-donut';

const config = {
    lulus: { label: 'Lulus', color: 'var(--chart-1)' },
    perlu_murajaah: { label: 'Perlu Murajaah', color: 'var(--chart-2)' },
    mengulang: { label: 'Mengulang', color: 'var(--chart-3)' },
} satisfies ChartConfig;

export default function MutabaahStatusDonut({ data }: { data: ChartSlice[] }) {
    return <DistributionDonut title="Status Mutabaah" description="Distribusi status setoran mutabaah" data={data} config={config} />;
}
```

- [ ] **Step 6: Buat `charts/santri-jenis-donut.tsx`**

```tsx
import type { ChartConfig } from '@/components/ui/chart';
import DistributionDonut, { type ChartSlice } from '@/components/dashboard/charts/distribution-donut';

const config = {
    ikhwan: { label: 'Ikhwan', color: 'var(--chart-1)' },
    akhwat: { label: 'Akhwat', color: 'var(--chart-2)' },
} satisfies ChartConfig;

export default function SantriJenisDonut({ data }: { data: ChartSlice[] }) {
    return <DistributionDonut title="Jenis Santri" description="Perbandingan santri ikhwan dan akhwat" data={data} config={config} />;
}
```

- [ ] **Step 7: Buat `charts/children-progress-donut.tsx`**

```tsx
import type { ChartConfig } from '@/components/ui/chart';
import DistributionDonut, { type ChartSlice } from '@/components/dashboard/charts/distribution-donut';

const config = {
    berlangsung: { label: 'Berlangsung', color: 'var(--chart-1)' },
    selesai: { label: 'Selesai', color: 'var(--chart-2)' },
} satisfies ChartConfig;

export default function ChildrenProgressDonut({ data }: { data: ChartSlice[] }) {
    return <DistributionDonut title="Progress Anak" description="Status target hafalan anak Anda" data={data} config={config} />;
}
```

- [ ] **Step 8: Verifikasi type + build**

Run: `npm run types:check; if ($?) { npm run build }`
Expected: keduanya sukses.

- [ ] **Step 9: Commit**

```powershell
git add resources/js/components/dashboard/
git commit -m "feat: add shared dashboard hero, section heading, stat-card and donut chart components"
```

---

### Task 4: Tema violet (app.css + sidebar + gradient)

**Files:**
- Modify: `resources/css/app.css:64-133` (blok `:root` dan `.dark`)
- Modify: `resources/js/components/app-sidebar.tsx:90-92` (blob dekoratif)
- Modify: `resources/js/layouts/app/app-sidebar-layout.tsx:16-20` (gradient background + blob)

**Interfaces:**
- Consumes: tidak ada.
- Produces: token `--primary`, `--ring`, `--chart-1..5`, `--sidebar`, dst. bernuansa violet (light + dark); varian Tailwind `bg-primary`, `text-primary`, `bg-sidebar`, `text-chart-1`, dst. otomatis mengikuti.

- [ ] **Step 1: Update token light (`:root`) di `app.css`**

Ganti blok `:root` (baris 64-98) menjadi:

```css
:root {
    --background: oklch(1 0 0);
    --foreground: oklch(0.125 0.03 293);
    --card: oklch(1 0 0);
    --card-foreground: oklch(0.125 0.03 293);
    --popover: oklch(1 0 0);
    --popover-foreground: oklch(0.125 0.03 293);
    --primary: oklch(0.541 0.245 293);
    --primary-foreground: oklch(0.985 0 0);
    --secondary: oklch(0.955 0.025 293);
    --secondary-foreground: oklch(0.205 0.04 293);
    --muted: oklch(0.955 0.025 293);
    --muted-foreground: oklch(0.51 0.03 293);
    --accent: oklch(0.955 0.025 293);
    --accent-foreground: oklch(0.205 0.04 293);
    --destructive: oklch(0.577 0.245 27.325);
    --destructive-foreground: oklch(0.577 0.245 27.325);
    --border: oklch(0.92 0.02 293);
    --input: oklch(0.92 0.02 293);
    --ring: oklch(0.62 0.19 293);
    --chart-1: oklch(0.541 0.245 293);
    --chart-2: oklch(0.585 0.233 277);
    --chart-3: oklch(0.647 0.267 307);
    --chart-4: oklch(0.69 0.17 165);
    --chart-5: oklch(0.79 0.17 85);
    --radius: 0.625rem;
    --sidebar: oklch(0.216 0.069 293);
    --sidebar-foreground: oklch(0.985 0 0);
    --sidebar-primary: oklch(0.985 0 0);
    --sidebar-primary-foreground: oklch(0.216 0.069 293);
    --sidebar-accent: oklch(1 0 0 / 0.1);
    --sidebar-accent-foreground: oklch(0.985 0 0);
    --sidebar-border: oklch(1 0 0 / 0.12);
    --sidebar-ring: oklch(1 0 0 / 0.3);
}
```

- [ ] **Step 2: Update token dark (`.dark`) di `app.css`**

Ganti blok `.dark` (baris 100-133) menjadi:

```css
.dark {
    --background: oklch(0.145 0.01 293);
    --foreground: oklch(0.985 0 0);
    --card: oklch(0.145 0.01 293);
    --card-foreground: oklch(0.985 0 0);
    --popover: oklch(0.145 0.01 293);
    --popover-foreground: oklch(0.985 0 0);
    --primary: oklch(0.686 0.246 293);
    --primary-foreground: oklch(0.125 0.03 293);
    --secondary: oklch(0.27 0.04 293);
    --secondary-foreground: oklch(0.985 0 0);
    --muted: oklch(0.27 0.04 293);
    --muted-foreground: oklch(0.72 0.02 293);
    --accent: oklch(0.27 0.04 293);
    --accent-foreground: oklch(0.985 0 0);
    --destructive: oklch(0.396 0.141 25.723);
    --destructive-foreground: oklch(0.637 0.237 25.331);
    --border: oklch(0.28 0.02 293);
    --input: oklch(0.28 0.02 293);
    --ring: oklch(0.58 0.2 293);
    --chart-1: oklch(0.686 0.246 293);
    --chart-2: oklch(0.7 0.2 277);
    --chart-3: oklch(0.76 0.22 307);
    --chart-4: oklch(0.76 0.17 165);
    --chart-5: oklch(0.82 0.16 85);
    --sidebar: oklch(0.216 0.069 293);
    --sidebar-foreground: oklch(0.985 0 0);
    --sidebar-primary: oklch(0.985 0 0);
    --sidebar-primary-foreground: oklch(0.216 0.069 293);
    --sidebar-accent: oklch(1 0 0 / 0.1);
    --sidebar-accent-foreground: oklch(0.985 0 0);
    --sidebar-border: oklch(1 0 0 / 0.12);
    --sidebar-ring: oklch(1 0 0 / 0.3);
}
```

- [ ] **Step 3: Ganti blob dekoratif sidebar di `app-sidebar.tsx`**

Ganti tiga baris blob emerald (baris 90-92) menjadi:

```tsx
                <div className="absolute -top-20 -right-12 size-60 rounded-full bg-violet-500/25 blur-3xl" />
                <div className="absolute -bottom-16 -left-10 size-44 rounded-full bg-violet-400/15 blur-3xl" />
                <div className="absolute top-1/2 left-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/10 blur-3xl" />
```

- [ ] **Step 4: Ganti gradient + blob di `app-sidebar-layout.tsx`**

Ganti `className` AppContent (baris 16) dan dua blob (baris 18-21) menjadi:

```tsx
            <AppContent
                variant="sidebar"
                className="relative overflow-hidden bg-gradient-to-br from-background via-background to-violet-500/5 dark:to-violet-500/10"
            >
                <div aria-hidden className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-24 right-10 size-72 rounded-full bg-violet-400/10 blur-3xl" />
                    <div className="absolute bottom-0 left-10 size-64 rounded-full bg-indigo-400/10 blur-3xl" />
                </div>
```

- [ ] **Step 5: Verifikasi build**

Run: `npm run types:check; if ($?) { npm run build }`
Expected: keduanya sukses.

- [ ] **Step 6: Cek visual (manual)**

Minta pengguna menjalankan `npm run dev` dan cek: tombol/primary violet di light & dark, sidebar violet gelap, gradient lembut violet/indigo.

- [ ] **Step 7: Commit**

```powershell
git add resources/css/app.css resources/js/components/app-sidebar.tsx resources/js/layouts/app/app-sidebar-layout.tsx
git commit -m "style: switch brand color to violet across theme tokens"
```

---

### Task 5: Halaman dashboard admin

**Files:**
- Modify: `resources/js/pages/dashboard/admin.tsx`

**Interfaces:**
- Consumes: `DashboardHero`, `SectionHeading`, `StatCard`, `MutabaahStatusDonut`, `SantriJenisDonut`, `@/routes/admin/santris` (`index`), props dari Task 2.
- Produces: halaman admin baru dengan hero + 5 stat card + section distribusi (2 donut) + Mutabaah Terbaru.

- [ ] **Step 1: Ganti seluruh isi `admin.tsx`**

```tsx
import { Head } from '@inertiajs/react';
import { BookOpen, ClipboardCheck, FolderGit2, GraduationCap, HeartHandshake } from 'lucide-react';
import StatCard from '@/components/dashboard/stat-card';
import DashboardHero from '@/components/dashboard/dashboard-hero';
import SectionHeading from '@/components/dashboard/section-heading';
import MutabaahStatusDonut from '@/components/dashboard/charts/mutabaah-status-donut';
import SantriJenisDonut from '@/components/dashboard/charts/santri-jenis-donut';
import PageContainer from '@/components/page-container';
import { dashboard } from '@/routes';
import { index as santrisIndex } from '@/routes/admin/santris';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type ChartSlice = {
    key: string;
    label: string;
    count: number;
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
    counts: {
        santris: number;
        ustadzs: number;
        orangTuas: number;
        halaqahs: number;
        mutabaahs: number;
    };
    recentMutabaahs: MutabaahRow[];
    mutabaahByStatus: ChartSlice[];
    santriByJenis: ChartSlice[];
    mutabaahsThisMonth: number;
    mutabaahsLastMonth: number;
    santrisThisMonth: number;
};

export default function AdminDashboard({
    counts,
    recentMutabaahs,
    mutabaahByStatus,
    santriByJenis,
    mutabaahsThisMonth,
    mutabaahsLastMonth,
    santrisThisMonth,
}: PageProps) {
    const mutabaahDelta = {
        direction: mutabaahsThisMonth >= mutabaahsLastMonth ? 'up' : 'down',
        value: `${Math.abs(mutabaahsThisMonth - mutabaahsLastMonth)} vs bulan lalu`,
    } as const;

    return (
        <PageContainer className="space-y-6">
            <Head title="Dashboard Admin" />
            <DashboardHero subtitle="Ringkasan data pesantren" />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <StatCard label="Santri" value={counts.santris} icon={GraduationCap} tone="violet" subtitle={`${santrisThisMonth} santri baru bulan ini`} href={santrisIndex()} />
                <StatCard label="Ustadz" value={counts.ustadzs} icon={BookOpen} tone="indigo" />
                <StatCard label="Orang Tua" value={counts.orangTuas} icon={HeartHandshake} tone="fuchsia" />
                <StatCard label="Halaqah" value={counts.halaqahs} icon={FolderGit2} tone="teal" />
                <StatCard label="Mutabaah" value={counts.mutabaahs} icon={ClipboardCheck} tone="amber" subtitle={`${mutabaahsThisMonth} bulan ini`} delta={mutabaahDelta} />
            </div>

            <section>
                <SectionHeading title="Distribusi Data" description="Status mutabaah dan jenis santri di pesantren" />
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <MutabaahStatusDonut data={mutabaahByStatus} />
                    <SantriJenisDonut data={santriByJenis} />
                </div>
            </section>

            <Card>
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
        </PageContainer>
    );
}

AdminDashboard.layout = {
    breadcrumbs: [{
        title: 'Dashboard',
        href: dashboard(),
    }],
};
```

- [ ] **Step 2: Verifikasi type + build**

Run: `npm run types:check; if ($?) { npm run build }`
Expected: keduanya sukses.

- [ ] **Step 3: Commit**

```powershell
git add resources/js/pages/dashboard/admin.tsx
git commit -m "feat: rebuild admin dashboard with hero and distribution charts"
```

---

### Task 6: Halaman dashboard ustadz

**Files:**
- Modify: `resources/js/pages/dashboard/ustadz.tsx`

**Interfaces:**
- Consumes: `DashboardHero`, `SectionHeading`, `StatCard`, `MutabaahStatusDonut`, `@/routes/ustadz/halaqahs` (`index`), props dari Task 2.
- Produces: halaman ustadz baru dengan hero + 3 stat card + section (donut + Halaqah Saya).

- [ ] **Step 1: Ganti seluruh isi `ustadz.tsx`**

```tsx
import { Head, Link } from '@inertiajs/react';
import { ClipboardCheck, FolderGit2, GraduationCap } from 'lucide-react';
import StatCard from '@/components/dashboard/stat-card';
import DashboardHero from '@/components/dashboard/dashboard-hero';
import SectionHeading from '@/components/dashboard/section-heading';
import MutabaahStatusDonut from '@/components/dashboard/charts/mutabaah-status-donut';
import PageContainer from '@/components/page-container';
import { dashboard } from '@/routes';
import { index as halaqahsIndex } from '@/routes/ustadz/halaqahs';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type ChartSlice = {
    key: string;
    label: string;
    count: number;
};

type HalaqahRow = {
    id: number;
    nama: string;
    santris_count: number;
};

type PageProps = {
    halaqahs: HalaqahRow[];
    totalMutabaahs: number;
    mutabaahByStatus: ChartSlice[];
    mutabaahsThisMonth: number;
    mutabaahsLastMonth: number;
};

export default function UstadzDashboard({
    halaqahs,
    totalMutabaahs,
    mutabaahByStatus,
    mutabaahsThisMonth,
    mutabaahsLastMonth,
}: PageProps) {
    const totalSantri = halaqahs.reduce((sum, h) => sum + h.santris_count, 0);

    const mutabaahDelta = {
        direction: mutabaahsThisMonth >= mutabaahsLastMonth ? 'up' : 'down',
        value: `${Math.abs(mutabaahsThisMonth - mutabaahsLastMonth)} vs bulan lalu`,
    } as const;

    return (
        <PageContainer className="space-y-6">
            <Head title="Dashboard Ustadz" />
            <DashboardHero subtitle="Ringkasan halaqah Anda" />

            <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label="Halaqah" value={halaqahs.length} icon={FolderGit2} tone="violet" href={halaqahsIndex()} />
                <StatCard label="Santri" value={totalSantri} icon={GraduationCap} tone="indigo" />
                <StatCard label="Mutabaah" value={totalMutabaahs} icon={ClipboardCheck} tone="fuchsia" subtitle={`${mutabaahsThisMonth} bulan ini`} delta={mutabaahDelta} />
            </div>

            <section>
                <SectionHeading title="Ringkasan Halaqah" description="Distribusi status mutabaah di halaqah Anda" />
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <MutabaahStatusDonut data={mutabaahByStatus} />
                    <Card>
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
                </div>
            </section>
        </PageContainer>
    );
}

UstadzDashboard.layout = {
    breadcrumbs: [{
        title: 'Dashboard',
        href: dashboard(),
    }],
};
```

- [ ] **Step 2: Verifikasi type + build**

Run: `npm run types:check; if ($?) { npm run build }`
Expected: keduanya sukses.

- [ ] **Step 3: Commit**

```powershell
git add resources/js/pages/dashboard/ustadz.tsx
git commit -m "feat: rebuild ustadz dashboard with hero and distribution chart"
```

---

### Task 7: Halaman dashboard santri (+ headline opsional di SantriProgressView)

**Files:**
- Modify: `resources/js/pages/dashboard/santri.tsx`
- Modify: `resources/js/components/santri-progress-view.tsx`

**Interfaces:**
- Consumes: `DashboardHero`, `SectionHeading`, `MutabaahStatusDonut`, `SantriProgressView`, props dari Task 2.
- Produces: halaman santri dengan hero + `SantriProgressView` tanpa headline (hero yang menyapa) + section distribusi mutabaah. `SantriProgressView` menerima `headline?: string` (opsional).

- [ ] **Step 1: Buat `headline` opsional di `santri-progress-view.tsx`**

Ubah tipe prop dan baris heading:

```tsx
}: {
    headline?: string;
    progress: Progress;
    riwayat: RiwayatRow[];
    halaqahs: { id: number; nama: string }[];
}) {
    return (
        <>
            {headline && <h1 className="text-lg font-semibold">{headline}</h1>}
```

- [ ] **Step 2: Ganti seluruh isi `santri.tsx`**

```tsx
import { Head } from '@inertiajs/react';
import DashboardHero from '@/components/dashboard/dashboard-hero';
import SectionHeading from '@/components/dashboard/section-heading';
import MutabaahStatusDonut from '@/components/dashboard/charts/mutabaah-status-donut';
import PageContainer from '@/components/page-container';
import SantriProgressView from '@/components/santri-progress-view';
import { dashboard } from '@/routes';

type ChartSlice = {
    key: string;
    label: string;
    count: number;
};

type RiwayatRow = {
    id: number;
    tanggal: string;
    jenis: string;
    surah: string;
    ayat_mulai: number;
    ayat_selesai: number;
    status: string;
};

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
    riwayat: RiwayatRow[];
    halaqahs: { id: number; nama: string }[];
    mutabaahByStatus: ChartSlice[];
};

export default function SantriDashboard({ progress, riwayat, halaqahs, mutabaahByStatus }: PageProps) {
    return (
        <PageContainer className="space-y-6">
            <Head title="Dashboard Santri" />
            <DashboardHero subtitle="Progres hafalan Anda" />
            <SantriProgressView progress={progress} riwayat={riwayat} halaqahs={halaqahs} />
            <section>
                <SectionHeading title="Distribusi Mutabaah" description="Status setoran mutabaah Anda" />
                <div className="mt-4 max-w-md">
                    <MutabaahStatusDonut data={mutabaahByStatus} />
                </div>
            </section>
        </PageContainer>
    );
}

SantriDashboard.layout = {
    breadcrumbs: [{
        title: 'Dashboard',
        href: dashboard(),
    }],
};
```

Catatan: prop `santri` tetap dikirim backend (Task 2) dan tetap ada di `PageProps`, tapi tidak di-destructure agar tidak jadi unused variable.

- [ ] **Step 3: Verifikasi type + build**

Run: `npm run types:check; if ($?) { npm run build }`
Expected: keduanya sukses.

- [ ] **Step 4: Commit**

```powershell
git add resources/js/pages/dashboard/santri.tsx resources/js/components/santri-progress-view.tsx
git commit -m "feat: rebuild santri dashboard with hero and distribution chart"
```

---

### Task 8: Halaman dashboard orang tua

**Files:**
- Modify: `resources/js/pages/dashboard/orang-tua.tsx`

**Interfaces:**
- Consumes: `DashboardHero`, `SectionHeading`, `ChildrenProgressDonut`, `SantriProgressView`, props dari Task 2.
- Produces: halaman orang tua dengan hero + section donut progress anak + progress view per anak.

- [ ] **Step 1: Ganti seluruh isi `orang-tua.tsx`**

```tsx
import { Head } from '@inertiajs/react';
import ChildrenProgressDonut from '@/components/dashboard/charts/children-progress-donut';
import DashboardHero from '@/components/dashboard/dashboard-hero';
import SectionHeading from '@/components/dashboard/section-heading';
import PageContainer from '@/components/page-container';
import SantriProgressView from '@/components/santri-progress-view';
import { dashboard } from '@/routes';

type ChartSlice = {
    key: string;
    label: string;
    count: number;
};

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
    childrenProgress: ChartSlice[];
};

export default function OrangTuaDashboard({ children, childrenProgress }: PageProps) {
    return (
        <PageContainer className="space-y-6">
            <Head title="Dashboard Orang Tua" />
            <DashboardHero subtitle="Progres anak Anda" />

            {children.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    Anda belum memiliki anak yang terdaftar di SIMAHAL.
                </p>
            ) : (
                <>
                    <section>
                        <SectionHeading title="Ringkasan Progress Anak" description="Status target hafalan anak Anda" />
                        <div className="mt-4 max-w-md">
                            <ChildrenProgressDonut data={childrenProgress} />
                        </div>
                    </section>

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
                </>
            )}
        </PageContainer>
    );
}

OrangTuaDashboard.layout = {
    breadcrumbs: [{
        title: 'Dashboard',
        href: dashboard(),
    }],
};
```

- [ ] **Step 2: Verifikasi type + build**

Run: `npm run types:check; if ($?) { npm run build }`
Expected: keduanya sukses.

- [ ] **Step 3: Commit**

```powershell
git add resources/js/pages/dashboard/orang-tua.tsx
git commit -m "feat: rebuild orang tua dashboard with hero and distribution chart"
```

---

### Task 9: Verifikasi akhir + commit

**Files:**
- Tidak ada perubahan kode (hanya verifikasi). Jika ada lint error kecil, perbaiki inline.

**Interfaces:**
- Consumes: seluruh output Task 1-8.

- [ ] **Step 1: Jalankan seluruh test backend**

Run: `php artisan test --compact`
Expected: semua test hijau (termasuk `DashboardTest` yang baru).

- [ ] **Step 2: Verifikasi typecheck + lint frontend**

Run: `npm run types:check; if ($?) { npm run lint:check }`
Expected: keduanya sukses tanpa error.

- [ ] **Step 3: Pint + build final**

```powershell
vendor/bin/pint --dirty --format agent
npm run build
```

- [ ] **Step 4: Cek status git**

Run: `git status`
Expected: hanya file Task 1-8 yang ter-commit; WIP tidak terkait (Excel import, `.ai/rules/*`, `opencode.json`) tetap uncommitted.

- [ ] **Step 5: Commit perbaikan lint (jika ada)**

```powershell
git add -A
git commit -m "chore: fix lint and formatting for dashboard overhaul"
```
Hanya jika Step 2/3 menghasilkan perubahan; jika tidak ada perubahan, lewati commit ini.
