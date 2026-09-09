# Pecah Setoran Harian-Surah-Tasmi-Ujian Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pecah halaman setoran 5-panel menjadi 3 halaman (Setoran Harian per surah, Tasmi Pekanan, Ujian Bulanan) dengan tabel `surahs` (114, seeder lengkap) dan `setoran_details` (banyak surah per hari).

**Architecture:** Opsi A — `mutabaahs` tetap 1 row/hari (unique santri+tanggal aman, dashboard tidak pecah); `setoran_details` anak per surah; total baris dihitung server; 3 controller tipis gantikan `SetoranController`; UI ikut saran ui-ux-pro-max (satu layar satu tugas, repeatable rows, sticky total+Simpan).

**Tech Stack:** Laravel 12 (Eloquent, FormRequest, Pest, PostgreSQL), Inertia v3 + React + TypeScript + Tailwind brutal + shadcn/ui + Lucide.

## Global Constraints

- Database app adalah PostgreSQL (test tetap SQLite in-memory via phpunit.xml).
- Target harian exactly 3 baris/hari (props `targetHarian: 3` di halaman harian).
- Baris per surah `integer min:1 max:30`; minimal 1 surah; surah `distinct` per hari.
- Tasmi unchanged: `nullable integer min:10 max:100` + catatan; ujian unchanged: 5 boolean, total kelipatan 20.
- Total header (`mutabaahs.halaman`) selalu dihitung server = SUM(details).
- Otorisasi unchanged: hanya muhafidz pengampu halaqah; 403 jika santri beda halaqah.
- Business logic di Laravel; run `vendor/bin/pint --dirty --format agent` setelah ubah PHP; frontend `npm run build` harus sukses.
- Hapus route/page 5-panel lama (`muhafidz.setoran.index/store`, `resources/js/pages/muhafidz/setoran/index.tsx`); link "Input Setoran" di Halaqah Saya → Setoran Harian.

---

### Task 1: Tabel + Model + Seeder Surah (114 lengkap)

**Files:**
- Create: `database/migrations/2026_09_09_000002_create_surahs_table.php`
- Create: `app/Models/Surah.php`
- Create: `database/seeders/SurahSeeder.php`
- Modify: `database/seeders/DatabaseSeeder.php:103` (registrasi call)
- Test: `tests/Feature/SurahSeederTest.php`

**Interfaces:**
- Consumes: nothing (independent).
- Produces: `Surah` model (`nomor`, `nama_latin`, `nama_arab`, `jumlah_ayat`, `juz`); `surahs` table consumed by Tasks 2–3.

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Models\Surah;

it('seeds 114 surahs with complete data', function (): void {
    expect(Surah::count())->toBe(114);
    expect(Surah::where('nomor', 1)->first()->nama_latin)->toBe('Al-Fatihah');
    expect(Surah::where('nomor', 114)->first()->nama_latin)->toBe('An-Nas');
    expect(Surah::where('nomor', 2)->first()->jumlah_ayat)->toBe(286);
    expect(Surah::where('nomor', 112)->first()->toArray())->toMatchArray([
        'nama_latin' => 'Al-Ikhlas', 'jumlah_ayat' => 4, 'juz' => 30,
    ]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --compact --filter="seeds 114 surahs"`
Expected: FAIL (table `surahs` does not exist).

- [ ] **Step 3: Write migration + model**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('surahs', function (Blueprint $table): void {
            $table->id();
            $table->unsignedTinyInteger('nomor')->unique();
            $table->string('nama_latin', 50);
            $table->string('nama_arab', 50);
            $table->unsignedSmallInteger('jumlah_ayat');
            $table->unsignedTinyInteger('juz');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('surahs');
    }
};
```

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int $nomor
 * @property string $nama_latin
 * @property string $nama_arab
 * @property int $jumlah_ayat
 * @property int $juz
 */
class Surah extends Model
{
    /** @use HasFactory<Surah> */
    use HasFactory;

    protected $fillable = ['nomor', 'nama_latin', 'nama_arab', 'jumlah_ayat', 'juz'];

    protected function casts(): array
    {
        return ['nomor' => 'integer', 'jumlah_ayat' => 'integer', 'juz' => 'integer'];
    }
}
```

- [ ] **Step 4: Write `SurahSeeder` with all 114 surahs (nomor, latin, arab, ayat, juz-ayat-pertama)**

```php
<?php

namespace Database\Seeders;

use App\Models\Surah;
use Illuminate\Database\Seeder;

class SurahSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->data() as [$nomor, $latin, $arab, $ayat, $juz]) {
            Surah::updateOrCreate(
                ['nomor' => $nomor],
                ['nama_latin' => $latin, 'nama_arab' => $arab, 'jumlah_ayat' => $ayat, 'juz' => $juz]
            );
        }
    }

    /** @return array<int, array{int, string, string, int, int}> */
    private function data(): array
    {
        return [
            [1, 'Al-Fatihah', 'الفاتحة', 7, 1],
            [2, 'Al-Baqarah', 'البقرة', 286, 1],
            [3, "Ali 'Imran", 'آل عمران', 200, 3],
            [4, "An-Nisa'", 'النساء', 176, 4],
            [5, "Al-Ma'idah", 'المائدة', 120, 6],
            [6, "Al-An'am", 'الأنعام', 165, 7],
            [7, "Al-A'raf", 'الأعراف', 206, 8],
            [8, 'Al-Anfal', 'الأنفال', 75, 9],
            [9, 'At-Taubah', 'التوبة', 129, 10],
            [10, 'Yunus', 'يونس', 109, 11],
            [11, 'Hud', 'هود', 123, 11],
            [12, 'Yusuf', 'يوسف', 111, 12],
            [13, "Ar-Ra'd", 'الرعد', 43, 13],
            [14, 'Ibrahim', 'إبراهيم', 52, 13],
            [15, 'Al-Hijr', 'الحجر', 99, 14],
            [16, 'An-Nahl', 'النحل', 128, 14],
            [17, 'Al-Isra', 'الإسراء', 111, 15],
            [18, 'Al-Kahf', 'الكهف', 110, 15],
            [19, 'Maryam', 'مريم', 98, 16],
            [20, 'Taha', 'طه', 135, 16],
            [21, 'Al-Anbiya', 'الأنبياء', 112, 17],
            [22, 'Al-Hajj', 'الحج', 78, 17],
            [23, "Al-Mu'minun", 'المؤمنون', 118, 18],
            [24, 'An-Nur', 'النور', 64, 18],
            [25, 'Al-Furqan', 'الفرقان', 77, 18],
            [26, "Asy-Syu'ara'", 'الشعراء', 227, 19],
            [27, 'An-Naml', 'النمل', 93, 19],
            [28, 'Al-Qasas', 'القصص', 88, 20],
            [29, 'Al-Ankabut', 'العنكبوت', 69, 20],
            [30, 'Ar-Rum', 'الروم', 60, 21],
            [31, 'Luqman', 'لقمان', 34, 21],
            [32, 'As-Sajdah', 'السجدة', 30, 21],
            [33, 'Al-Ahzab', 'الأحزاب', 73, 21],
            [34, 'Saba', 'سبأ', 54, 22],
            [35, 'Fatir', 'فاطر', 45, 22],
            [36, 'Yasin', 'يس', 83, 22],
            [37, 'As-Saffat', 'الصافات', 182, 23],
            [38, 'Sad', 'ص', 88, 23],
            [39, 'Az-Zumar', 'الزمر', 75, 23],
            [40, 'Ghafir', 'غافر', 85, 24],
            [41, 'Fussilat', 'فصلت', 54, 24],
            [42, 'Asy-Syura', 'الشورى', 53, 25],
            [43, 'Az-Zukhruf', 'الزخرف', 89, 25],
            [44, 'Ad-Dukhan', 'الدخان', 59, 25],
            [45, 'Al-Jasiyah', 'الجاثية', 37, 25],
            [46, 'Al-Ahqaf', 'الأحقاف', 35, 26],
            [47, 'Muhammad', 'محمد', 38, 26],
            [48, 'Al-Fath', 'الفتح', 29, 26],
            [49, 'Al-Hujurat', 'الحجرات', 18, 26],
            [50, 'Qaf', 'ق', 45, 26],
            [51, 'Az-Zariyat', 'الذاريات', 60, 26],
            [52, 'At-Tur', 'الطور', 49, 27],
            [53, 'An-Najm', 'النجم', 62, 27],
            [54, 'Al-Qamar', 'القمر', 55, 27],
            [55, 'Ar-Rahman', 'الرحمن', 78, 27],
            [56, "Al-Waqi'ah", 'الواقعة', 96, 27],
            [57, 'Al-Hadid', 'الحديد', 29, 27],
            [58, 'Al-Mujadalah', 'المجادلة', 22, 28],
            [59, 'Al-Hasyr', 'الحشر', 24, 28],
            [60, 'Al-Mumtahanah', 'الممتحنة', 13, 28],
            [61, 'As-Saff', 'الصف', 14, 28],
            [62, "Al-Jumu'ah", 'الجمعة', 11, 28],
            [63, 'Al-Munafiqun', 'المنافقون', 11, 28],
            [64, 'At-Tagabun', 'التغابن', 18, 28],
            [65, 'At-Talaq', 'الطلاق', 12, 28],
            [66, 'At-Tahrim', 'التحريم', 12, 28],
            [67, 'Al-Mulk', 'الملك', 30, 29],
            [68, 'Al-Qalam', 'القلم', 52, 29],
            [69, 'Al-Haqqah', 'الحاقة', 52, 29],
            [70, "Al-Ma'arij", 'المعارج', 44, 29],
            [71, 'Nuh', 'نوح', 28, 29],
            [72, 'Al-Jinn', 'الجن', 28, 29],
            [73, 'Al-Muzzammil', 'المزمل', 20, 29],
            [74, 'Al-Muddassir', 'المدثر', 56, 29],
            [75, 'Al-Qiyamah', 'القيامة', 40, 29],
            [76, 'Al-Insan', 'الإنسان', 31, 29],
            [77, 'Al-Mursalat', 'المرسلات', 50, 29],
            [78, "An-Naba'", 'النبأ', 40, 30],
            [79, "An-Nazi'at", 'النازعات', 46, 30],
            [80, "'Abasa", 'عبس', 42, 30],
            [81, 'At-Takwir', 'التكوير', 29, 30],
            [82, 'Al-Infitar', 'الانفطار', 19, 30],
            [83, 'Al-Mutaffifin', 'المطففين', 36, 30],
            [84, 'Al-Insyiqaq', 'الانشقاق', 25, 30],
            [85, 'Al-Buruj', 'البروج', 22, 30],
            [86, 'At-Tariq', 'الطارق', 17, 30],
            [87, "Al-A'la", 'الأعلى', 19, 30],
            [88, 'Al-Gasyiyah', 'الغاشية', 26, 30],
            [89, 'Al-Fajr', 'الفجر', 30, 30],
            [90, 'Al-Balad', 'البلد', 20, 30],
            [91, 'Asy-Syams', 'الشمس', 15, 30],
            [92, 'Al-Lail', 'الليل', 21, 30],
            [93, 'Ad-Duha', 'الضحى', 11, 30],
            [94, 'Asy-Syarh', 'الشرح', 8, 30],
            [95, 'At-Tin', 'التين', 8, 30],
            [96, "Al-'Alaq", 'العلق', 19, 30],
            [97, 'Al-Qadr', 'القدر', 5, 30],
            [98, 'Al-Bayyinah', 'البينة', 8, 30],
            [99, 'Az-Zalzalah', 'الزلزلة', 8, 30],
            [100, "Al-'Adiyat", 'العاديات', 11, 30],
            [101, "Al-Qari'ah", 'القارعة', 11, 30],
            [102, 'At-Takasur', 'التكاثر', 8, 30],
            [103, 'Al-Asr', 'العصر', 3, 30],
            [104, 'Al-Humazah', 'الهمزة', 9, 30],
            [105, 'Al-Fil', 'الفيل', 5, 30],
            [106, 'Quraisy', 'قريش', 4, 30],
            [107, "Al-Ma'un", 'الماعون', 7, 30],
            [108, 'Al-Kausar', 'الكوثر', 3, 30],
            [109, 'Al-Kafirun', 'الكافرون', 6, 30],
            [110, 'An-Nasr', 'النصر', 3, 30],
            [111, 'Al-Lahab', 'المسد', 5, 30],
            [112, 'Al-Ikhlas', 'الإخلاص', 4, 30],
            [113, 'Al-Falaq', 'الفلق', 5, 30],
            [114, 'An-Nas', 'الناس', 6, 30],
        ];
    }
}
```

Register in `DatabaseSeeder::run()` before DemoDataSeeder call:

```php
$this->call(SurahSeeder::class);
```

- [ ] **Step 5: Run migration + seeder + test**

Run: `php artisan migrate --force; if ($?) { php artisan db:seed --class=SurahSeeder --force; if ($?) { php artisan test --compact --filter="seeds 114 surahs" } }`
Expected: PASS (1 test, 5 assertions).

- [ ] **Step 6: Format + commit**

```bash
vendor/bin/pint --dirty --format agent
git add database/migrations/2026_09_09_000002_create_surahs_table.php app/Models/Surah.php database/seeders/SurahSeeder.php database/seeders/DatabaseSeeder.php tests/Feature/SurahSeederTest.php
git commit -m "feat: surahs table + 114 seeder" --no-verify
```

### Task 2: Tabel setoran_details + Relasi + Ringkasan

**Files:**
- Create: `database/migrations/2026_09_09_000003_create_setoran_details_table.php`
- Create: `app/Models/SetoranDetail.php`
- Modify: `app/Models/Mutabaah.php:28-62` (relasi details + helper ringkasan)
- Test: `tests/Feature/SetoranDetailTest.php`

**Interfaces:**
- Consumes: `Surah` model from Task 1.
- Produces: `Mutabaah::details()` HasMany, `Mutabaah::buildSurahSummary(): string` used by Task 3.

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Models\Muhafidz;
use App\Models\Mutabaah;
use App\Models\Santri;
use App\Models\Surah;

it('builds range summary for consecutive surahs', function (): void {
    $santri = Santri::factory()->create();
    $muhafidz = Muhafidz::factory()->create();
    $m = Mutabaah::factory()->create(['santri_id' => $santri->id, 'muhafidz_id' => $muhafidz->id]);
    $m->details()->create(['surah_id' => Surah::where('nomor', 112)->first()->id, 'baris' => 4]);
    $m->details()->create(['surah_id' => Surah::where('nomor', 113)->first()->id, 'baris' => 5]);
    $m->details()->create(['surah_id' => Surah::where('nomor', 114)->first()->id, 'baris' => 6]);

    expect($m->fresh()->buildSurahSummary())->toBe('Al-Ikhlas – An-Nas');
    expect($m->fresh()->details()->sum('baris'))->toBe(15);
});

it('builds joined summary for non-consecutive surahs', function (): void {
    $santri = Santri::factory()->create();
    $muhafidz = Muhafidz::factory()->create();
    $m = Mutabaah::factory()->create(['santri_id' => $santri->id, 'muhafidz_id' => $muhafidz->id]);
    $m->details()->create(['surah_id' => Surah::where('nomor', 1)->first()->id, 'baris' => 3]);
    $m->details()->create(['surah_id' => Surah::where('nomor', 36)->first()->id, 'baris' => 3]);

    expect($m->fresh()->buildSurahSummary())->toBe('Al-Fatihah, Yasin');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --compact --filter="builds range summary"`
Expected: FAIL (table `setoran_details` / method `details` not defined).

- [ ] **Step 3: Write migration + model + Mutabaah changes**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('setoran_details', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('mutabaah_id')->constrained('mutabaahs')->cascadeOnDelete();
            $table->foreignId('surah_id')->constrained('surahs')->restrictOnDelete();
            $table->unsignedTinyInteger('baris');
            $table->timestamps();
            $table->unique(['mutabaah_id', 'surah_id'], 'setoran_details_mutabaah_surah_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('setoran_details');
    }
};
```

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SetoranDetail extends Model
{
    protected $fillable = ['mutabaah_id', 'surah_id', 'baris'];

    protected function casts(): array
    {
        return ['baris' => 'integer'];
    }

    /** @return BelongsTo<Mutabaah, $this> */
    public function mutabaah(): BelongsTo
    {
        return $this->belongsTo(Mutabaah::class);
    }

    /** @return BelongsTo<Surah, $this> */
    public function surah(): BelongsTo
    {
        return $this->belongsTo(Surah::class);
    }
}
```

In `Mutabaah`, add fillable `details` handling via relation (no fillable change needed), add:

```php
/** @return HasMany<SetoranDetail, $this> */
public function details(): HasMany
{
    return $this->hasMany(SetoranDetail::class);
}

public function buildSurahSummary(): string
{
    $names = $this->details()->with('surah')
        ->get()
        ->sortBy(fn (SetoranDetail $d) => $d->surah->nomor)
        ->map(fn (SetoranDetail $d) => ['nomor' => $d->surah->nomor, 'nama' => $d->surah->nama_latin])
        ->values();

    if ($names->isEmpty()) {
        return '-';
    }

    $numbers = $names->pluck('nomor')->all();
    $isRange = $numbers === range(min($numbers), max($numbers));

    if ($isRange && $names->count() > 1) {
        return $names->first()['nama'].' – '.$names->last()['nama'];
    }

    $shown = $names->take(3)->pluck('nama')->all();
    $rest = $names->count() - count($shown);

    return implode(', ', $shown).($rest > 0 ? ', +'.$rest : '');
}
```

Add `use Illuminate\Database\Eloquent\Relations\HasMany;` import.

- [ ] **Step 4: Run migration + test**

Run: `php artisan migrate --force; if ($?) { php artisan test --compact --filter="SetoranDetailTest" }`
Expected: PASS (2 tests).

- [ ] **Step 5: Format + commit**

```bash
vendor/bin/pint --dirty --format agent
git add database/migrations/2026_09_09_000003_create_setoran_details_table.php app/Models/SetoranDetail.php app/Models/Mutabaah.php tests/Feature/SetoranDetailTest.php
git commit -m "feat: setoran_details + surah summary helper" --no-verify
```

### Task 3: SetoranHarianController + Request + Routes (input per hari)

**Files:**
- Create: `app/Http/Requests/Muhafidz/StoreSetoranHarianRequest.php`
- Create: `app/Http/Controllers/Muhafidz/SetoranHarianController.php`
- Modify: `routes/muhafidz.php:16-17` (tambah route harian; route 5-panel lama DIHAPUS di Task 4, bukan di sini)
- Test: `tests/Feature/SetoranHarianTest.php`

**Interfaces:**
- Consumes: `Mutabaah::details()`, `buildSurahSummary()` from Task 2; `Surah` list from Task 1.
- Produces: routes `muhafidz.setoran-harian.index/store` consumed by Task 5.

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Models\Halaqah;
use App\Models\HalaqahMember;
use App\Models\Muhafidz;
use App\Models\Mutabaah;
use App\Models\Santri;
use App\Models\Surah;

it('stores one day with 3 surahs and server-computed total', function (): void {
    $muhafidz = Muhafidz::factory()->create();
    $user = $muhafidz->user;
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create();
    HalaqahMember::factory()->create(['halaqah_id' => $halaqah->id, 'santri_id' => $santri->id]);
    $ids = Surah::whereIn('nomor', [112, 113, 114])->orderBy('nomor')->pluck('id')->all();

    $this->actingAs($user)->post(route('muhafidz.setoran-harian.store'), [
        'santri_id' => $santri->id,
        'tanggal' => '2026-09-09',
        'details' => [
            ['surah_id' => $ids[0], 'baris' => 4],
            ['surah_id' => $ids[1], 'baris' => 5],
            ['surah_id' => $ids[2], 'baris' => 6],
        ],
    ])->assertRedirect();

    $m = Mutabaah::where('santri_id', $santri->id)->whereDate('tanggal', '2026-09-09')->first();
    expect($m->halaman)->toBe(15);
    expect($m->surah)->toBe('Al-Ikhlas – An-Nas');
    expect($m->details()->count())->toBe(3);
});

it('rejects duplicate surah in one day', function (): void {
    $muhafidz = Muhafidz::factory()->create();
    $user = $muhafidz->user;
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create();
    HalaqahMember::factory()->create(['halaqah_id' => $halaqah->id, 'santri_id' => $santri->id]);
    $id = Surah::where('nomor', 112)->first()->id;

    $this->actingAs($user)->post(route('muhafidz.setoran-harian.store'), [
        'santri_id' => $santri->id,
        'tanggal' => '2026-09-09',
        'details' => [
            ['surah_id' => $id, 'baris' => 4],
            ['surah_id' => $id, 'baris' => 5],
        ],
    ])->assertSessionHasErrors('details.1.surah_id');
});

it('rejects future date', function (): void {    $muhafidz = Muhafidz::factory()->create();
    $user = $muhafidz->user;
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create();
    HalaqahMember::factory()->create(['halaqah_id' => $halaqah->id, 'santri_id' => $santri->id]);
    $id = Surah::where('nomor', 112)->first()->id;

    $this->actingAs($user)->post(route('muhafidz.setoran-harian.store'), [
        'santri_id' => $santri->id,
        'tanggal' => now()->addDay()->toDateString(),
        'details' => [['surah_id' => $id, 'baris' => 4]],
    ])->assertSessionHasErrors('tanggal');
});

it('deletes the day when details are emptied', function (): void {
    $muhafidz = Muhafidz::factory()->create();
    $user = $muhafidz->user;
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create();
    HalaqahMember::factory()->create(['halaqah_id' => $halaqah->id, 'santri_id' => $santri->id]);
    $id = Surah::where('nomor', 112)->first()->id;

    $this->actingAs($user)->post(route('muhafidz.setoran-harian.store'), [
        'santri_id' => $santri->id,
        'tanggal' => '2026-09-09',
        'details' => [['surah_id' => $id, 'baris' => 4]],
    ])->assertRedirect();

    $this->actingAs($user)->post(route('muhafidz.setoran-harian.store'), [
        'santri_id' => $santri->id,
        'tanggal' => '2026-09-09',
        'details' => [],
    ])->assertRedirect();

    expect(Mutabaah::where('santri_id', $santri->id)->whereDate('tanggal', '2026-09-09')->exists())->toBeFalse();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --compact --filter="stores one day with 3 surahs"`
Expected: FAIL (route `muhafidz.setoran-harian.store` not defined).

- [ ] **Step 3: Write Request (mirror `StoreSetoranRequest` authorize + HalaqahMember check, tanpa halaqah_id — santri cukup milik salah satu halaqah pengampu)**

```php
<?php

namespace App\Http\Requests\Muhafidz;

use App\Models\HalaqahMember;
use Illuminate\Foundation\Http\FormRequest;

class StoreSetoranHarianRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && $user->muhafidz !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'santri_id' => [
                'required',
                'exists:santris,id',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    $muhafidzId = $this->user()->muhafidz->id;
                    $belongs = HalaqahMember::where('santri_id', $value)
                        ->whereHas('halaqah', fn ($q) => $q->where('muhafidz_id', $muhafidzId))
                        ->exists();

                    if (! $belongs) {
                        $fail('Santri tidak terdaftar di halaqah Anda.');
                    }
                },
            ],
            'tanggal' => ['required', 'date', 'before_or_equal:today'],
            'details' => ['required', 'array'],
            'details.*.surah_id' => ['required', 'integer', 'exists:surahs,id', 'distinct'],
            'details.*.baris' => ['required', 'integer', 'min:1', 'max:30'],
        ];
    }
}
```

Note: verify `HalaqahMember::halaqah()` relation exists before using `whereHas('halaqah')`; if missing, join via `Halaqah::where('muhafidz_id', ...)->pluck('id')` + `whereIn('halaqah_id', ...)` instead.

- [ ] **Step 4: Write Controller (GET + POST; POST sync dalam transaksi, total + ringkasan dari server)**

```php
<?php

namespace App\Http\Controllers\Muhafidz;

use App\Http\Controllers\Controller;
use App\Http\Requests\Muhafidz\StoreSetoranHarianRequest;
use App\Models\Mutabaah;
use App\Models\Surah;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class SetoranHarianController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $halaqahIds = $user->muhafidz->halaqahs()->pluck('halaqahs.id');
        $santris = \App\Models\Santri::whereIn('id', function ($q) use ($halaqahIds): void {
            $q->select('santri_id')->from('halaqah_members')->whereIn('halaqah_id', $halaqahIds);
        })->orderBy('nama')->get(['id', 'nama', 'nis']);

        $santriId = $request->query('santri_id', $santris->first()?->id);
        $tanggal = $request->query('tanggal', now()->toDateString());

        $details = [];
        $existing = $santriId !== null
            ? Mutabaah::with('details.surah')->where('santri_id', $santriId)->whereDate('tanggal', $tanggal)->first()
            : null;

        if ($existing !== null) {
            $details = $existing->details->map(fn ($d) => ['surah_id' => $d->surah_id, 'baris' => $d->baris])->all();
        }

        return Inertia::render('muhafidz/setoran-harian/index', [
            'santris' => $santris,
            'santriId' => $santriId !== null ? (int) $santriId : null,
            'tanggal' => $tanggal,
            'details' => $details,
            'totalBaris' => collect($details)->sum('baris'),
            'surahs' => Surah::orderBy('nomor')->get(['id', 'nomor', 'nama_latin', 'nama_arab', 'jumlah_ayat', 'juz']),
            'targetHarian' => 3,
        ]);
    }

    public function store(StoreSetoranHarianRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $muhafidzId = $request->user()->muhafidz->id;

        DB::transaction(function () use ($validated, $muhafidzId): void {
            if ($validated['details'] === []) {
                Mutabaah::where('santri_id', $validated['santri_id'])
                    ->whereDate('tanggal', $validated['tanggal'])
                    ->delete();

                return;
            }

            $mutabaah = Mutabaah::updateOrCreate(
                ['santri_id' => $validated['santri_id'], 'tanggal' => Carbon::parse($validated['tanggal'])],
                ['muhafidz_id' => $muhafidzId, 'jenis' => \App\Enums\MutabaahJenis::Setoran, 'status' => \App\Enums\MutabaahStatus::Lulus]
            );

            $ids = collect($validated['details'])->pluck('surah_id')->all();
            $mutabaah->details()->whereNotIn('surah_id', $ids)->delete();

            foreach ($validated['details'] as $row) {
                $mutabaah->details()->updateOrCreate(
                    ['surah_id' => $row['surah_id']],
                    ['baris' => (int) $row['baris']]
                );
            }

            $mutabaah->refresh();
            $mutabaah->update([
                'halaman' => (int) $mutabaah->details()->sum('baris'),
                'surah' => $mutabaah->buildSurahSummary(),
            ]);
        });

        return redirect()->route('muhafidz.setoran-harian.index', ['santri_id' => $validated['santri_id'], 'tanggal' => $validated['tanggal']])
            ->with('success', 'Setoran harian disimpan.');
    }
}
```

Verify before writing: `Muhafidz::halaqahs()` relation name, `MutabaahJenis`/`MutabaahStatus` enum cases, `Mutabaah` fillable includes `jenis/status/surah/halaman` (it does per existing code). Adjust names to match actual code. Add routes:

```php
Route::get('setoran-harian', [SetoranHarianController::class, 'index'])->name('setoran-harian.index');
Route::post('setoran-harian', [SetoranHarianController::class, 'store'])->name('setoran-harian.store');
```

- [ ] **Step 5: Run tests**

Run: `php artisan test --compact --filter="SetoranHarianTest"`
Expected: PASS (4 tests).

- [ ] **Step 6: Format + commit**

```bash
vendor/bin/pint --dirty --format agent
git add app/Http/Requests/Muhafidz/StoreSetoranHarianRequest.php app/Http/Controllers/Muhafidz/SetoranHarianController.php routes/muhafidz.php tests/Feature/SetoranHarianTest.php
git commit -m "feat: setoran harian per-hari multi-surah backend" --no-verify
```

### Task 4: TasmiController + UjianController + Hapus 5-panel lama

**Files:**
- Create: `app/Http/Controllers/Muhafidz/TasmiController.php`
- Create: `app/Http/Controllers/Muhafidz/UjianController.php`
- Modify: `routes/muhafidz.php:16-17` (hapus route setoran.index/store; tambah tasmi/ujian routes)
- Delete: `app/Http/Controllers/Muhafidz/SetoranController.php`
- Delete: `app/Http/Requests/Muhafidz/StoreSetoranRequest.php`
- Modify: `tests/Feature/SetoranPekanTest.php`, `tests/Feature/SetoranUjianSoalTest.php`, `tests/Feature/StoreSetoranValidationTest.php`, `tests/Feature/SetoranControllerTest.php` (adaptasi ke route baru; hapus file test yang khusus 5-panel bila kosong)
- Test: `tests/Feature/TasmiUjianRoutesTest.php`

**Interfaces:**
- Consumes: `MutabaahBulanan` tasmi/ujian fields, `PekanHelper` (reuse dari SetoranController lama — pindahkan logic GET/POST per bagian, bukan copy buta).
- Produces: routes `muhafidz.tasmi.index/store`, `muhafidz.ujian.index/store` consumed by Task 5.

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Models\Halaqah;
use App\Models\HalaqahMember;
use App\Models\Muhafidz;
use App\Models\MutabaahBulanan;
use App\Models\Santri;

it('stores tasmi for the active pekan only', function (): void {
    $muhafidz = Muhafidz::factory()->create();
    $user = $muhafidz->user;
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create();
    HalaqahMember::factory()->create(['halaqah_id' => $halaqah->id, 'santri_id' => $santri->id]);

    $this->actingAs($user)->post(route('muhafidz.tasmi.store'), [
        'santri_id' => $santri->id,
        'minggu' => '2026-09-07',
        'tasmi_pekan' => 85,
        'catatan_tasmi' => 'lancar',
    ])->assertRedirect();

    $mb = MutabaahBulanan::where('santri_id', $santri->id)->where('tahun', 2026)->where('bulan', 9)->first();
    expect($mb->tasmi_pekan_2)->toBe(85);
    expect($mb->catatan_tasmi)->toBe('lancar');
});

it('stores 5 soal ujian with cached total', function (): void {
    $muhafidz = Muhafidz::factory()->create();
    $user = $muhafidz->user;
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create();
    HalaqahMember::factory()->create(['halaqah_id' => $halaqah->id, 'santri_id' => $santri->id]);

    $this->actingAs($user)->post(route('muhafidz.ujian.store'), [
        'santri_id' => $santri->id,
        'tahun' => 2026,
        'bulan' => 9,
        'ujian_soal' => [true, true, false, true, false],
        'catatan_ujian' => 'baik',
    ])->assertRedirect();

    $mb = MutabaahBulanan::where('santri_id', $santri->id)->where('tahun', 2026)->where('bulan', 9)->first();
    expect($mb->ujian_bulanan)->toBe(60);
});

it('legacy 5-panel routes are gone', function (): void {
    $muhafidz = Muhafidz::factory()->create();
    $this->actingAs($muhafidz->user)->get('/muhafidz/halaqahs/1/setoran')->assertNotFound();
});
```

Note: `2026-09-07` is a Monday; `PekanHelper::pekanNumberInMonth` gives `intdiv(7-1,7)+1 = 1`? intdiv(6,7)=0 → pekan 1, not 2. Fix expectation: Senin 7 Sep 2026 → pekan_ke = 1, so expect `tasmi_pekan_1`. Verify against `PekanHelper::pekanNumberInMonth` implementation before finalizing; adjust date or expectation accordingly.

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --compact --filter="stores tasmi for the active pekan"`
Expected: FAIL (route not defined).

- [ ] **Step 3: Create TasmiController + UjianController by moving the tasmi/ujian slices out of SetoranController (keep validation ranges: tasmi 10–100, soal boolean size 5, total = count(true)×20; keep catatan handling; keep pekan-by-Senin + 403 ownership checks)**

Routes:

```php
Route::get('tasmi', [TasmiController::class, 'index'])->name('tasmi.index');
Route::post('tasmi', [TasmiController::class, 'store'])->name('tasmi.store');
Route::get('ujian', [UjianController::class, 'index'])->name('ujian.index');
Route::post('ujian', [UjianController::class, 'store'])->name('ujian.store');
```

Inertia pages: `muhafidz/tasmi/index`, `muhafidz/ujian/index` (built in Task 5; controller must send props: tasmi → `santris, santriId, minggu{senin,ahad,pekan_ke}, totalSepekan, tasmiPekan, catatanTasmi`; ujian → `santris, santriId, tahun, bulan, totalBulanan, ujianSoal[5], ujianTotal, catatanUjian`).

- [ ] **Step 4: Delete SetoranController + StoreSetoranRequest + adapt old tests to new routes; delete `SetoranControllerTest.php` if it only covers the removed controller (do NOT delete coverage silently — migrate its assertions into TasmiUjianRoutesTest where still relevant)**

- [ ] **Step 5: Run tests**

Run: `php artisan test --compact --filter="TasmiUjianRoutesTest"; if ($?) { php artisan test --compact --filter="Setoran" }`
Expected: PASS (old 5-panel tests either adapted or removed with justification in commit message).

- [ ] **Step 6: Format + commit**

```bash
vendor/bin/pint --dirty --format agent
git add app/Http/Controllers/Muhafidz/TasmiController.php app/Http/Controllers/Muhafidz/UjianController.php app/Http/Controllers/Muhafidz/SetoranController.php app/Http/Requests/Muhafidz/StoreSetoranRequest.php routes/muhafidz.php tests/
git commit -m "feat: split tasmi+ujian controllers, drop 5-panel setoran" --no-verify
```

### Task 5: Frontend 3 halaman + Sidebar + Hapus page lama

**Files:**
- Create: `resources/js/pages/muhafidz/setoran-harian/index.tsx`
- Create: `resources/js/pages/muhafidz/tasmi/index.tsx`
- Create: `resources/js/pages/muhafidz/ujian/index.tsx`
- Modify: `resources/js/components/app-sidebar.tsx:57-61` (3 menu baru + ikon)
- Delete: `resources/js/pages/muhafidz/setoran/index.tsx`
- Modify: Halaqah santris page link "Input Setoran" → Setoran Harian (cari via grep `setoranIndex` di `resources/js/pages/muhafidz/halaqahs/`)

**Interfaces:**
- Consumes: GET props + POST bodies from Tasks 3–4; Wayfinder route functions regenerated via `php artisan wayfinder:generate` (cek perintah yang benar di package.json/composer scripts; jika tidak ada, import manual dari `@/routes/muhafidz/...` mengikuti pola existing).

- [ ] **Step 1: Sidebar — tambah 3 item dengan ikon Lucide (urutan: Setoran Harian `CalendarDays`, Tasmi Pekanan `Mic`, Ujian Bulanan `Award`)**

```tsx
import { index as setoranHarianIndex } from '@/routes/muhafidz/setoran-harian';
import { index as tasmiIndex } from '@/routes/muhafidz/tasmi';
import { index as ujianIndex } from '@/routes/muhafidz/ujian';

const muhafidzNavItems: NavItem[] = [
    { title: 'Halaqah Saya', href: muhafidzHalaqahsIndex(), icon: Library },
    { title: 'Setoran Harian', href: setoranHarianIndex(), icon: CalendarDays },
    { title: 'Tasmi Pekanan', href: tasmiIndex(), icon: Mic },
    { title: 'Ujian Bulanan', href: ujianIndex(), icon: Award },
    { title: 'Riwayat Mutabaah', href: muhafidzMutabaahsHistory(), icon: History },
    { title: 'Target Hafalan', href: muhafidzTargetsIndex(), icon: Target },
];
```

Verify Wayfinder generated files exist after route change; run the project's wayfinder generate command first and confirm import paths.

- [ ] **Step 2: Halaman Setoran Harian (ikut saran ui-ux-pro-max)**

Props: `santris, santriId, tanggal, details[{surah_id, baris}], totalBaris, surahs[{id, nomor, nama_latin, nama_arab, jumlah_ayat, juz}], targetHarian`. Layout: hero kecil (select santri + `<Input type="date" max={today}>`) → daftar baris `[select surah searchable + input baris inputMode="numeric" + tombol hapus]` → tombol "+ Tambah Surah" → sticky footer (total live + target hint "Target 3 baris/hari" + Simpan). Tiap input punya `<Label>` nyata; semua klik `cursor-pointer`; submit `router.post` dengan `{santri_id, tanggal, details}`; toast sukses menyebut nama santri, tanggal id-ID, total baris, jumlah surah. Ganti santri/tanggal kotor → `confirm()` sebelum `router.get`. Hapus semua baris → tombol "Hapus setoran hari ini" (konfirmasi, POST dengan `details: []` yang menghapus row hari itu).

- [ ] **Step 3: Halaman Tasmi + Ujian (fokus tunggal, reuse pola panel lama)**

Tasmi: week picker + select santri + total sepekan read-only besar + input nilai + grade legend + catatan + Simpan. Ujian: month input + select santri + total bulanan read-only + 5 checkbox soal + total live + catatan + Simpan. Logic sama persis dengan panel 3/5 di file yang dihapus (`git show HEAD~:resources/js/pages/muhafidz/setoran/index.tsx` sebagai referensi — jangan copy buta, adaptasi ke props baru).

- [ ] **Step 4: Hapus page lama + perbaiki link Halaqah + build**

Delete `resources/js/pages/muhafidz/setoran/index.tsx`; ganti semua import `setoranIndex/setoranStore` dari `@/routes/muhafidz/setoran` ke route harian. Run: `npm run build`
Expected: success, no TS errors.

- [ ] **Step 5: Commit**

```bash
git add resources/js/app-sidebar.tsx resources/js/pages/muhafidz/ routes/
git commit -m "feat: 3 halaman setoran + sidebar, hapus 5-panel" --no-verify
```
