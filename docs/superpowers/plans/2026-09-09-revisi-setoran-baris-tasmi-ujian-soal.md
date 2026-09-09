# Revisi Setoran Baris-Tasmi-UjianSoal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ubah setoran harian ke satuan baris (target 3/hari) dan ujian bulanan menjadi 5 soal benar/salah @20 poin.

**Architecture:** Opsi A — reuse kolom `mutabaahs.halaman` sebagai baris (alias, tanpa rename fisik); tambah 5 kolom boolean `ujian_soal_1..5` di `mutabaah_bulanans` dengan `ujian_bulanan` sebagai cache total; tasmi tidak berubah.

**Tech Stack:** Laravel 12 (Eloquent, FormRequest, Pest), Inertia v3 + React + TypeScript, Tailwind brutal UI.

## Global Constraints

- Target harian exactly 3 baris/hari (props `targetHarian: 3`).
- Validasi harian `nullable integer min:0 max:30` (bukan 0–20 lagi).
- Tasmi pekanan unchanged: `nullable integer min:10 max:100` + catatan.
- Ujian soal: 5 boolean, benar = 20 poin, total selalu kelipatan 20 max 100.
- Otorisasi unchanged: hanya muhafidz pengampu halaqah; 403 jika santri beda halaqah.
- Business logic di Laravel; validasi server + frontend; run `vendor/bin/pint --dirty --format agent` setelah ubah PHP.

---

### Task 1: Migrasi + Model ujian_soal

**Files:**
- Create: `database/migrations/2026_09_09_000001_add_ujian_soal_to_mutabaah_bulanans.php`
- Modify: `app/Models/MutabaahBulanan.php:19-46`
- Modify: `app/Models/Mutabaah.php:14-27` (docblock alias baris)
- Test: `tests/Feature/SetoranUjianSoalTest.php`

**Interfaces:**
- Consumes: existing `mutabaah_bulanans` table (`ujian_bulanan`, `catatan_tasmi`, `catatan_ujian`).
- Produces: `MutabaahBulanan::$fillable` + casts for `ujian_soal_1..5` (boolean, nullable); helper `ujianTotal(): int` used by Task 2.

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Models\MutabaahBulanan;
use App\Models\Santri;

it('caches ujian total from 5 soal booleans', function (): void {
    $santri = Santri::factory()->create();
    $mb = MutabaahBulanan::factory()->create([
        'santri_id' => $santri->id,
        'ujian_soal_1' => true,
        'ujian_soal_2' => true,
        'ujian_soal_3' => false,
        'ujian_soal_4' => true,
        'ujian_soal_5' => null,
    ]);

    expect($mb->ujianTotal())->toBe(60);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --compact --filter="caches ujian total from 5 soal booleans"`
Expected: FAIL (column `ujian_soal_1` / method `ujianTotal` not defined).

- [ ] **Step 3: Write migration**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mutabaah_bulanans', function (Blueprint $table): void {
            foreach (['ujian_soal_1', 'ujian_soal_2', 'ujian_soal_3', 'ujian_soal_4', 'ujian_soal_5'] as $col) {
                if (! Schema::hasColumn('mutabaah_bulanans', $col)) {
                    $table->boolean($col)->nullable()->after('tasmi_pekan_5');
                }
            }
        });
    }

    public function down(): void
    {
        Schema::table('mutabaah_bulanans', function (Blueprint $table): void {
            foreach (['ujian_soal_1', 'ujian_soal_2', 'ujian_soal_3', 'ujian_soal_4', 'ujian_soal_5'] as $col) {
                if (Schema::hasColumn('mutabaah_bulanans', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
```

- [ ] **Step 4: Update `MutabaahBulanan` model (fillable + casts + helper)**

```php
#[Fillable([
    'santri_id', 'tahun', 'bulan', 'halaman_awal_bulan', 'halaman_kumulatif',
    'juz_dihafal', 'tasmi_pekan_1', 'tasmi_pekan_2', 'tasmi_pekan_3', 'tasmi_pekan_4', 'tasmi_pekan_5',
    'ujian_soal_1', 'ujian_soal_2', 'ujian_soal_3', 'ujian_soal_4', 'ujian_soal_5',
    'ujian_bulanan', 'catatan_tasmi', 'catatan_ujian',
])]
```

```php
'ujian_soal_1' => 'boolean',
'ujian_soal_2' => 'boolean',
'ujian_soal_3' => 'boolean',
'ujian_soal_4' => 'boolean',
'ujian_soal_5' => 'boolean',
```

```php
public function ujianTotal(): int
{
    $count = collect([
        $this->ujian_soal_1, $this->ujian_soal_2, $this->ujian_soal_3,
        $this->ujian_soal_4, $this->ujian_soal_5,
    ])->filter(fn ($v) => $v === true)->count();

    return $count * 20;
}
```

Also update `Mutabaah` docblock: `@property int|null $halaman Satuan baris (nama kolom historis, isi = jumlah baris)`.

- [ ] **Step 5: Run migration + test to verify it passes**

Run: `php artisan migrate; if ($?) { php artisan test --compact --filter="caches ujian total from 5 soal booleans" }`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add database/migrations/2026_09_09_000001_add_ujian_soal_to_mutabaah_bulanans.php app/Models/MutabaahBulanan.php app/Models/Mutabaah.php tests/Feature/SetoranUjianSoalTest.php
git commit -m "feat: ujian bulanan 5 soal boolean + ujianTotal helper" --no-verify
```

### Task 2: Backend Request + Controller (baris 0–30, soal, cache total)

**Files:**
- Modify: `app/Http/Requests/Muhafidz/StoreSetoranRequest.php:60-74`
- Modify: `app/Http/Controllers/Muhafidz/SetoranController.php:40-208`
- Test: `tests/Feature/SetoranUjianSoalTest.php` (append), `tests/Feature/StoreSetoranValidationTest.php`

**Interfaces:**
- Consumes: `MutabaahBulanan::ujianTotal()` from Task 1.
- Produces: GET Inertia props `targetHarian`, `ujianSoal`, `ujianTotal` consumed by Task 3; POST accepts `ujian_soal` array.

- [ ] **Step 1: Write the failing test**

```php
it('stores harian baris and 3 correct soal as total 60', function (): void {
    $muhafidz = \App\Models\Muhafidz::factory()->create();
    $user = $muhafidz->user;
    $halaqah = \App\Models\Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = \App\Models\Santri::factory()->create();
    \App\Models\HalaqahMember::factory()->create(['halaqah_id' => $halaqah->id, 'santri_id' => $santri->id]);

    $this->actingAs($user)->post(route('muhafidz.setoran.store'), [
        'halaqah_id' => $halaqah->id,
        'santri_id' => $santri->id,
        'minggu' => '2026-09-07',
        'harian' => ['senin' => 3, 'selasa' => 4, 'rabu' => null, 'kamis' => null, 'jumat' => null, 'sabtu' => null, 'ahad' => null],
        'ujian_soal' => [true, true, false, true, false],
    ])->assertRedirect();

    $mb = \App\Models\MutabaahBulanan::where('santri_id', $santri->id)->where('tahun', 2026)->where('bulan', 9)->first();
    expect($mb->ujian_bulanan)->toBe(60);
    expect((int) \App\Models\Mutabaah::where('santri_id', $santri->id)->whereDate('tanggal', '2026-09-08')->first()->halaman)->toBe(4);
});

it('rejects harian above 30 baris', function (): void {
    $muhafidz = \App\Models\Muhafidz::factory()->create();
    $user = $muhafidz->user;
    $halaqah = \App\Models\Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = \App\Models\Santri::factory()->create();
    \App\Models\HalaqahMember::factory()->create(['halaqah_id' => $halaqah->id, 'santri_id' => $santri->id]);

    $this->actingAs($user)->post(route('muhafidz.setoran.store'), [
        'halaqah_id' => $halaqah->id,
        'santri_id' => $santri->id,
        'minggu' => '2026-09-07',
        'harian' => ['senin' => 31, 'selasa' => null, 'rabu' => null, 'kamis' => null, 'jumat' => null, 'sabtu' => null, 'ahad' => null],
    ])->assertSessionHasErrors('harian.senin');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --compact --filter="stores harian baris and 3 correct soal"`
Expected: FAIL (validation `ujian_soal` unknown / max 20 violation missing).

- [ ] **Step 3: Update `StoreSetoranRequest` rules**

```php
'harian.senin' => ['nullable', 'integer', 'min:0', 'max:30'],
'harian.selasa' => ['nullable', 'integer', 'min:0', 'max:30'],
'harian.rabu' => ['nullable', 'integer', 'min:0', 'max:30'],
'harian.kamis' => ['nullable', 'integer', 'min:0', 'max:30'],
'harian.jumat' => ['nullable', 'integer', 'min:0', 'max:30'],
'harian.sabtu' => ['nullable', 'integer', 'min:0', 'max:30'],
'harian.ahad' => ['nullable', 'integer', 'min:0', 'max:30'],
'harian.*' => ['nullable', 'integer', 'min:0', 'max:30'],
'tasmi_pekan' => ['nullable', 'integer', 'min:10', 'max:100'],
'ujian_soal' => ['nullable', 'array', 'size:5'],
'ujian_soal.*' => ['nullable', 'boolean'],
```

Keep `ujian_bulanan` rule for backward compat but ignore on store when `ujian_soal` present (do not delete the rule line; add the two new lines above and leave `ujian_bulanan` as-is).

- [ ] **Step 4: Update `SetoranController` GET + POST**

GET additions after `$ujianBulanan` load:

```php
$ujianSoal = [
    $bulanan?->ujian_soal_1,
    $bulanan?->ujian_soal_2,
    $bulanan?->ujian_soal_3,
    $bulanan?->ujian_soal_4,
    $bulanan?->ujian_soal_5,
];
$ujianTotal = $bulanan?->ujianTotal() ?? 0;
```

Add to Inertia props: `'targetHarian' => 3, 'ujianSoal' => $ujianSoal, 'ujianTotal' => $ujianTotal,`.

POST: read `$ujianSoal = $validated['ujian_soal'] ?? null;` map to payload:

```php
if ($ujianSoal !== null) {
    foreach (range(1, 5) as $i) {
        $payload['ujian_soal_'.$i] = $ujianSoal[$i - 1] ?? null;
    }
    $payload['ujian_bulanan'] = collect($ujianSoal)->filter(fn ($v) => $v === true)->count() * 20;
}
```

Keep existing tasmi/catatan handling untouched.

- [ ] **Step 5: Run tests to verify they pass**

Run: `php artisan test --compact --filter="SetoranUjianSoalTest"; if ($?) { php artisan test --compact --filter="SetoranPekanTest" }`
Expected: PASS (existing pekan tests still green; note existing tests use harian ≤ 10 so max 30 does not break them).

- [ ] **Step 6: Format + commit**

```bash
vendor/bin/pint --dirty --format agent
git add app/Http/Requests/Muhafidz/StoreSetoranRequest.php app/Http/Controllers/Muhafidz/SetoranController.php tests/Feature/SetoranUjianSoalTest.php
git commit -m "feat: setoran backend baris 0-30 + ujian soal cache total" --no-verify
```

### Task 3: Frontend 5 panel (baris labels + soal checkbox)

**Files:**
- Modify: `resources/js/pages/muhafidz/setoran/index.tsx:16-171`
- Test: manual browser check (no new automated test; existing Pest covers props).

**Interfaces:**
- Consumes: GET props `targetHarian`, `ujianSoal`, `ujianTotal` from Task 2.
- Produces: POST body `ujian_soal` array + `harian` 0–30 rendered UI.

- [ ] **Step 1: Update PageProps + state (failing typecheck first)**

```tsx
type PageProps = {
  halaqah: Halaqah;
  santri: Santri | null;
  listSantris: Santri[];
  harian: Harian;
  totalSepekan: number;
  tasmiPekan: number | null;
  totalBulanan: number;
  ujianBulanan: number | null;
  ujianSoal: (boolean | null)[];
  ujianTotal: number;
  targetHarian: number;
  catatanTasmi: string | null;
  catatanUjian: string | null;
  minggu: { senin: string; ahad: string; pekan_ke: number };
  settings: { konversi_juz_halaman: number; ambang_hadiah_juz: number; tahun_aktif: number };
};
```

```tsx
const [ujianSoal, setUjianSoal] = useState<(boolean | null)[]>(props.ujianSoal ?? [null, null, null, null, null]);
const liveUjianTotal = useMemo(() => ujianSoal.filter((v) => v === true).length * 20, [ujianSoal]);
```

Remove `ujianValue` string state; keep `tasmiValue` untouched.

- [ ] **Step 2: Update panel labels baris + clamp 30**

Replace `max={20}` with `max={30}` in `handleDayChange` clamp and day `<Input>`. Replace texts: `hal` → `baris`, `halaman` → `baris`, `Total Harian` footer shows `{liveTotal} baris`, panel 1 header `Setoran Harian (Baris)` + hint `Target {targetHarian} baris/hari`, panel 2/4 unit `baris`, sticky footer `{liveTotal} baris sepekan · {totalBulanan} baris bulan ini`.

- [ ] **Step 3: Replace panel 5 nilai input with 5 soal checkboxes**

```tsx
{[0, 1, 2, 3, 4].map((i) => (
  <label key={i} className="flex cursor-pointer items-center gap-2 rounded-none border-2 border-black bg-white p-2">
    <input
      type="checkbox"
      checked={ujianSoal[i] === true}
      onChange={(e) => setUjianSoal((prev) => prev.map((v, idx) => (idx === i ? e.target.checked : v)))}
      className="h-5 w-5 cursor-pointer accent-black"
    />
    <span className="text-xs font-black uppercase">Soal {i + 1}</span>
    <span className="ml-auto text-[10px] font-bold text-black/50">{ujianSoal[i] === true ? '20 ✓' : '0 ○'}</span>
  </label>
))}
<div className="flex items-center justify-between rounded-none border-[3px] border-black bg-black px-3 py-2 text-[#FFF7E8]">
  <span className="text-xs font-black uppercase">Total Ujian</span>
  <span className="font-head text-lg font-black">{liveUjianTotal}/100</span>
</div>
```

Submit body: `{ halaqah_id, santri_id, minggu, harian: harianForm, tasmi_pekan, ujian_soal: ujianSoal, catatan_tasmi, catatan_ujian }` (drop `ujian_bulanan`). Reset restores `ujianSoal` from props.

- [ ] **Step 4: Verify build + commit**

Run: `npm run build`
Expected: success, no TS errors.

```bash
git add resources/js/pages/muhafidz/setoran/index.tsx
git commit -m "feat: setoran UI baris + 5 soal ujian checkbox" --no-verify
```
