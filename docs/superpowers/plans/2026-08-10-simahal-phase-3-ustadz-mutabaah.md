# SIMAHAL Phase 3: Ustadz Mutabaah & Target Hafalan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the ustadz workflow (PRD §5 "Ustadz mencatat mutabaah"): list their own halaqah, pick a santri, record a mutabaah (jenis, surah, ayat, nilai, status, catatan), manage target hafalan, and view mutabaah history with santri progress.

**Architecture:** Ustadz-scoped routes under `routes/ustadz.php` (middleware `role:ustadz`). Every query is scoped to halaqah where `ustadz_id` matches the logged-in user's `Ustadz` profile, enforced in controllers (authorization must be backend, PRD §8). Mutabaah creating/updating/deleting triggers a progress recalculation against the santri's most recent `TargetHafalan` via a dedicated `RecalculateTargetProgress` action.

**Tech Stack:** Laravel 13, Inertia v3 + React 19 + TypeScript, shadcn/ui, Wayfinder actions/routes, Pest.

## Global Constraints

- All ustadz routes require `middleware(['auth', 'verified', 'role:ustadz'])`.
- The current profile is resolved as `$request->user()->ustadz`; abort 403 (`abort_unless`) when a halaqah's `ustadz_id` does not match.
- Progress model: `TargetHafalan.progress` = count of ayat successfully setor. Only mutabaah with `jenis=setoran` and `status=lulus` count toward progress, summed as `ayat_selesai - ayat_mulai + 1`. Recalculation happens in one action class for every write.
- Use `Inertia::render`, `Inertia::flash('toast', ...)`, the `Form` + wayfinder `.form()` pattern, and `InputError` — same conventions as Phases 1-2.
- Indonesian copy. Pages set `page.layout = { breadcrumbs: [...] }`.
- Regenerate Wayfinder after adding routes: `php artisan wayfinder:generate`. Delete stale generated files.
- Run `vendor/bin/pint --dirty --format agent` after PHP edits.

---

### Task 1: Ustadz dashboard (Halaqah Saya)

**Files:**
- Create: `routes/ustadz.php`
- Modify: `routes/web.php`
- Create: `app/Http/Controllers/Ustadz/HalaqahController.php`
- Create: `resources/js/pages/ustadz/halaqahs/index.tsx`
- Test: `tests/Feature/Ustadz/HalaqahSayaTest.php`

**Interfaces:**
- Consumes: `Ustadz`, `Halaqah`, `HalaqahMember` models (Phase 1), `role` middleware.
- Produces route `ustadz.halaqahs.index` and page `resources/js/pages/ustadz/halaqahs/index.tsx` with prop `halaqahs` (paginated list, each with `nama`, `jadwal`, `status`, `santri_count`).

- [ ] **Step 1: Write the failing feature test**

Create `tests/Feature/Ustadz/HalaqahSayaTest.php`:

```php
<?php

use App\Enums\UserRole;
use App\Models\Halaqah;
use App\Models\Santri;
use App\Models\Ustadz;
use App\Models\User;

test('ustadz sees only their own halaqah', function () {
    $user = User::factory()->create(['role' => UserRole::Ustadz]);
    $ustadz = Ustadz::factory()->create(['user_id' => $user->id]);
    $own = Halaqah::factory()->create(['ustadz_id' => $ustadz->id, 'nama' => 'Halaqah Milik Saya']);
    $other = Ustadz::factory()->create();
    Halaqah::factory()->create(['ustadz_id' => $other->id, 'nama' => 'Halaqah Bukan Saya']);

    $this->actingAs($user)->get(route('ustadz.halaqahs.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('ustadz/halaqahs/index')
            ->has('halaqahs.data', 1)
            ->where('halaqahs.data.0.nama', 'Halaqah Milik Saya'));
});

test('santri count is included per halaqah', function () {
    $user = User::factory()->create(['role' => UserRole::Ustadz]);
    $ustadz = Ustadz::factory()->create(['user_id' => $user->id]);
    $halaqah = Halaqah::factory()->create(['ustadz_id' => $ustadz->id]);
    $halaqah->santris()->attach(Santri::factory()->create()->id);

    $this->actingAs($user)->get(route('ustadz.halaqahs.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('halaqahs.data.0.santri_count')
            ->where('halaqahs.data.0.santri_count', 1));
});

test('non-ustadz cannot access ustadz halaqah list', function () {
    $santri = User::factory()->create(['role' => UserRole::Santri]);

    $this->actingAs($santri)->get(route('ustadz.halaqahs.index'))->assertForbidden();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --compact tests/Feature/Ustadz/HalaqahSayaTest.php`
Expected: FAIL — route `ustadz.halaqahs.index` not defined.

- [ ] **Step 3: Create the routes file**

Create `routes/ustadz.php`:

```php
<?php

use App\Http\Controllers\Ustadz\HalaqahController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:ustadz'])->prefix('ustadz')->name('ustadz.')->group(function () {
    Route::get('halaqah-saya', [HalaqahController::class, 'index'])->name('halaqahs.index');
});
```

- [ ] **Step 4: Register the routes file**

Edit `routes/web.php` — add at the very end:

```php
require __DIR__.'/ustadz.php';
```

- [ ] **Step 5: Create the controller**

Create `app/Http/Controllers/Ustadz/HalaqahController.php`:

```php
<?php

namespace App\Http\Controllers\Ustadz;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HalaqahController extends Controller
{
    public function index(Request $request): Response
    {
        $ustadz = $request->user()->ustadz;

        abort_unless($ustadz !== null, 403, __('You do not have a ustadz profile.'));

        $halaqahs = $ustadz->halaqahs()
            ->withCount('santris')
            ->orderBy('nama')
            ->paginate(15);

        return Inertia::render('ustadz/halaqahs/index', [
            'halaqahs' => $halaqahs,
        ]);
    }
}
```

- [ ] **Step 6: Regenerate Wayfinder and run tests**

```bash
php artisan wayfinder:generate
php artisan test --compact tests/Feature/Ustadz/HalaqahSayaTest.php
```

Expected: PASS.

- [ ] **Step 7: Create the Inertia page**

Create `resources/js/pages/ustadz/halaqahs/index.tsx`:

```tsx
import { Link } from '@inertiajs/react';
import Heading from '@/components/heading';
import { index } from '@/routes/ustadz/halaqahs';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type HalaqahRow = {
    id: number;
    nama: string;
    jadwal: string | null;
    status: string;
    santri_count: number;
};

export default function UstadzHalaqahsIndex({ halaqahs }: { halaqahs: { data: HalaqahRow[]; total: number } }) {
    return (
        <>
            <Heading title="Halaqah Saya" description="Pilih halaqah untuk melihat santri dan mencatat mutabaah." />

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Halaqah ({halaqahs.total})</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="divide-y rounded-lg border">
                        {halaqahs.data.map((halaqah) => (
                            <li key={halaqah.id} className="flex items-center justify-between gap-4 p-4">
                                <div>
                                    <p className="font-medium">{halaqah.nama}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {halaqah.jadwal ?? 'Belum ada jadwal'} · {halaqah.santri_count} santri
                                    </p>
                                </div>
                                <Badge variant="secondary">{halaqah.status}</Badge>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </>
    );
}

UstadzHalaqahsIndex.layout = {
    breadcrumbs: [{
        title: 'Halaqah Saya',
        href: index(),
    }],
};
```

Note: `index()` resolves from route name `ustadz.halaqahs.index` (URL `/ustadz/halaqah-saya`), generated under `resources/js/routes/ustadz/halaqahs/`.

- [ ] **Step 8: Verify types, format, commit**

```bash
npm run types:check
vendor/bin/pint --dirty --format agent
git add routes/ustadz.php routes/web.php app/Http/Controllers/Ustadz resources/js/pages/ustadz/halaqahs tests/Feature/Ustadz/HalaqahSayaTest.php
git commit -m "feat: ustadz halaqah saya list"
```

---

### Task 2: Mutabaah recording (create) with progress recalculation

**Files:**
- Modify: `routes/ustadz.php`
- Create: `app/Actions/Mutabaah/RecalculateTargetProgress.php`
- Create: `app/Http/Controllers/Ustadz/MutabaahController.php`
- Create: `app/Http/Requests/Ustadz/StoreMutabaahRequest.php`
- Create: `resources/js/pages/ustadz/mutabaahs/create.tsx`
- Test: `tests/Feature/Ustadz/MutabaahStoreTest.php`
- Test: `tests/Unit/RecalculateTargetProgressTest.php`

**Interfaces:**
- Consumes: `Santri`, `Halaqah`, `Mutabaah`, `TargetHafalan` models; `MutabaahJenis`, `MutabaahStatus`, `TargetHafalanStatus` enums (Phase 1).
- Produces:
  - Action `RecalculateTargetProgress::run(Santri $santri): void` — recomputes `progress` on the santri's latest `TargetHafalan` (ordered by `updated_at`/id, status `berlangsung` preferred) as the sum of ayat spans (`ayat_selesai - ayat_mulai + 1`) of mutabaah with `jenis=setoran`, `status=lulus`, capped at `target`.
  - Routes `ustadz.halaqahs.santris.show` (santri picker per halaqah), `ustadz.mutabaahs.create` (form), `ustadz.mutabaahs.store`.
  - Page `resources/js/pages/ustadz/mutabaahs/create.tsx` with props `santri`, `ustadzList` (available ustadz profiles), `jenisOptions`, `statusOptions`.

- [ ] **Step 1: Write the failing unit test for the progress action**

Create `tests/Unit/RecalculateTargetProgressTest.php`:

```php
<?php

use App\Actions\Mutabaah\RecalculateTargetProgress;
use App\Enums\MutabaahJenis;
use App\Enums\MutabaahStatus;
use App\Enums\TargetHafalanStatus;
use App\Models\Mutabaah;
use App\Models\Santri;
use App\Models\TargetHafalan;

test('progress sums ayat spans of lulus setoran mutabaah', function () {
    $santri = Santri::factory()->create();
    $target = TargetHafalan::factory()->create([
        'santri_id' => $santri->id,
        'target' => 100,
        'progress' => 0,
    ]);

    Mutabaah::factory()->create([
        'santri_id' => $santri->id,
        'jenis' => MutabaahJenis::Setoran,
        'status' => MutabaahStatus::Lulus,
        'ayat_mulai' => 1,
        'ayat_selesai' => 7,
    ]);
    Mutabaah::factory()->create([
        'santri_id' => $santri->id,
        'jenis' => MutabaahJenis::Setoran,
        'status' => MutabaahStatus::Lulus,
        'ayat_mulai' => 8,
        'ayat_selesai' => 15,
    ]);

    RecalculateTargetProgress::run($santri);

    expect($target->fresh()->progress)->toBe(15);
});

test('non-lulus and murajaah mutabaah are excluded', function () {
    $santri = Santri::factory()->create();
    $target = TargetHafalan::factory()->create([
        'santri_id' => $santri->id,
        'target' => 100,
        'progress' => 0,
    ]);

    Mutabaah::factory()->create([
        'santri_id' => $santri->id,
        'jenis' => MutabaahJenis::Setoran,
        'status' => MutabaahStatus::Mengulang,
        'ayat_mulai' => 1,
        'ayat_selesai' => 10,
    ]);
    Mutabaah::factory()->create([
        'santri_id' => $santri->id,
        'jenis' => MutabaahJenis::Murajaah,
        'status' => MutabaahStatus::Lulus,
        'ayat_mulai' => 1,
        'ayat_selesai' => 20,
    ]);

    RecalculateTargetProgress::run($santri);

    expect($target->fresh()->progress)->toBe(0);
});

test('progress is capped at target', function () {
    $santri = Santri::factory()->create();
    $target = TargetHafalan::factory()->create([
        'santri_id' => $santri->id,
        'target' => 10,
        'progress' => 0,
    ]);

    Mutabaah::factory()->create([
        'santri_id' => $santri->id,
        'jenis' => MutabaahJenis::Setoran,
        'status' => MutabaahStatus::Lulus,
        'ayat_mulai' => 1,
        'ayat_selesai' => 30,
    ]);

    RecalculateTargetProgress::run($santri);

    expect($target->fresh()->progress)->toBe(10);
});

test('santri with no berlangsung target does nothing', function () {
    $santri = Santri::factory()->create();
    TargetHafalan::factory()->create([
        'santri_id' => $santri->id,
        'status' => TargetHafalanStatus::Selesai,
    ]);

    RecalculateTargetProgress::run($santri);

    expect($santri->fresh()->targetHafalans->first()->progress)->toBe(0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --compact tests/Unit/RecalculateTargetProgressTest.php`
Expected: FAIL — class `App\Actions\Mutabaah\RecalculateTargetProgress` not found.

- [ ] **Step 3: Create the action**

Run: `php artisan make:action Mutabaah/RecalculateTargetProgress --no-interaction` (if the command is unavailable, create the file manually under `app/Actions/Mutabaah/`). Then set content:

```php
<?php

namespace App\Actions\Mutabaah;

use App\Enums\MutabaahJenis;
use App\Enums\MutabaahStatus;
use App\Enums\TargetHafalanStatus;
use App\Models\Santri;
use App\Models\TargetHafalan;

class RecalculateTargetProgress
{
    /**
     * Recalculate and store the ayat progress for the santri's active target.
     */
    public function run(Santri $santri): void
    {
        $target = $santri->targetHafalans()
            ->orderBy('status', 'desc')
            ->orderBy('id', 'desc')
            ->first();

        if ($target === null || $target->status !== TargetHafalanStatus::Berlangsung) {
            return;
        }

        $progress = $santri->mutabaahs()
            ->get()
            ->filter(fn ($mutabaah) => $mutabaah->jenis === MutabaahJenis::Setoran && $mutabaah->status === MutabaahStatus::Lulus)
            ->sum(fn ($mutabaah) => max(0, $mutabaah->ayat_selesai - $mutabaah->ayat_mulai + 1));

        $target->update(['progress' => min($progress, $target->target)]);
    }
}
```

Note: `orderBy('status', 'desc')` relies on the lexicographic order of the string-backed enum values where `selesai` > `berlangsung`; combined with `orderBy('id','desc')` it selects the most recent `berlangsung` target if one exists. Simpler alternative accepted by tests: filter `where('status', berlangsung)->latest()` — either is fine; keep one consistent approach.

- [ ] **Step 4: Run unit tests to verify**

Run: `php artisan test --compact tests/Unit/RecalculateTargetProgressTest.php`
Expected: PASS.

- [ ] **Step 5: Write the failing feature test**

Create `tests/Feature/Ustadz/MutabaahStoreTest.php`:

```php
<?php

use App\Enums\MutabaahJenis;
use App\Enums\MutabaahStatus;
use App\Enums\UserRole;
use App\Models\Halaqah;
use App\Models\Mutabaah;
use App\Models\Santri;
use App\Models\TargetHafalan;
use App\Models\Ustadz;
use App\Models\User;

function makeActingUstadz(TestCase $test): Ustadz
{
    $user = User::factory()->create(['role' => UserRole::Ustadz]);
    $ustadz = Ustadz::factory()->create(['user_id' => $user->id]);
    $test->actingAs($user);

    return $ustadz;
}

test('santri list page shows only halaqah members of the ustadz', function () {
    $ustadz = makeActingUstadz($this);
    $halaqah = Halaqah::factory()->create(['ustadz_id' => $ustadz->id]);
    $member = Santri::factory()->create();
    $halaqah->santris()->attach($member->id);
    $stranger = Santri::factory()->create();

    $this->get(route('ustadz.halaqahs.santris.show', $halaqah))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('santris.data', 1));

    $this->assertTrue($stranger->halaqahs()->where('halaqah_id', $halaqah->id)->doesntExist());
});

test('ustadz cannot open another ustadz halaqah', function () {
    $ustadz = makeActingUstadz($this);
    $other = Ustadz::factory()->create();
    $halaqah = Halaqah::factory()->create(['ustadz_id' => $other->id]);

    $this->get(route('ustadz.halaqahs.santris.show', $halaqah))->assertForbidden();
});

test('ustadz can record a mutabaah for a member santri of their halaqah', function () {
    $ustadz = makeActingUstadz($this);
    $halaqah = Halaqah::factory()->create(['ustadz_id' => $ustadz->id]);
    $santri = Santri::factory()->create();
    $halaqah->santris()->attach($santri->id);
    TargetHafalan::factory()->create(['santri_id' => $santri->id, 'target' => 30]);

    $this->get(route('ustadz.mutabaahs.create', $santri))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('ustadz/mutabaahs/create'));

    $this->post(route('ustadz.mutabaahs.store'), [
        'santri_id' => $santri->id,
        'tanggal' => now()->toDateString(),
        'jenis' => MutabaahJenis::Setoran->value,
        'surah' => 'Al-Fatihah',
        'ayat_mulai' => 1,
        'ayat_selesai' => 7,
        'nilai' => 90,
        'status' => MutabaahStatus::Lulus->value,
        'catatan' => 'Lancar.',
    ])->assertRedirect();

    $this->assertDatabaseHas('mutabaahs', [
        'santri_id' => $santri->id,
        'ustadz_id' => $ustadz->id,
        'surah' => 'Al-Fatihah',
        'status' => MutabaahStatus::Lulus->value,
    ]);

    expect($santri->targetHafalans()->first()->progress)->toBe(7);
});

test('ustadz cannot set ustadz_id for a mutabaah they do not own', function () {
    $ustadz = makeActingUstadz($this);
    $other = Ustadz::factory()->create();
    $halaqah = Halaqah::factory()->create(['ustadz_id' => $ustadz->id]);
    $santri = Santri::factory()->create();
    $halaqah->santris()->attach($santri->id);

    $this->post(route('ustadz.mutabaahs.store'), [
        'santri_id' => $santri->id,
        'ustadz_id' => $other->id,
        'tanggal' => now()->toDateString(),
        'jenis' => MutabaahJenis::Murajaah->value,
        'surah' => 'Al-Fatihah',
        'ayat_mulai' => 1,
        'ayat_selesai' => 7,
        'nilai' => 90,
        'status' => MutabaahStatus::Lulus->value,
    ])->assertRedirect();

    expect(Mutabaah::latest()->first()->ustadz_id)->toBe($ustadz->id);
});

test('non-ustadz cannot access mutabaah pages', function () {
    $santriUser = User::factory()->create(['role' => UserRole::Santri]);
    $santri = Santri::factory()->create(['user_id' => $santriUser->id]);

    $this->actingAs($santriUser)->get(route('ustadz.mutabaahs.create', $santri))->assertForbidden();
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `php artisan test --compact tests/Feature/Ustadz/MutabaahStoreTest.php`
Expected: FAIL — routes not defined.

- [ ] **Step 7: Register routes**

Edit `routes/ustadz.php` — add:

```php
use App\Http\Controllers\Ustadz\MutabaahController;

Route::get('halaqah-saya/{halaqah}/santri', [HalaqahController::class, 'santris'])->name('halaqahs.santris.show');
Route::get('mutabaah/{santri}/baru', [MutabaahController::class, 'create'])->name('mutabaahs.create');
Route::post('mutabaah', [MutabaahController::class, 'store'])->name('mutabaahs.store');
```

- [ ] **Step 8: Add the `santris` method to HalaqahController**

Edit `app/Http/Controllers/Ustadz/HalaqahController.php` — add below `index`:

```php
public function santris(Request $request, Halaqah $halaqah): Response
{
    $ustadz = $request->user()->ustadz;

    abort_unless($ustadz?->id === $halaqah->ustadz_id, 403, __('You do not manage this halaqah.'));

    $santris = $halaqah->santris()
        ->orderBy('nama')
        ->paginate(15);

    return Inertia::render('ustadz/halaqahs/santris', [
        'halaqah' => $halaqah,
        'santris' => $santris,
    ]);
}
```

The `route('ustadz.halaqahs.santris.show', $halaqah)` renders `ustadz/halaqahs/santris.tsx`. Create that page in Step 10 too (list of members, each linking to the create-mutabaah page).

- [ ] **Step 9: Create the StoreMutabaahRequest**

Create `app/Http/Requests/Ustadz/StoreMutabaahRequest.php`:

```php
<?php

namespace App\Http\Requests\Ustadz;

use App\Enums\MutabaahJenis;
use App\Enums\MutabaahStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreMutabaahRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'santri_id' => ['required', 'exists:santris,id'],
            'tanggal' => ['required', 'date'],
            'jenis' => ['required', new Enum(MutabaahJenis::class)],
            'surah' => ['required', 'string', 'max:100'],
            'ayat_mulai' => ['required', 'integer', 'min:1'],
            'ayat_selesai' => ['required', 'integer', 'gte:ayat_mulai'],
            'nilai' => ['nullable', 'integer', 'between:0,100'],
            'status' => ['required', new Enum(MutabaahStatus::class)],
            'catatan' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
```

- [ ] **Step 10: Create the MutabaahController**

Create `app/Http/Controllers/Ustadz/MutabaahController.php`:

```php
<?php

namespace App\Http\Controllers\Ustadz;

use App\Actions\Mutabaah\RecalculateTargetProgress;
use App\Enums\MutabaahJenis;
use App\Enums\MutabaahStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Ustadz\StoreMutabaahRequest;
use App\Models\Halaqah;
use App\Models\Mutabaah;
use App\Models\Santri;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MutabaahController extends Controller
{
    public function create(Request $request, Santri $santri): Response
    {
        $ustadz = $request->user()->ustadz;

        abort_unless($ustadz !== null, 403, __('You do not have a ustadz profile.'));

        $owned = $ustadz->halaqahs()->whereHas('santris', fn ($q) => $q->whereKey($santri->id))->count() > 0;

        abort_unless($owned, 403, __('This santri is not in any of your halaqah.'));

        return Inertia::render('ustadz/mutabaahs/create', [
            'santri' => $santri->only(['id', 'nama', 'nis']),
            'jenisOptions' => collect(MutabaahJenis::cases())->map(fn (MutabaahJenis $jenis) => [
                'value' => $jenis->value,
                'label' => $jenis->label(),
            ]),
            'statusOptions' => collect(MutabaahStatus::cases())->map(fn (MutabaahStatus $status) => [
                'value' => $status->value,
                'label' => $status->label(),
            ]),
        ]);
    }

    public function store(StoreMutabaahRequest $request, RecalculateTargetProgress $recalculate): RedirectResponse
    {
        $validated = $request->validated();
        $ustadz = $request->user()->ustadz;

        abort_unless($ustadz !== null, 403, __('You do not have a ustadz profile.'));

        $memberSantri = $ustadz->halaqahs()
            ->whereHas('santris', fn ($q) => $q->whereKey($validated['santri_id']))
            ->exists();

        abort_unless($memberSantri, 403, __('This santri is not in any of your halaqah.'));

        $mutabaah = Mutabaah::create([
            'santri_id' => $validated['santri_id'],
            'ustadz_id' => $ustadz->id,
            'tanggal' => $validated['tanggal'],
            'jenis' => $validated['jenis'],
            'surah' => $validated['surah'],
            'ayat_mulai' => $validated['ayat_mulai'],
            'ayat_selesai' => $validated['ayat_selesai'],
            'nilai' => $validated['nilai'] ?? null,
            'status' => $validated['status'],
            'catatan' => $validated['catatan'] ?? null,
        ]);

        $recalculate->run($mutabaah->santri);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Mutabaah recorded.')]);

        return to_route('ustadz.mutabaahs.create', $validated['santri_id']);
    }
}
```

- [ ] **Step 11: Regenerate Wayfinder and run tests**

```bash
php artisan wayfinder:generate
php artisan test --compact tests/Unit/RecalculateTargetProgressTest.php tests/Feature/Ustadz/MutabaahStoreTest.php
```

Expected: PASS.

- [ ] **Step 12: Create the create-mutabaah page**

Create `resources/js/pages/ustadz/mutabaahs/create.tsx`:

```tsx
import { Form, Link } from '@inertiajs/react';
import MutabaahController from '@/actions/App/Http/Controllers/Ustadz/MutabaahController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { index as halaqahIndex } from '@/routes/ustadz/halaqahs';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type Option = { value: string; label: string };

type PageProps = {
    santri: { id: number; nama: string; nis?: string | null };
    jenisOptions: Option[];
    statusOptions: Option[];
};

export default function UstadzMutabaahCreate({ santri, jenisOptions, statusOptions }: PageProps) {
    return (
        <>
            <Heading title="Catat Mutabaah" description={`Santri: ${santri.nama}${santri.nis ? ` (${santri.nis})` : ''}`} />

            <Card>
                <CardHeader>
                    <CardTitle>Form Mutabaah</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...MutabaahController.store.form()} className="space-y-4">
                        {({ errors }) => (
                            <>
                                <input type="hidden" name="santri_id" value={santri.id} />

                                <div className="grid gap-2">
                                    <Label htmlFor="tanggal">Tanggal</Label>
                                    <Input id="tanggal" name="tanggal" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
                                    <InputError message={errors.tanggal} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="jenis">Jenis</Label>
                                    <Select name="jenis" required defaultValue="setoran">
                                        <SelectTrigger id="jenis"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {jenisOptions.map((o) => (
                                                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.jenis} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="surah">Surah</Label>
                                    <Input id="surah" name="surah" required placeholder="Contoh: Al-Baqarah" />
                                    <InputError message={errors.surah} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="ayat_mulai">Ayat Mulai</Label>
                                        <Input id="ayat_mulai" name="ayat_mulai" type="number" min={1} required />
                                        <InputError message={errors.ayat_mulai} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="ayat_selesai">Ayat Selesai</Label>
                                        <Input id="ayat_selesai" name="ayat_selesai" type="number" min={1} required />
                                        <InputError message={errors.ayat_selesai} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="nilai">Nilai (0-100)</Label>
                                        <Input id="nilai" name="nilai" type="number" min={0} max={100} />
                                        <InputError message={errors.nilai} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="status">Status</Label>
                                        <Select name="status" required defaultValue="lulus">
                                            <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {statusOptions.map((o) => (
                                                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.status} />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="catatan">Catatan</Label>
                                    <textarea
                                        id="catatan"
                                        name="catatan"
                                        rows={3}
                                        className="w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs"
                                        placeholder="Contoh: Tajwid sudah baik, perlu murajaah di rumah."
                                    />
                                    <InputError message={errors.catatan} />
                                </div>

                                <div className="flex gap-2">
                                    <Button type="submit">Simpan Mutabaah</Button>
                                    <Button asChild variant="outline">
                                        <Link href={halaqahIndex()}>Kembali</Link>
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </CardContent>
            </Card>
        </>
    );
}
```

Create `resources/js/pages/ustadz/halaqahs/santris.tsx` (member list; each row links to the create page):

```tsx
import { Link } from '@inertiajs/react';
import Heading from '@/components/heading';
import { create } from '@/routes/ustadz/mutabaahs/create';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type SantriRow = {
    id: number;
    nama: string;
    nis?: string | null;
};

type Halaqah = { id: number; nama: string };

export default function UstadzHalaqahSantris({ halaqah, santris }: { halaqah: Halaqah; santris: { data: SantriRow[]; total: number } }) {
    return (
        <>
            <Heading title={halaqah.nama} description="Daftar santri dalam halaqah ini." />

            <Card>
                <CardHeader>
                    <CardTitle>Santri ({santris.total})</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="divide-y rounded-lg border">
                        {santris.data.map((santri) => (
                            <li key={santri.id} className="flex items-center justify-between gap-4 p-4">
                                <div>
                                    <p className="font-medium">{santri.nama}</p>
                                    {santri.nis && <p className="text-sm text-muted-foreground">{santri.nis}</p>}
                                </div>
                                <Button asChild size="sm">
                                    <Link href={create({ santri: santri.id })}>Catat Mutabaah</Link>
                                </Button>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </>
    );
}
```

Note: the `create` helper is generated from route name `ustadz.mutabaahs.create`; adjust the import path to whatever Wayfinder emits (check `resources/js/routes/ustadz/mutabaah/create.ts`).

- [ ] **Step 13: Verify types, format, commit**

```bash
npm run types:check
vendor/bin/pint --dirty --format agent
git add routes/ustadz.php app/Actions/Mutabaah app/Http/Controllers/Ustadz/MutabaahController.php app/Http/Controllers/Ustadz/HalaqahController.php app/Http/Requests/Ustadz resources/js/pages/ustadz tests/Unit/RecalculateTargetProgressTest.php tests/Feature/Ustadz/MutabaahStoreTest.php
git commit -m "feat: ustadz records mutabaah with progress recalculation"
```

---

### Task 3: Mutabaah history (ustadz and santri riwayat)

**Files:**
- Modify: `routes/ustadz.php`
- Create: `app/Http/Controllers/Ustadz/MutabaahHistoryController.php`
- Create: `resources/js/pages/ustadz/mutabaahs/history.tsx`
- Test: `tests/Feature/Ustadz/MutabaahHistoryTest.php`

**Interfaces:**
- Consumes: `Mutabaah`, `Santri`, `Ustadz` models (Phases 1-2).
- Produces route `ustadz.mutabaahs.history` and page `resources/js/pages/ustadz/mutabaahs/history.tsx` with props `mutabaahs` (paginated, each with `santri`, `jenis`, `surah`, `ayat_mulai`, `ayat_selesai`, `nilai`, `status`, `tanggal`, `catatan`) and `santriOptions` (member santri of the ustadz, `Array<{ id, nama }>`).

- [ ] **Step 1: Write the failing feature test**

Create `tests/Feature/Ustadz/MutabaahHistoryTest.php`:

```php
<?php

use App\Enums\UserRole;
use App\Models\Halaqah;
use App\Models\Mutabaah;
use App\Models\Santri;
use App\Models\Ustadz;
use App\Models\User;

function makingUstadz(TestCase $test): Ustadz
{
    $user = User::factory()->create(['role' => UserRole::Ustadz]);
    $ustadz = Ustadz::factory()->create(['user_id' => $user->id]);
    $test->actingAs($user);

    return $ustadz;
}

test('ustadz sees mutabaah history for mutabaah they recorded', function () {
    $ustadz = makingUstadz($this);
    $santri = Santri::factory()->create();
    Mutabaah::factory()->count(3)->create(['ustadz_id' => $ustadz->id, 'santri_id' => $santri->id]);
    $other = Ustadz::factory()->create();
    Mutabaah::factory()->create(['ustadz_id' => $other->id, 'santri_id' => $santri->id]);

    $this->get(route('ustadz.mutabaahs.history'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('mutabaahs.data', 3));
});

test('history can be filtered by a member santri', function () {
    $ustadz = makingUstadz($this);
    $santriA = Santri::factory()->create();
    $santriB = Santri::factory()->create();
    Mutabaah::factory()->create(['ustadz_id' => $ustadz->id, 'santri_id' => $santriA->id]);
    Mutabaah::factory()->create(['ustadz_id' => $ustadz->id, 'santri_id' => $santriB->id]);

    $this->get(route('ustadz.mutabaahs.history', ['santri' => $santriA->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('mutabaahs.data', 1));
});

test('non-ustadz cannot access history', function () {
    $santri = User::factory()->create(['role' => UserRole::Santri]);

    $this->actingAs($santri)->get(route('ustadz.mutabaahs.history'))->assertForbidden();
});
```

Caution: this file defines a global `makingUstadz` helper — do NOT define the same helper in the same directory as `MutabaahStoreTest.php` uses `makeActingUstadz`; keep names unique across files.

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --compact tests/Feature/Ustadz/MutabaahHistoryTest.php`
Expected: FAIL — route `ustadz.mutabaahs.history` not defined.

- [ ] **Step 3: Register the route**

Edit `routes/ustadz.php` — add inside the group:

```php
use App\Http\Controllers\Ustadz\MutabaahHistoryController;

Route::get('mutabaah/riwayat', [MutabaahHistoryController::class, 'index'])->name('mutabaahs.history');
```

- [ ] **Step 4: Create the controller**

Create `app/Http/Controllers/Ustadz/MutabaahHistoryController.php`:

```php
<?php

namespace App\Http\Controllers\Ustadz;

use App\Http\Controllers\Controller;
use App\Models\Santri;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MutabaahHistoryController extends Controller
{
    public function index(Request $request): Response
    {
        $ustadz = $request->user()->ustadz;

        abort_unless($ustadz !== null, 403, __('You do not have a ustadz profile.'));

        $santriOptions = $ustadz->halaqahs()
            ->with('santris:id,nama')
            ->get()
            ->flatMap->santris
            ->unique('id')
            ->values()
            ->map(fn (Santri $santri) => ['id' => $santri->id, 'nama' => $santri->nama]);

        $mutabaahs = $ustadz->mutabaahs()
            ->with('santri')
            ->when($request->filled('santri'), function ($query) use ($request) {
                $query->where('santri_id', $request->integer('santri'));
            })
            ->orderBy('tanggal', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('ustadz/mutabaahs/history', [
            'mutabaahs' => $mutabaahs,
            'santriOptions' => $santriOptions,
        ]);
    }
}
```

- [ ] **Step 5: Regenerate Wayfinder and run tests**

```bash
php artisan wayfinder:generate
php artisan test --compact tests/Feature/Ustadz/MutabaahHistoryTest.php
```

Expected: PASS.

- [ ] **Step 6: Create the history page**

Create `resources/js/pages/ustadz/mutabaahs/history.tsx`:

```tsx
import { Link } from '@inertiajs/react';
import Heading from '@/components/heading';
import { index } from '@/routes/ustadz/mutabaahs/history';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { router } from '@inertiajs/react';
import { useState } from 'react';

type MutabaahRow = {
    id: number;
    tanggal: string;
    jenis: string;
    surah: string;
    ayat_mulai: number;
    ayat_selesai: number;
    nilai: number | null;
    status: string;
    catatan: string | null;
    santri: { nama: string };
};

type PageProps = {
    mutabaahs: { data: MutabaahRow[]; total: number };
    santriOptions: { id: number; nama: string }[];
    filters?: { santri?: number };
};

export default function UstadzMutabaahHistory({ mutabaahs, santriOptions, filters }: PageProps) {
    const [santri, setSantri] = useState<string>(filters?.santri ? String(filters.santri) : '');

    return (
        <>
            <Heading title="Riwayat Mutabaah" description="Riwayat pencatatan mutabaah yang Anda lakukan." />

            <Card>
                <CardHeader>
                    <CardTitle>Riwayat ({mutabaahs.total})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Select
                        value={santri}
                        onValueChange={(value) => {
                            setSantri(value);
                            router.get(index(), value ? { santri: value } : {}, { preserveState: true, replace: true });
                        }}
                    >
                        <SelectTrigger className="w-[240px]"><SelectValue placeholder="Semua santri" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Semua santri</SelectItem>
                            {santriOptions.map((s) => (
                                <SelectItem key={s.id} value={String(s.id)}>{s.nama}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <ul className="divide-y rounded-lg border">
                        {mutabaahs.data.map((m) => (
                            <li key={m.id} className="space-y-1 p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <p className="font-medium">{m.santri.nama}</p>
                                    <Badge variant="secondary">{m.status}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {m.tanggal} · {m.jenis} · {m.surah} {m.ayat_mulai}-{m.ayat_selesai}
                                    {m.nilai !== null ? ` · Nilai ${m.nilai}` : ''}
                                </p>
                                {m.catatan && <p className="text-sm">{m.catatan}</p>}
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </>
    );
}

UstadzMutabaahHistory.layout = {
    breadcrumbs: [{
        title: 'Riwayat Mutabaah',
        href: index(),
    }],
};
```

- [ ] **Step 7: Verify types, format, commit**

```bash
npm run types:check
vendor/bin/pint --dirty --format agent
git add routes/ustadz.php app/Http/Controllers/Ustadz/MutabaahHistoryController.php resources/js/pages/ustadz/mutabaahs/history.tsx tests/Feature/Ustadz/MutabaahHistoryTest.php
git commit -m "feat: ustadz mutabaah history"
```

---

### Task 4: Target hafalan management (ustadz + santri list)

**Files:**
- Modify: `routes/ustadz.php`
- Create: `app/Http/Controllers/Ustadz/TargetHafalanController.php`
- Create: `app/Http/Requests/Ustadz/StoreTargetHafalanRequest.php`
- Create: `app/Http/Requests/Ustadz/UpdateTargetHafalanRequest.php`
- Create: `resources/js/pages/ustadz/targets/index.tsx`
- Test: `tests/Feature/Ustadz/TargetHafalanTest.php`

**Interfaces:**
- Consumes: `TargetHafalan`, `Santri`, `TargetHafalanStatus` enum, `RecalculateTargetProgress` action, `makeActingUstadz($this)`-style helper conventions (Phase 3 Task 2).
- Produces routes `ustadz.targets.index` (list per member santri), `ustadz.targets.store`, `ustadz.targets.update`, `ustadz.targets.destroy`. Page receives props `santris` (member santri with their targets), plus `statuses` options.
- Only mutabaah-relevant target writes go through `RecalculateTargetProgress::run($santri)`.

- [ ] **Step 1: Write the failing feature test**

Create `tests/Feature/Ustadz/TargetHafalanTest.php`:

```php
<?php

use App\Enums\TargetHafalanStatus;
use App\Enums\UserRole;
use App\Models\Halaqah;
use App\Models\Santri;
use App\Models\TargetHafalan;
use App\Models\Ustadz;
use App\Models\User;
use PHPUnit\Framework\TestCase;

function creatingUstadz(TestCase $test): Ustadz
{
    $user = User::factory()->create(['role' => UserRole::Ustadz]);
    $ustadz = Ustadz::factory()->create(['user_id' => $user->id]);
    $test->actingAs($user);

    return $ustadz;
}

test('ustadz sees target hafalan of member santri with progress percent', function () {
    $ustadz = creatingUstadz($this);
    $halaqah = Halaqah::factory()->create(['ustadz_id' => $ustadz->id]);
    $santri = Santri::factory()->create();
    $halaqah->santris()->attach($santri->id);
    TargetHafalan::factory()->create(['santri_id' => $santri->id, 'target' => 100, 'progress' => 25]);

    $this->get(route('ustadz.targets.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('ustadz/targets/index')
            ->has('santris.data', 1));
});

test('ustadz can create a target for a member santri', function () {
    $ustadz = creatingUstadz($this);
    $halaqah = Halaqah::factory()->create(['ustadz_id' => $ustadz->id]);
    $santri = Santri::factory()->create();
    $halaqah->santris()->attach($santri->id);

    $this->post(route('ustadz.targets.store'), [
        'santri_id' => $santri->id,
        'periode' => '2027-2028',
        'target' => 600,
        'status' => TargetHafalanStatus::Berlangsung->value,
    ])->assertRedirect(route('ustadz.targets.index'));

    $this->assertDatabaseHas('target_hafalans', [
        'santri_id' => $santri->id,
        'periode' => '2027-2028',
        'target' => 600,
        'status' => TargetHafalanStatus::Berlangsung->value,
    ]);
});

test('ustadz cannot create a target for a stranger santri', function () {
    $ustadz = creatingUstadz($this);
    $stranger = Santri::factory()->create();

    $this->post(route('ustadz.targets.store'), [
        'santri_id' => $stranger->id,
        'periode' => '2027-2028',
        'target' => 600,
        'status' => TargetHafalanStatus::Berlangsung->value,
    ])->assertForbidden();

    expect(TargetHafalan::count())->toBe(0);
});

test('ustadz can mark a target complete and delete one', function () {
    $ustadz = creatingUstadz($this);
    $halaqah = Halaqah::factory()->create(['ustadz_id' => $ustadz->id]);
    $santri = Santri::factory()->create();
    $halaqah->santris()->attach($santri->id);
    $target = TargetHafalan::factory()->create(['santri_id' => $santri->id]);

    $this->patch(route('ustadz.targets.update', $target), [
        'periode' => $target->periode,
        'target' => $target->target,
        'status' => TargetHafalanStatus::Selesai->value,
    ])->assertRedirect(route('ustadz.targets.index'));

    expect($target->fresh()->status)->toBe(TargetHafalanStatus::Selesai);

    $this->delete(route('ustadz.targets.destroy', $target))
        ->assertRedirect(route('ustadz.targets.index'));

    expect($target->fresh())->toBeNull();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --compact tests/Feature/Ustadz/TargetHafalanTest.php`
Expected: FAIL — route `ustadz.targets.index` not defined.

- [ ] **Step 3: Register the routes**

Edit `routes/ustadz.php` — add inside the group:

```php
use App\Http\Controllers\Ustadz\TargetHafalanController;

Route::get('target-hafalan', [TargetHafalanController::class, 'index'])->name('targets.index');
Route::post('target-hafalan', [TargetHafalanController::class, 'store'])->name('targets.store');
Route::patch('target-hafalan/{targetHafalan}', [TargetHafalanController::class, 'update'])->name('targets.update');
Route::delete('target-hafalan/{targetHafalan}', [TargetHafalanController::class, 'destroy'])->name('targets.destroy');
```

- [ ] **Step 4: Create the FormRequests**

Create `app/Http/Requests/Ustadz/StoreTargetHafalanRequest.php`:

```php
<?php

namespace App\Http\Requests\Ustadz;

use App\Enums\TargetHafalanStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreTargetHafalanRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'santri_id' => ['required', 'exists:santris,id'],
            'periode' => ['required', 'string', 'max:50'],
            'target' => ['required', 'integer', 'min:1'],
            'status' => ['required', new Enum(TargetHafalanStatus::class)],
        ];
    }
}
```

Create `app/Http/Requests/Ustadz/UpdateTargetHafalanRequest.php`:

```php
<?php

namespace App\Http\Requests\Ustadz;

use App\Enums\TargetHafalanStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdateTargetHafalanRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'periode' => ['required', 'string', 'max:50'],
            'target' => ['required', 'integer', 'min:1'],
            'status' => ['required', new Enum(TargetHafalanStatus::class)],
        ];
    }
}
```

- [ ] **Step 5: Create the controller**

Create `app/Http/Controllers/Ustadz/TargetHafalanController.php`:

```php
<?php

namespace App\Http\Controllers\Ustadz;

use App\Actions\Mutabaah\RecalculateTargetProgress;
use App\Enums\TargetHafalanStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Ustadz\StoreTargetHafalanRequest;
use App\Http\Requests\Ustadz\UpdateTargetHafalanRequest;
use App\Models\Santri;
use App\Models\TargetHafalan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TargetHafalanController extends Controller
{
    public function index(Request $request): Response
    {
        $ustadz = $request->user()->ustadz;

        abort_unless($ustadz !== null, 403, __('You do not have a ustadz profile.'));

        $santris = $ustadz->halaqahs()
            ->with(['santris' => fn ($query) => $query->with('targetHafalans')->orderBy('nama')])
            ->get()
            ->flatMap->santris
            ->unique('id')
            ->values();

        return Inertia::render('ustadz/targets/index', [
            'santris' => $santris->map(fn (Santri $santri) => [
                'id' => $santri->id,
                'nama' => $santri->nama,
                'nis' => $santri->nis,
                'targets' => $santri->targetHafalans->sortByDesc('id')->values()->map(fn (TargetHafalan $target) => [
                    'id' => $target->id,
                    'periode' => $target->periode,
                    'target' => $target->target,
                    'progress' => $target->progress,
                    'progress_percent' => $target->progressPercent(),
                    'status' => $target->status->value,
                    'status_label' => $target->status->label(),
                ]),
            ]),
            'statuses' => collect(TargetHafalanStatus::cases())->map(fn (TargetHafalanStatus $status) => [
                'value' => $status->value,
                'label' => $status->label(),
            ]),
        ]);
    }

    public function store(StoreTargetHafalanRequest $request): RedirectResponse
    {
        $ustadz = $request->user()->ustadz;
        $validated = $request->validated();

        abort_unless($this->managesSantri($ustadz, $validated['santri_id']), 403, __('This santri is not in any of your halaqah.'));

        TargetHafalan::create($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Target created.')]);

        return to_route('ustadz.targets.index');
    }

    public function update(UpdateTargetHafalanRequest $request, TargetHafalan $targetHafalan): RedirectResponse
    {
        $ustadz = $request->user()->ustadz;

        abort_unless($this->managesSantri($ustadz, $targetHafalan->santri_id), 403, __('This santri is not in any of your halaqah.'));

        $targetHafalan->update($request->validated());

        $targetHafalan->loadMissing('santri');
        app(RecalculateTargetProgress::class)->run($targetHafalan->santri);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Target updated.')]);

        return to_route('ustadz.targets.index');
    }

    public function destroy(Request $request, TargetHafalan $targetHafalan): RedirectResponse
    {
        $ustadz = $request->user()->ustadz;

        abort_unless($this->managesSantri($ustadz, $targetHafalan->santri_id), 403, __('This santri is not in any of your halaqah.'));

        $targetHafalan->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Target deleted.')]);

        return to_route('ustadz.targets.index');
    }

    private function managesSantri(mixed $ustadz, int $santriId): bool
    {
        return $ustadz?->halaqahs()
            ->whereHas('santris', fn ($query) => $query->whereKey($santriId))
            ->exists() ?? false;
    }
}
```

- [ ] **Step 6: Regenerate Wayfinder and run tests**

```bash
php artisan wayfinder:generate
php artisan test --compact tests/Feature/Ustadz/TargetHafalanTest.php
```

Expected: PASS.

- [ ] **Step 7: Create the targets page**

Create `resources/js/pages/ustadz/targets/index.tsx`:

```tsx
import { Form } from '@inertiajs/react';
import TargetHafalanController from '@/actions/App/Http/Controllers/Ustadz/TargetHafalanController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { index } from '@/routes/ustadz/target-hafalan';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';

type Target = {
    id: number;
    periode: string;
    target: number;
    progress: number;
    progress_percent: number;
    status: string;
    status_label: string;
};

type SantriWithTargets = {
    id: number;
    nama: string;
    targets: Target[];
};

type Option = { value: string; label: string };

type PageProps = {
    santris: SantriWithTargets[];
    statuses: Option[];
};

export default function UstadzTargetsIndex({ santris, statuses }: PageProps) {
    const [targetSantriId, setTargetSantriId] = useState<string>('');

    return (
        <>
            <Heading title="Target Hafalan" description="Pantau dan kelola target hafalan santri halaqah Anda." />

            <Card>
                <CardHeader>
                    <CardTitle>Tambah Target</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...TargetHafalanController.store.form()} onSuccess={() => setTargetSantriId('')} className="space-y-4">
                        {({ errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="santri_id">Santri</Label>
                                    <Select name="santri_id" required value={targetSantriId} onValueChange={setTargetSantriId}>
                                        <SelectTrigger id="santri_id"><SelectValue placeholder="Pilih santri" /></SelectTrigger>
                                        <SelectContent>
                                            {santris.map((s) => (
                                                <SelectItem key={s.id} value={String(s.id)}>{s.nama}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.santri_id} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="periode">Periode</Label>
                                    <Input id="periode" name="periode" required placeholder="2027-2028" />
                                    <InputError message={errors.periode} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="target">Target (ayat)</Label>
                                    <Input id="target" name="target" type="number" min={1} required />
                                    <InputError message={errors.target} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select name="status" required defaultValue="berlangsung">
                                        <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {statuses.map((o) => (
                                                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.status} />
                                </div>
                                <Button type="submit">Simpan Target</Button>
                            </>
                        )}
                    </Form>
                </CardContent>
            </Card>

            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>Progres Santri</CardTitle>
                </CardHeader>
                <CardContent>
                    {santris.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Belum ada santri di halaqah Anda.</p>
                    ) : (
                        <ul className="divide-y rounded-lg border">
                            {santris.map((santri) => (
                                <li key={santri.id} className="p-4">
                                    <p className="font-medium">{santri.nama}</p>
                                    {santri.targets.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">Belum ada target.</p>
                                    ) : (
                                        <ul className="mt-2 space-y-2">
                                            {santri.targets.map((target) => (
                                                <li key={target.id} className="rounded-lg border p-3">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <p className="text-sm font-medium">
                                                            Periode {target.periode} · {target.progress}/{target.target} ayat
                                                        </p>
                                                        <span className="text-sm">{target.progress_percent}%</span>
                                                    </div>
                                                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                                                        <div className="h-full bg-primary" style={{ width: `${target.progress_percent}%` }} />
                                                    </div>
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <span className="text-xs text-muted-foreground">{target.status_label}</span>
                                                        <Form {...TargetHafalanController.destroy.form({ targetHafalan: target.id })}>
                                                            <Button type="submit" size="sm" variant="ghost" className="text-destructive">Hapus</Button>
                                                        </Form>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </>
    );
}

UstadzTargetsIndex.layout = {
    breadcrumbs: [{
        title: 'Target Hafalan',
        href: index(),
    }],
};
```

Note: route name `ustadz.targets.index` (URL `/ustadz/target-hafalan`) generates the wayfinder function under `resources/js/routes/ustadz/target-hafalan/`.

- [ ] **Step 8: Verify types, format, commit**

```bash
npm run types:check
vendor/bin/pint --dirty --format agent
git add routes/ustadz.php app/Http/Controllers/Ustadz/TargetHafalanController.php app/Http/Requests/Ustadz resources/js/pages/ustadz/targets tests/Feature/Ustadz/TargetHafalanTest.php
git commit -m "feat: ustadz target hafalan management"
```

---

## Self-Review

1. **Spec coverage:** Phase 3 closes PRD §5 "Ustadz mencatat mutabaah" flow (Halaqah Saya → Pilih Santri → Input Mutabaah → Jenis → Surah → Ayat → Nilai + Status + Catatan → Simpan → Progress Santri diperbarui), MVP items 7 (pencatatan mutabaah), 8 (target hafalan), and 10 (riwayat mutabaah). Progress updates are covered by Task 2's `RecalculateTargetProgress`.
2. **Placeholder scan:** No TBDs. The single placeholder `Namespace\TestCase` in Task 4 was replaced with the explicit `PHPUnit\Framework\TestCase` import and a `creatingUstadz` helper.
3. **Type consistency:** Route names (`ustadz.halaqahs.index`, `ustadz.halaqahs.santris.show`, `ustadz.mutabaahs.create|store|history`, `ustadz.targets.*`) match test `route()` calls and wayfinder imports. `RecalculateTargetProgress::run(Santri $santri): void` signature is identical across Tasks 2 and 4.
4. **Ambiguity:** Helper functions per test file are explicitly unique (`makeActingUstadz`, `makingUstadz`, `creatingUstadz`) to avoid PHP redeclaration conflicts when Pest loads both files.