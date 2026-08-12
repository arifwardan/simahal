# SIMAHAL — Form Input via Modal + Mutaba'ah Bulanan

**Tanggal:** 2026-08-12
**Status:** Draft (menunggu review)
**Basis desain:** `docs/superpowers/specs/2026-08-12-modal-forms-mutabaah-bulanan-design.md` (Approved)

---

## Ringkasan

Mengubah seluruh form create/edit SIMAHAL menjadi modal (Dialog shadcn), menambah field `halaman` ke setoran harian, dan mengimplementasikan modul Mutaba'ah Bulanan penuh (input batch ustadz + dashboard/settings admin) dengan prefill otomatis dari setoran harian.

Keputusan user yang sudah disepakati:
- **Modal batch per halaqah via props halaman santri** — data (santri + prefill + existing + settings) dikirim lewat `HalaqahController@santris` yang diperluas; **tidak ada route GET `mutabaah-bulanan/{bulan}`** — hanya `POST ustadz/mutabaah-bulanan/{bulan}` untuk batch upsert.
- **Tambahkan kolom `jenis` di santris** (enum Ikhwan/Akhwat, nullable) + field form santri admin + dipakai di dashboard (distribusi per jenis).

---

## Global Constraints

- Branch: langsung di `master` (keputusan user).
- Jangan modifikasi: `resources/js/components/ui/*`, token global (`app.css`), `welcome.tsx`, file PHP/pint files selain yang tercantum di plan ini.
- Semua form pakai `<Form {...Controller.store.form()}>` / `<Form {...Controller.update.form({ id })}>` (Wayfinder), **bukan** `useForm`.
- Konversi modal = murni frontend → verifikasi via `npm run types:check` + `npm run build` + smoke test manual (tidak perlu feature test).
- Setiap task berakhir dengan commit terpisah.
- Ada `.ai/rules` yang wajib dibaca: `admin.md` (transaction utk User+profile), `controllers.md` (jangan mass-assign role), `routes.md` (konvensi prefix ustadz), `ustadz.md` (alias `santri_count`), `js.md` (jangan `relative` di Sidebar).
- Konstanta Excel: `1 Juz = 20 halaman` (default settings), ambang hadiah `1.5 juz`. Tabel Referensi 22 bin: `0, 0.25, 1/3, 0.5, 1, 1.5, 2, 2.5, … 9.5`.
- Constraints backend: tabel `mutabaah_bulanans` unique `(santri_id, tahun, bulan)`; `mutabaah_settings` singleton (1 baris).

---

## File Structure

### Backend — dibuat
| File | Tanggung jawab |
| --- | --- |
| `database/migrations/2026_08_12_000001_add_halaman_to_mutabaahs_table.php` | kolom `halaman` nullable di `mutabaahs` |
| `database/migrations/2026_08_12_000002_add_halaman_awal_and_jenis_to_santris_table.php` | kolom `halaman_awal` + `jenis` di `santris` |
| `database/migrations/2026_08_12_000003_create_mutabaah_bulanans_table.php` | tabel mutaba'ah bulanan |
| `database/migrations/2026_08_12_000004_create_mutabaah_settings_table.php` | tabel settings (singleton) |
| `app/Enums/SantriJenis.php` | enum Ikhwan/Akhwat |
| `app/Enums/MutabaahKategori.php` | 22 bin kategori juz |
| `app/Models/MutabaahBulanan.php` | model + relasi belongsTo Santri |
| `app/Models/MutabaahSetting.php` | model singleton + helper `setting()` |
| `app/Actions/MutabaahBulanan/MutabaahBulananCalculator.php` | kalkulator rumus Excel + prefill |
| `app/Http/Requests/Ustadz/StoreMutabaahBulananRequest.php` | validasi batch records |
| `app/Http/Requests/Admin/MutabaahSetting/UpdateMutabaahSettingRequest.php` | validasi settings |
| `app/Http/Controllers/Ustadz/MutabaahBulananController.php` | batch upsert (update only) |
| `app/Http/Controllers/Admin/MutabaahBulananDashboardController.php` | agregasi dashboard admin |
| `app/Http/Controllers/Admin/MutabaahSettingController.php` | edit/update settings |
| `database/factories/MutabaahBulananFactory.php`, `MutabaahSettingFactory.php` | factory |

### Backend — dimodifikasi
| File | Perubahan |
| --- | --- |
| `app/Models/Mutabaah.php` | fillable + cast `halaman` |
| `app/Models/Santri.php` | fillable + cast `halaman_awal`, `jenis` |
| `database/factories/MutabaahFactory.php` | default `halaman` |
| `database/factories/SantriFactory.php` | default `jenis`, `halaman_awal` |
| `app/Http/Requests/Ustadz/StoreMutabaahRequest.php` | tambah rule `halaman` required |
| `app/Http/Requests/Admin/Santri/StoreSantriRequest.php`, `UpdateSantriRequest.php` | tambah `halaman_awal`, `jenis` |
| `app/Http/Controllers/Admin/SantriController.php` | store/update pakai `halaman_awal`+`jenis`; index kirim `jenisOptions` |
| `app/Http/Controllers/Admin/HalaqahController.php` | index sertakan `santri_ids` per row |
| `app/Http/Controllers/Ustadz/MutabaahController.php` | hapus `create()`, store pakai `halaman`, redirect `back()` |
| `app/Http/Controllers/Ustadz/HalaqahController.php` | `santris()` kirim `jenisOptions`, `statusOptions`, `settings`, `bulan`, `tahun`, `bulanan` |
| `routes/ustadz.php` | hapus `mutabaahs.create`, tambah POST `mutabaah-bulanan/{bulan}` |
| `routes/admin.php` | tambah GET `mutabaah-bulanan`, GET/PUT `mutabaah-settings` |

### Frontend — dibuat
| File | Tanggung jawab |
| --- | --- |
| `resources/js/components/forms/UserForm.tsx` | form create+edit user |
| `resources/js/components/forms/SantriForm.tsx` | form create+edit santri (termasuk `halaman_awal`, `jenis`) |
| `resources/js/components/forms/UstadzForm.tsx` | form create+edit ustadz |
| `resources/js/components/forms/OrangTuaForm.tsx` | form create+edit orang tua |
| `resources/js/components/forms/HalaqahForm.tsx` | form create+edit halaqah (multi-select santri) |
| `resources/js/components/forms/MutabaahForm.tsx` | form setoran harian (termasuk `halaman`) |
| `resources/js/components/forms/TargetForm.tsx` | form create+edit target hafalan |
| `resources/js/lib/mutabaah-bulanan.ts` | helper derive klien (preview kalkulator) |
| `resources/js/pages/admin/mutabaah-bulanan/index.tsx` | dashboard mutaba'ah bulanan admin |
| `resources/js/pages/admin/mutabaah-settings.tsx` | settings admin |

### Frontend — dimodifikasi
| File | Perubahan |
| --- | --- |
| `resources/js/pages/admin/{users,santris,ustadzs,orang-tuas,halaqahs}/index.tsx` | create+edit jadi Dialog, pakai form components |
| `resources/js/pages/ustadz/halaqahs/santris.tsx` | tombol "Catat Mutabaah" → Dialog harian; tombol "Rekap Bulanan" → Dialog batch bulanan |
| `resources/js/pages/ustadz/mutabaahs/create.tsx` | **DIHAPUS** |
| `resources/js/pages/ustadz/targets/index.tsx` | create+edit jadi Dialog |
| `resources/js/components/app-sidebar.tsx` | tambah nav admin: "Mutabaah Bulanan", "Pengaturan Mutabaah" |

### Tests
| File | Perubahan |
| --- | --- |
| `tests/Feature/SchemaTest.php` | tambah tabel `mutabaah_bulanans`, `mutabaah_settings` |
| `tests/Unit/MutabaahBulananCalculatorTest.php` | (baru) unit test kalkulator |
| `tests/Unit/EnumsTest.php` | tambah `SantriJenis`, `MutabaahKategori` ke label test |
| `tests/Feature/ModelRelationshipsTest.php` | tambah relasi `MutabaahBulanan belongsTo Santri` |
| `tests/Feature/Admin/SantriManagementTest.php` | payload + assert `halaman_awal`, `jenis` |
| `tests/Feature/Ustadz/MutabaahStoreTest.php` | hapus test create route, tambah `halaman` required + assert |
| `tests/Feature/Ustadz/MutabaahBulananTest.php` | (baru) scoping, validasi, upsert, halaman_awal_bulan, prefill |
| `tests/Feature/Admin/MutabaahBulananDashboardTest.php` | (baru) dashboard admin |
| `tests/Feature/Admin/MutabaahSettingTest.php` | (baru) settings admin |

---

## Task 1 — Migrations

**Goal:** Skema DB lengkap untuk fitur.

1. Buat 4 file migration:
   - `database/migrations/2026_08_12_000001_add_halaman_to_mutabaahs_table.php`
   - `database/migrations/2026_08_12_000002_add_halaman_awal_and_jenis_to_santris_table.php`
   - `database/migrations/2026_08_12_000003_create_mutabaah_bulanans_table.php`
   - `database/migrations/2026_08_12_000004_create_mutabaah_settings_table.php`

```php
// 2026_08_12_000001_add_halaman_to_mutabaahs_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mutabaahs', function (Blueprint $table) {
            $table->integer('halaman')->nullable()->after('ayat_selesai');
        });
    }

    public function down(): void
    {
        Schema::table('mutabaahs', function (Blueprint $table) {
            $table->dropColumn('halaman');
        });
    }
};
```

```php
// 2026_08_12_000002_add_halaman_awal_and_jenis_to_santris_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('santris', function (Blueprint $table) {
            $table->integer('halaman_awal')->nullable()->after('status');
            $table->string('jenis')->nullable()->after('halaman_awal'); // ikhwan|akhwat|null
        });
    }

    public function down(): void
    {
        Schema::table('santris', function (Blueprint $table) {
            $table->dropColumn(['halaman_awal', 'jenis']);
        });
    }
};
```

```php
// 2026_08_12_000003_create_mutabaah_bulanans_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mutabaah_bulanans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('santri_id')->constrained()->cascadeOnDelete();
            $table->integer('tahun');
            $table->integer('bulan'); // 1..12
            $table->integer('halaman_awal_bulan')->nullable();
            $table->integer('halaman_kumulatif')->nullable();
            $table->string('juz_dihafal')->nullable();
            $table->integer('tasmi_pekan_1')->nullable();
            $table->integer('tasmi_pekan_2')->nullable();
            $table->integer('tasmi_pekan_3')->nullable();
            $table->integer('tasmi_pekan_4')->nullable();
            $table->integer('tasmi_pekan_5')->nullable();
            $table->integer('ujian_soal_1')->nullable();
            $table->integer('ujian_soal_2')->nullable();
            $table->integer('ujian_soal_3')->nullable();
            $table->integer('ujian_soal_4')->nullable();
            $table->integer('ujian_soal_5')->nullable();
            $table->timestamps();

            $table->unique(['santri_id', 'tahun', 'bulan']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mutabaah_bulanans');
    }
};
```

```php
// 2026_08_12_000004_create_mutabaah_settings_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mutabaah_settings', function (Blueprint $table) {
            $table->id();
            $table->integer('konversi_juz_halaman')->default(20); // 1 juz = 20 halaman
            $table->float('ambang_hadiah_juz')->default(1.5);
            $table->integer('tahun_aktif')->default(2026);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mutabaah_settings');
    }
};
```

2. Update `tests/Feature/SchemaTest.php` — tambah `mutabaah_bulanans`, `mutabaah_settings` ke array `$tables`.

3. Jalankan: `php artisan test --filter=SchemaTest`
4. Commit: `feat: add mutabaah bulanan database schema`

---

## Task 2 — Models, Enums, Factories

**Goal:** Model, enum, dan factory siap dipakai kalkulator + test.

1. **`app/Enums/SantriJenis.php`**
```php
<?php

namespace App\Enums;

enum SantriJenis: string
{
    case Ikhwan = 'ikhwan';
    case Akhwat = 'akhwat';

    public function label(): string
    {
        return match ($this) {
            self::Ikhwan => 'Ikhwan',
            self::Akhwat => 'Akhwat',
        };
    }
}
```

2. **`app/Enums/MutabaahKategori.php`** — 22 bin.
```php
<?php

namespace App\Enums;

enum MutabaahKategori: string
{
    case Belum = '0';
    case Seperempat = '0.25';
    case Sepertiga = '0.333333';
    case Setengah = '0.5';
    case Satu = '1';
    case SatuSetengah = '1.5';
    case Dua = '2';
    case DuaSetengah = '2.5';
    case Tiga = '3';
    case TigaSetengah = '3.5';
    case Empat = '4';
    case EmpatSetengah = '4.5';
    case Lima = '5';
    case LimaSetengah = '5.5';
    case Enam = '6';
    case EnamSetengah = '6.5';
    case Tujuh = '7';
    case TujuhSetengah = '7.5';
    case Delapan = '8';
    case DelapanSetengah = '8.5';
    case Sembilan = '9';
    case SembilanSetengah = '9.5';

    public function threshold(): float
    {
        return (float) $this->value;
    }

    public function label(): string
    {
        return match ($this) {
            self::Belum => 'Belum Mencapai 1/4 Juz',
            self::Seperempat => '1/4 Juz',
            self::Sepertiga => '1/3 Juz',
            self::Setengah => '1/2 Juz',
            self::Satu => '1 Juz',
            default => str_replace('.', ',', $this->value).' Juz',
        };
    }

    public static function forTotalJuz(float $juz): ?self
    {
        $result = null;

        foreach (self::cases() as $case) {
            if ($case->threshold() <= $juz) {
                $result = $case;
            }
        }

        return $result;
    }
}
```

3. **`app/Models/MutabaahBulanan.php`**
```php
<?php

namespace App\Models;

use Database\Factories\MutabaahBulananFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $santri_id
 * @property int $tahun
 * @property int $bulan
 * @property int|null $halaman_awal_bulan
 * @property int|null $halaman_kumulatif
 */
#[Fillable([
    'santri_id', 'tahun', 'bulan', 'halaman_awal_bulan', 'halaman_kumulatif',
    'juz_dihafal', 'tasmi_pekan_1', 'tasmi_pekan_2', 'tasmi_pekan_3', 'tasmi_pekan_4', 'tasmi_pekan_5',
    'ujian_soal_1', 'ujian_soal_2', 'ujian_soal_3', 'ujian_soal_4', 'ujian_soal_5',
])]
class MutabaahBulanan extends Model
{
    /** @use HasFactory<MutabaahBulananFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tahun' => 'integer',
            'bulan' => 'integer',
            'halaman_awal_bulan' => 'integer',
            'halaman_kumulatif' => 'integer',
            'tasmi_pekan_1' => 'integer',
            'tasmi_pekan_2' => 'integer',
            'tasmi_pekan_3' => 'integer',
            'tasmi_pekan_4' => 'integer',
            'tasmi_pekan_5' => 'integer',
            'ujian_soal_1' => 'integer',
            'ujian_soal_2' => 'integer',
            'ujian_soal_3' => 'integer',
            'ujian_soal_4' => 'integer',
            'ujian_soal_5' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Santri, $this>
     */
    public function santri(): BelongsTo
    {
        return $this->belongsTo(Santri::class);
    }
}
```

4. **`app/Models/MutabaahSetting.php`** — singleton.
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int $konversi_juz_halaman
 * @property float $ambang_hadiah_juz
 * @property int $tahun_aktif
 */
#[Fillable(['konversi_juz_halaman', 'ambang_hadiah_juz', 'tahun_aktif'])]
class MutabaahSetting extends Model
{
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'konversi_juz_halaman' => 'integer',
            'ambang_hadiah_juz' => 'float',
            'tahun_aktif' => 'integer',
        ];
    }

    public static function setting(): self
    {
        return self::query()->firstOrCreate(
            ['id' => 1],
            ['konversi_juz_halaman' => 20, 'ambang_hadiah_juz' => 1.5, 'tahun_aktif' => (int) now()->year],
        );
    }
}
```

5. **Update `app/Models/Mutabaah.php`** — tambah `halaman` ke `#[Fillable(...)]` dan casts `'halaman' => 'integer'`.

6. **Update `app/Models/Santri.php`** — tambah `halaman_awal`, `jenis` ke `#[Fillable(...)]`; casts `'jenis' => SantriJenis::class` + `'halaman_awal' => 'integer'`. Tambah import `use App\Enums\SantriJenis;`.

7. **Factories:**
   - `database/factories/MutabaahBulananFactory.php`:
```php
<?php

namespace Database\Factories;

use App\Models\MutabaahBulanan;
use App\Models\Santri;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MutabaahBulanan>
 */
class MutabaahBulananFactory extends Factory
{
    public function definition(): array
    {
        return [
            'santri_id' => Santri::factory(),
            'tahun' => 2026,
            'bulan' => 1,
            'halaman_awal_bulan' => null,
            'halaman_kumulatif' => null,
            'juz_dihafal' => null,
            'tasmi_pekan_1' => null,
            'tasmi_pekan_2' => null,
            'tasmi_pekan_3' => null,
            'tasmi_pekan_4' => null,
            'tasmi_pekan_5' => null,
            'ujian_soal_1' => null,
            'ujian_soal_2' => null,
            'ujian_soal_3' => null,
            'ujian_soal_4' => null,
            'ujian_soal_5' => null,
        ];
    }
}
```
   - `database/factories/MutabaahSettingFactory.php`:
```php
<?php

namespace Database\Factories;

use App\Models\MutabaahSetting;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MutabaahSetting>
 */
class MutabaahSettingFactory extends Factory
{
    public function definition(): array
    {
        return [
            'konversi_juz_halaman' => 20,
            'ambang_hadiah_juz' => 1.5,
            'tahun_aktif' => 2026,
        ];
    }
}
```
   - Update `database/factories/MutabaahFactory.php` — tambah `'halaman' => fake()->numberBetween(1, 10),`.
   - Update `database/factories/SantriFactory.php` — tambah `'jenis' => null,` dan `'halaman_awal' => null,`.

8. **Update tests:**
   - `tests/Unit/EnumsTest.php` — tambah ke array `$all`: `...SantriJenis::cases(), ...MutabaahKategori::cases(),` + import keduanya.
   - `tests/Feature/ModelRelationshipsTest.php` — tambah test:
```php
test('mutabaah bulanan belongs to santri', function () {
    $santri = Santri::factory()->create();
    $bulanan = MutabaahBulanan::factory()->create(['santri_id' => $santri->id]);

    expect($bulanan->santri->id)->toBe($santri->id);
});
```

9. Jalankan: `php artisan test --filter="EnumsTest|ModelRelationshipsTest"` lalu `vendor/bin/pint --dirty --format agent`.
10. Commit: `feat: add mutabaah bulanan models, enums and factories`

---

## Task 3 — MutabaahBulananCalculator + Unit Tests (TDD)

**Goal:** Kalkulator rumus Excel yang pure & mudah diuji, plus prefill dari setoran harian.

**Urutan TDD:** tulis test dulu → jalankan (merah) → implementasi → hijau.

1. **Tulis `tests/Unit/MutabaahBulananCalculatorTest.php`** (jalankan dulu → merah):
```php
<?php

use App\Actions\MutabaahBulanan\MutabaahBulananCalculator;
use App\Enums\MutabaahJenis;
use App\Enums\MutabaahKategori;
use App\Enums\MutabaahStatus;
use App\Models\Mutabaah;
use App\Models\MutabaahBulanan;
use App\Models\Santri;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(RefreshDatabase::class, TestCase::class);

function makeBulanan(array $attributes = []): MutabaahBulanan
{
    $defaults = [
        'halaman_awal_bulan' => 10,
        'halaman_kumulatif' => 27,
    ];

    return MutabaahBulanan::factory()->create(array_merge($defaults, $attributes));
}

test('tambah halaman is kumulatif minus awal bulan', function () {
    $mb = makeBulanan(['halaman_awal_bulan' => 10, 'halaman_kumulatif' => 27]);

    expect(app(MutabaahBulananCalculator::class)->tambahHalaman($mb))->toBe(17);
});

test('tambah juz rounds to 2 decimals', function () {
    $mb = makeBulanan(['halaman_awal_bulan' => 10, 'halaman_kumulatif' => 27]);

    expect(app(MutabaahBulananCalculator::class)->tambahJuz($mb, 20))->toBe(0.85);
});

test('total juz uses halaman kumulatif over conversion', function () {
    $mb = makeBulanan(['halaman_kumulatif' => 40]);

    expect(app(MutabaahBulananCalculator::class)->totalJuz($mb, 20))->toBe(2.0);
});

test('kategori matches excel vlookup bins', function () {
    $calc = app(MutabaahBulananCalculator::class);

    expect($calc->kategori(makeBulanan(['halaman_kumulatif' => 17]), 20))
        ->toBe(MutabaahKategori::Setengah);
    expect($calc->kategori(makeBulanan(['halaman_kumulatif' => 40]), 20))
        ->toBe(MutabaahKategori::Dua);
    expect($calc->kategori(makeBulanan(['halaman_kumulatif' => null]), 20))
        ->toBeNull();
});

test('keterangan follows excel conditions', function () {
    $calc = app(MutabaahBulananCalculator::class);

    expect($calc->keterangan(makeBulanan(['halaman_kumulatif' => null]), 20, 1.5))
        ->toBe('Belum Diisi');
    expect($calc->keterangan(makeBulanan(['halaman_awal_bulan' => 10, 'halaman_kumulatif' => 45]), 20, 1.5))
        ->toBe('Berprestasi (Hadiah)'); // tambah 35 halaman = 1.75 juz
    expect($calc->keterangan(makeBulanan(['halaman_awal_bulan' => 10, 'halaman_kumulatif' => 12]), 20, 1.5))
        ->toBe('Di Bawah Target'); // tambah 2 halaman = 0.1 juz
    expect($calc->keterangan(makeBulanan(['halaman_awal_bulan' => 10, 'halaman_kumulatif' => 20]), 20, 1.5))
        ->toBe('Sesuai Target'); // tambah 10 halaman = 0.5 juz
});

test('rata tasmi and rata ujian ignore null values', function () {
    $calc = app(MutabaahBulananCalculator::class);

    $mb = makeBulanan([
        'tasmi_pekan_1' => 80,
        'tasmi_pekan_2' => null,
        'tasmi_pekan_3' => 90,
        'tasmi_pekan_4' => null,
        'tasmi_pekan_5' => 100,
        'ujian_soal_1' => 70,
        'ujian_soal_2' => 80,
        'ujian_soal_3' => null,
        'ujian_soal_4' => null,
        'ujian_soal_5' => null,
    ]);

    expect($calc->rataTasmi($mb))->toBe(90.0);
    expect($calc->rataUjian($mb))->toBe(75.0);
    expect($calc->rataTasmi(makeBulanan()))->toBeNull();
});

test('prefill kumulatif sums daily halaman onto halaman awal', function () {
    $santri = Santri::factory()->create(['halaman_awal' => 5]);

    Mutabaah::factory()->create([
        'santri_id' => $santri->id,
        'tanggal' => '2026-01-05',
        'halaman' => 3,
        'jenis' => MutabaahJenis::Setoran,
        'status' => MutabaahStatus::Lulus,
    ]);
    Mutabaah::factory()->create([
        'santri_id' => $santri->id,
        'tanggal' => '2026-01-12',
        'halaman' => 4,
        'jenis' => MutabaahJenis::Setoran,
        'status' => MutabaahStatus::Lulus,
    ]);

    $calc = app(MutabaahBulananCalculator::class);

    expect($calc->prefillKumulatif($santri, 1, 2026))->toBe(12); // 5 + 3 + 4
    expect($calc->prefillKumulatif($santri, 2, 2026))->toBeNull(); // tidak ada setoran
});

test('halaman awal bulan is santri halaman awal for january', function () {
    $santri = Santri::factory()->create(['halaman_awal' => 8]);
    $calc = app(MutabaahBulananCalculator::class);

    expect($calc->halamanAwalBulan($santri, 1, 2026))->toBe(8);
});

test('halaman awal bulan for february uses january kumulatif', function () {
    $santri = Santri::factory()->create(['halaman_awal' => 8]);
    MutabaahBulanan::factory()->create([
        'santri_id' => $santri->id,
        'tahun' => 2026,
        'bulan' => 1,
        'halaman_kumulatif' => 25,
    ]);
    $calc = app(MutabaahBulananCalculator::class);

    expect($calc->halamanAwalBulan($santri, 2, 2026))->toBe(25);
    expect($calc->halamanAwalBulan($santri, 2, 2027))->toBe(8); // fallback ke halaman_awal
});
```

2. **Implementasi `app/Actions/MutabaahBulanan/MutabaahBulananCalculator.php`**:
```php
<?php

namespace App\Actions\MutabaahBulanan;

use App\Enums\MutabaahKategori;
use App\Models\MutabaahBulanan;
use App\Models\Santri;

class MutabaahBulananCalculator
{
    public function tambahHalaman(MutabaahBulanan $mb): int
    {
        return $mb->halaman_kumulatif - $mb->halaman_awal_bulan;
    }

    public function tambahJuz(MutabaahBulanan $mb, int $konversiJuz): float
    {
        return round($this->tambahHalaman($mb) / $konversiJuz, 2);
    }

    public function totalJuz(MutabaahBulanan $mb, int $konversiJuz): float
    {
        return round($mb->halaman_kumulatif / $konversiJuz, 2);
    }

    public function kategori(MutabaahBulanan $mb, int $konversiJuz): ?MutabaahKategori
    {
        if ($mb->halaman_kumulatif === null) {
            return null;
        }

        return MutabaahKategori::forTotalJuz($this->totalJuz($mb, $konversiJuz));
    }

    public function keterangan(MutabaahBulanan $mb, int $konversiJuz, float $ambangHadiah): string
    {
        if ($mb->halaman_kumulatif === null) {
            return 'Belum Diisi';
        }

        $tambahJuz = $this->tambahJuz($mb, $konversiJuz);

        if ($tambahJuz >= $ambangHadiah) {
            return 'Berprestasi (Hadiah)';
        }

        if ($tambahJuz < 0.25) {
            return 'Di Bawah Target';
        }

        return 'Sesuai Target';
    }

    public function rataTasmi(MutabaahBulanan $mb): ?float
    {
        return $this->rataNilai([
            $mb->tasmi_pekan_1, $mb->tasmi_pekan_2, $mb->tasmi_pekan_3, $mb->tasmi_pekan_4, $mb->tasmi_pekan_5,
        ]);
    }

    public function rataUjian(MutabaahBulanan $mb): ?float
    {
        return $this->rataNilai([
            $mb->ujian_soal_1, $mb->ujian_soal_2, $mb->ujian_soal_3, $mb->ujian_soal_4, $mb->ujian_soal_5,
        ]);
    }

    /**
     * @param array<int, int|null> $values
     */
    private function rataNilai(array $values): ?float
    {
        $values = array_values(array_filter($values, fn ($value) => $value !== null));

        if ($values === []) {
            return null;
        }

        return round(array_sum($values) / count($values), 2);
    }

    public function halamanAwalBulan(Santri $santri, int $bulan, int $tahun): ?int
    {
        if ($bulan === 1) {
            return $santri->halaman_awal;
        }

        $previous = MutabaahBulanan::query()
            ->where('santri_id', $santri->id)
            ->where('tahun', $tahun)
            ->where('bulan', $bulan - 1)
            ->first();

        return $previous?->halaman_kumulatif ?? $santri->halaman_awal;
    }

    public function prefillKumulatif(Santri $santri, int $bulan, int $tahun): ?int
    {
        $halamanAwal = $this->halamanAwalBulan($santri, $bulan, $tahun) ?? 0;

        $sumHalaman = $santri->mutabaahs()
            ->whereYear('tanggal', $tahun)
            ->whereMonth('tanggal', $bulan)
            ->whereNotNull('halaman')
            ->sum('halaman');

        if ($sumHalaman <= 0) {
            return null;
        }

        return $halamanAwal + $sumHalaman;
    }
}
```

3. Jalankan: `php artisan test --filter=MutabaahBulananCalculatorTest` → hijau.
4. Commit: `feat: add mutabaah bulanan calculator with prefill`

---

## Task 4 — Backend Wiring: Requests + Controllers

**Goal:** Validasi & controller menerima field baru; feature test updated.

1. **`app/Http/Requests/Ustadz/StoreMutabaahRequest.php`** — tambah rule:
```php
'halaman' => ['required', 'integer', 'min:1'],
```

2. **`app/Http/Controllers/Ustadz/MutabaahController.php`**:
   - `store()`: tambah `'halaman' => $validated['halaman'],` ke array `Mutabaah::create()`.
   - Ganti redirect `to_route('ustadz.mutabaahs.create', ...)` (yang sudah tidak ada) jadi `return back();` setelah flash toast (pola flash sama dengan sekarang).
   - **Hapus method `create()`** seluruhnya (route juga dihapus di Task 6).

3. **`app/Http/Requests/Admin/Santri/StoreSantriRequest.php`** — tambah:
```php
'halaman_awal' => ['nullable', 'integer', 'min:0'],
'jenis' => ['nullable', new Enum(SantriJenis::class)],
```
(dengan `use App\Enums\SantriJenis;`)

4. **`app/Http/Requests/Admin/Santri/UpdateSantriRequest.php`** — tambah sama seperti di atas.

5. **`app/Http/Controllers/Admin/SantriController.php`**:
   - `store()`: tambah `'halaman_awal' => $validated['halaman_awal'] ?? null, 'jenis' => $validated['jenis'] ?? null,` ke `Santri::create()`.
   - `update()`: tambah keduanya ke `$santri->update()` (cek implementasi update saat ini dan sesuaikan).
   - `index()`: tambah prop `'jenisOptions' => collect(SantriJenis::cases())->map(fn (SantriJenis $jenis) => ['value' => $jenis->value, 'label' => $jenis->label()]),`.

6. **`app/Http/Controllers/Admin/HalaqahController.php`** — `index()`: tambah eager load + map `santri_ids` per row (dipakai edit modal):
```php
$halaqahs = Halaqah::query()
    ->with(['ustadz', 'santris:id'])
    ->withCount('santris')
    ->orderBy('nama')
    ->paginate(15)
    ->through(fn (Halaqah $halaqah) => [
        'id' => $halaqah->id,
        'nama' => $halaqah->nama,
        'jadwal' => $halaqah->jadwal,
        'status' => $halaqah->status->value,
        'santris_count' => $halaqah->santris_count,
        'ustadz' => $halaqah->ustadz ? ['id' => $halaqah->ustadz->id, 'nama' => $halaqah->ustadz->nama] : null,
        'santri_ids' => $halaqah->santris->pluck('id')->toArray(),
    ]);
```

7. **Update `tests/Feature/Admin/SantriManagementTest.php`**:
   - `admin can create a santri...` — tambah payload `'halaman_awal' => 10, 'jenis' => SantriJenis::Ikhwan->value` dan assert database:
```php
$this->assertDatabaseHas('santris', [
    'nis' => '2024009',
    'nama' => 'Santri Cinta',
    'halaman_awal' => 10,
    'jenis' => SantriJenis::Ikhwan->value,
]);
```
   - `admin can update a santri...` — tambah `halaman_awal` dan `jenis` di payload update + assert.

8. **Update `tests/Feature/Ustadz/MutabaahStoreTest.php`**:
   - Hapus test yang melakukan GET `route('ustadz.mutabaahs.create', ...)` (route dihapus).
   - Tambah `'halaman' => 3,` ke semua payload `post(route('ustadz.mutabaahs.store'), ...)`.
   - Tambah test baru:
```php
test('halaman is required to store a mutabaah', function () {
    // buat ustadz + halaqah + santri anggota (pola sama seperti test store yang lain)
    // post tanpa 'halaman'
    // ->assertSessionHasErrors('halaman')
});
```
   - Test "ustadz can record..." — tambah assert `assertDatabaseHas('mutabaahs', ['halaman' => 3])`.

9. Jalankan: `php artisan test --filter="SantriManagementTest|MutabaahStoreTest"`.
10. Commit: `feat: wire halaman and santri jenis fields through backend`

---

## Task 5 — Admin Modal Conversion (5 Halaman)

**Goal:** Semua form create+edit admin jadi Dialog. Murni frontend (verifikasi tsc + build + smoke).

**Pola umum tiap halaman:** ganti blok `{showForm && <Form>}` dan tambah tombol edit per baris → buka `Dialog` yang merender komponen form dengan prop `nilaiAwal`.

1. **Buat komponen form admin** — semuanya di `resources/js/components/forms/`. Setiap form: export `type XxxRow = {...}` yang dipakai page untuk `nilaiAwal`.

**`UserForm.tsx`** (contoh lengkap):
```tsx
import { Form } from '@inertiajs/react';
import UserController from '@/actions/App/Http/Controllers/Admin/UserController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export type UserRow = {
    id: number;
    name: string;
    email: string;
    role: string;
    role_label: string;
};

type Option = { value: string; label: string };

type Props = {
    nilaiAwal?: UserRow | null;
    roles: Option[];
    onSuccess?: () => void;
};

export default function UserForm({ nilaiAwal, roles, onSuccess }: Props) {
    const isEdit = nilaiAwal !== null && nilaiAwal !== undefined;

    return (
        <Form
            {...(isEdit
                ? UserController.update.form({ user: nilaiAwal!.id })
                : UserController.store.form())}
            onSuccess={onSuccess}
            className="space-y-4"
        >
            {({ errors }) => (
                <>
                    <div className="grid gap-2">
                        <Label htmlFor={`name-${isEdit ? nilaiAwal!.id : 'new'}`}>Nama</Label>
                        <Input
                            id={`name-${isEdit ? nilaiAwal!.id : 'new'}`}
                            name="name"
                            placeholder="Nama lengkap"
                            defaultValue={nilaiAwal?.name}
                            required
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor={`email-${isEdit ? nilaiAwal!.id : 'new'}`}>Email</Label>
                        <Input
                            id={`email-${isEdit ? nilaiAwal!.id : 'new'}`}
                            name="email"
                            type="email"
                            placeholder="email@example.com"
                            defaultValue={nilaiAwal?.email}
                            required
                        />
                        <InputError message={errors.email} />
                    </div>

                    {!isEdit && (
                        <div className="grid gap-2">
                            <Label htmlFor="password-new">Password</Label>
                            <Input
                                id="password-new"
                                name="password"
                                type="password"
                                placeholder="Minimal 8 karakter"
                                required
                            />
                            <InputError message={errors.password} />
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor={`role-${isEdit ? nilaiAwal!.id : 'new'}`}>Role</Label>
                        <Select name="role" defaultValue={nilaiAwal?.role ?? 'santri'}>
                            <SelectTrigger id={`role-${isEdit ? nilaiAwal!.id : 'new'}`}>
                                <SelectValue placeholder="Pilih role" />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map((role) => (
                                    <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.role} />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="submit">{isEdit ? 'Simpan Perubahan' : 'Simpan User'}</Button>
                    </div>
                </>
            )}
        </Form>
    );
}
```

> Catatan Wayfinder: `update.form({ user: id })` sudah menghasilkan method PATCH via `_method` di query string (lihat generated `UserController`). Ikuti pola `ustadz/targets/index.tsx` existing — JANGAN render hidden input `_method`.

**Komponen lain (kerangka sama, field beda):**
- `SantriForm.tsx` — export `type SantriRow`. Props: `nilaiAwal?`, `orangTuas: {id; nama}[]`, `statuses: Option[]`, `jenisOptions: Option[]`. State `selectedOrangTua` (init `nilaiAwal?.orang_tua_id ?? ''`). Field: name (dipakai user.name + santri.nama), email, password (create only), nis, tanggal_lahir, status (Select), jenis (Select — TANPA item "none"; jika tidak dipilih input tak ter-submit → nullable aman), halaman_awal (Input number min 0), orang_tua_id (Select item `none`; kirim `''` saat none). Pakai `SantriController.store.form()` / `update.form({ santri: id })`.
- `UstadzForm.tsx` — export `type UstadzRow`. Props: `nilaiAwal?`. Field: name, email, password (create only), kontak. `UstadzController.store.form()` / `update.form({ ustadz: id })`.
- `OrangTuaForm.tsx` — export `type OrangTuaRow`. Props: `nilaiAwal?`. Field: name, email, password (create only), kontak. `OrangTuaController.store.form()` / `update.form({ orangTua: id })`.
- `HalaqahForm.tsx` — export `type HalaqahRow`. Props: `nilaiAwal?`, `ustadzs: {id; nama}[]`, `santris: {id; nama}[]`, `statuses: Option[]`. State `selectedSantris: number[]` init `nilaiAwal?.santri_ids ?? []` (harus array baru tiap buka modal → pakai `key={editing?.id}` di DialogContent agar state re-init). Field: nama, jadwal, status (Select), ustadz_id (Select), santri_ids (checkbox list `name="santri_ids[]"`, checked dari state). `HalaqahController.store.form()` / `update.form({ halaqah: id })`.

2. **Ubah `resources/js/pages/admin/users/index.tsx`** (contoh lengkap pola halaman):
```tsx
import Heading from '@/components/heading';
import PageContainer from '@/components/page-container';
import UserForm, { type UserRow } from '@/components/forms/UserForm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { useState } from 'react';

type Props = {
    users: { data: UserRow[]; total: number };
    roles: { value: string; label: string }[];
};

export default function AdminUsersIndex({ users, roles }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [editing, setEditing] = useState<UserRow | null>(null);

    return (
        <PageContainer>
            <Heading title="Manajemen User" description="Kelola akun dan peran pengguna SIMAHAL." />

            <Card>
                <CardHeader>
                    <CardTitle>Daftar User ({users.total})</CardTitle>
                    <CardDescription>Klik "Buat User" untuk menambah akun baru.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Dialog open={showCreate} onOpenChange={setShowCreate}>
                        <DialogTrigger asChild>
                            <Button>Buat User</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Buat User</DialogTitle>
                                <DialogDescription>Tambahkan akun pengguna baru ke SIMAHAL.</DialogDescription>
                            </DialogHeader>
                            <UserForm roles={roles} onSuccess={() => setShowCreate(false)} />
                        </DialogContent>
                    </Dialog>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-muted-foreground">
                                    <th className="py-2 pr-4">Nama</th>
                                    <th className="py-2 pr-4">Email</th>
                                    <th className="py-2 pr-4">Role</th>
                                    <th className="py-2 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.data.map((user) => (
                                    <tr key={user.id} className="border-b last:border-0">
                                        <td className="py-2 pr-4 font-medium">{user.name}</td>
                                        <td className="py-2 pr-4">{user.email}</td>
                                        <td className="py-2 pr-4">
                                            <Badge>{user.role_label}</Badge>
                                        </td>
                                        <td className="py-2 text-right">
                                            <Button variant="outline" size="sm" onClick={() => setEditing(user)}>
                                                Edit
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
                <DialogContent key={editing?.id}>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>Perbarui akun pengguna.</DialogDescription>
                    </DialogHeader>
                    {editing && (
                        <UserForm roles={roles} nilaiAwal={editing} onSuccess={() => setEditing(null)} />
                    )}
                </DialogContent>
            </Dialog>
        </PageContainer>
    );
}
```

3. **Terapkan pola yang sama** ke `resources/js/pages/admin/santris/index.tsx`, `admin/ustadzs/index.tsx`, `admin/orang-tuas/index.tsx`, `admin/halaqahs/index.tsx`:
   - Santri: tombol "Tambah Santri" + tombol Edit per baris; `SantriForm` pakai props `orangTuas`, `statuses`, `jenisOptions` (props baru dari controller Task 4).
   - Ustadz/OrangTua: `UstadzForm`/`OrangTuaForm`; pastikan row data punya `email` (type row disesuaikan).
   - Halaqah: `HalaqahForm` dengan `ustadzs`, `santris`, `statuses`; row data pakai `santri_ids` dari controller Task 4.
   - Pertahankan tombol hapus + pagination existing di tiap halaman.

4. Verifikasi: `npm run types:check` dan `npm run build` → bersih. Smoke test manual: buka tiap halaman admin, buka modal create, isi, submit; buka modal edit, ubah, submit.

5. Commit: `feat: convert admin forms to modals with edit support`

---

## Task 6 — Ustadz Daily Mutabaah Modal + Hapus Create Page

**Goal:** Halaman `ustadz/mutabaahs/create.tsx` dihapus; "Catat Mutabaah" jadi Dialog di halaman santri halaqah; `HalaqahController@santris` diperluas.

1. **Backend:**
   - `routes/ustadz.php` — hapus baris route `mutabaahs.create`.
   - `app/Http/Controllers/Ustadz/MutabaahController.php` — method `create()` sudah dihapus di Task 4 (pastikan).
   - `app/Http/Controllers/Ustadz/HalaqahController.php` — perluas method `santris()`:
```php
use App\Actions\MutabaahBulanan\MutabaahBulananCalculator;
use App\Enums\MutabaahJenis;
use App\Enums\MutabaahStatus;
use App\Models\MutabaahBulanan;
use App\Models\MutabaahSetting;
use App\Models\Santri;

// di dalam santris(), setelah $santris = $halaqah->santris()->orderBy('nama')->paginate(15);

$settings = MutabaahSetting::setting();
$bulan = $request->integer('bulan', now()->month);
$bulan = max(1, min(12, $bulan));
$tahun = $settings->tahun_aktif;

$calculator = app(MutabaahBulananCalculator::class);

$bulanan = $halaqah->santris()
    ->orderBy('nama')
    ->get()
    ->map(function (Santri $santri) use ($calculator, $bulan, $tahun): array {
        $existing = MutabaahBulanan::query()
            ->where('santri_id', $santri->id)
            ->where('tahun', $tahun)
            ->where('bulan', $bulan)
            ->first();

        return [
            'santri_id' => $santri->id,
            'nama' => $santri->nama,
            'halaman_awal_bulan' => $calculator->halamanAwalBulan($santri, $bulan, $tahun),
            'prefill_kumulatif' => $calculator->prefillKumulatif($santri, $bulan, $tahun),
            'existing' => $existing ? [
                'halaman_kumulatif' => $existing->halaman_kumulatif,
                'juz_dihafal' => $existing->juz_dihafal,
                'tasmi_pekan_1' => $existing->tasmi_pekan_1,
                'tasmi_pekan_2' => $existing->tasmi_pekan_2,
                'tasmi_pekan_3' => $existing->tasmi_pekan_3,
                'tasmi_pekan_4' => $existing->tasmi_pekan_4,
                'tasmi_pekan_5' => $existing->tasmi_pekan_5,
                'ujian_soal_1' => $existing->ujian_soal_1,
                'ujian_soal_2' => $existing->ujian_soal_2,
                'ujian_soal_3' => $existing->ujian_soal_3,
                'ujian_soal_4' => $existing->ujian_soal_4,
                'ujian_soal_5' => $existing->ujian_soal_5,
            ] : null,
        ];
    });

return Inertia::render('ustadz/halaqahs/santris', [
    'halaqah' => $halaqah,
    'santris' => $santris,
    'jenisOptions' => collect(MutabaahJenis::cases())->map(fn ($jenis) => ['value' => $jenis->value, 'label' => $jenis->label()]),
    'statusOptions' => collect(MutabaahStatus::cases())->map(fn ($status) => ['value' => $status->value, 'label' => $status->label()]),
    'settings' => $settings->only(['konversi_juz_halaman', 'ambang_hadiah_juz', 'tahun_aktif']),
    'bulan' => $bulan,
    'tahun' => $tahun,
    'bulanan' => $bulanan,
]);
```

2. **Frontend:**
   - **Hapus** `resources/js/pages/ustadz/mutabaahs/create.tsx`.
   - **Buat `resources/js/components/forms/MutabaahForm.tsx`** — isi = form dari `create.tsx` (santri_id hidden, tanggal, jenis, surah, ayat_mulai, ayat_selesai, halaman, nilai, status, catatan):
```tsx
import { Form } from '@inertiajs/react';
import MutabaahController from '@/actions/App/Http/Controllers/Ustadz/MutabaahController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
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

type Props = {
    santri: { id: number; nama: string; nis?: string | null };
    jenisOptions: Option[];
    statusOptions: Option[];
    onSuccess?: () => void;
};

export default function MutabaahForm({ santri, jenisOptions, statusOptions, onSuccess }: Props) {
    return (
        <Form {...MutabaahController.store.form()} className="space-y-4" onSuccess={onSuccess}>
            {({ errors }) => (
                <>
                    <input type="hidden" name="santri_id" value={santri.id} />

                    <div className="grid gap-2">
                        <Label>Tanggal</Label>
                        <Input name="tanggal" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
                        <InputError message={errors.tanggal} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Jenis</Label>
                        <Select name="jenis" defaultValue="setoran">
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {jenisOptions.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.jenis} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Surah</Label>
                        <Input name="surah" placeholder="Al-Baqarah" required />
                        <InputError message={errors.surah} />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="grid gap-2">
                            <Label>Ayat Mulai</Label>
                            <Input name="ayat_mulai" type="number" min={1} required />
                            <InputError message={errors.ayat_mulai} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Ayat Selesai</Label>
                            <Input name="ayat_selesai" type="number" min={1} required />
                            <InputError message={errors.ayat_selesai} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Halaman</Label>
                            <Input name="halaman" type="number" min={1} required />
                            <InputError message={errors.halaman} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Nilai (opsional)</Label>
                        <Input name="nilai" type="number" min={0} max={100} />
                        <InputError message={errors.nilai} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Status</Label>
                        <Select name="status" defaultValue="lulus">
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {statusOptions.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.status} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Catatan (opsional)</Label>
                        <Input name="catatan" />
                        <InputError message={errors.catatan} />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="submit">Simpan Mutabaah</Button>
                    </div>
                </>
            )}
        </Form>
    );
}
```

   - **Ubah `resources/js/pages/ustadz/halaqahs/santris.tsx`**:
     - Hapus import `create` dari `@/routes/ustadz/mutabaahs` dan `Link` untuk tombol create.
     - Tambah state `catatSantri: SantriRow | null` dan `showRekap: boolean`.
     - Ganti tombol/`Link` create per baris menjadi:
```tsx
<Button size="sm" onClick={() => setCatatSantri(santri)}>Catat Mutabaah</Button>
```
     - Tambah Dialog harian di bawah list:
```tsx
<Dialog open={catatSantri !== null} onOpenChange={(open) => !open && setCatatSantri(null)}>
    <DialogContent key={catatSantri?.id}>
        <DialogHeader>
            <DialogTitle>Catat Mutabaah</DialogTitle>
            <DialogDescription>
                {catatSantri ? `${catatSantri.nama}${catatSantri.nis ? ` (${catatSantri.nis})` : ''}` : ''}
            </DialogDescription>
        </DialogHeader>
        {catatSantri && (
            <MutabaahForm
                santri={catatSantri}
                jenisOptions={jenisOptions}
                statusOptions={statusOptions}
                onSuccess={() => setCatatSantri(null)}
            />
        )}
    </DialogContent>
</Dialog>
```
     - Props page tambah type: `jenisOptions`, `statusOptions`, `settings`, `bulan`, `tahun`, `bulanan` (dipakai penuh di Task 8; deklarasikan sekarang agar tsc bersih).

3. **Update `tests/Feature/Ustadz/MutabaahStoreTest.php`** — hapus semua referensi route `ustadz.mutabaahs.create`. Ganti test yang mengecek create page jadi mengecek halaman santri halaqah:
```php
test('halaqah santri page exposes mutabaah modal data', function () {
    $ustadz = makeActingUstadz($this);
    $halaqah = Halaqah::factory()->create(['ustadz_id' => $ustadz->id]);
    $santri = Santri::factory()->create();
    $halaqah->santris()->attach($santri->id);

    $this->get(route('ustadz.halaqahs.santris.show', $halaqah))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('ustadz/halaqahs/santris')
            ->has('jenisOptions')
            ->has('statusOptions')
            ->has('settings')
            ->has('bulanan', 1));
});
```

4. Jalankan: `php artisan test --filter="MutabaahStoreTest"` + `npm run types:check` + `npm run build`. Wayfinder regenerate otomatis saat `vite build` (route `create` hilang dari `resources/js/routes`).
5. Commit: `feat: move daily mutabaah input into halaqah santri modal`

---

## Task 7 — Ustadz Targets Modal

**Goal:** `ustadz/targets/index.tsx` create+edit jadi Dialog.

1. **Buat `resources/js/components/forms/TargetForm.tsx`** — pola sama dengan form lain. Props: `nilaiAwal?` (id, santri_id, periode, target, status), `santris: {id; nama}[]`, `statuses: Option[]` (cek props halaman targets: `statuses` sudah ada). Field: santri_id (Select), periode (Input text, contoh "2026-2027"), target (Input number), status (Select). Pakai `TargetHafalanController.store.form()` / `update.form({ targetHafalan: id })`.

2. **Ubah `resources/js/pages/ustadz/targets/index.tsx`**:
   - Hapus blok form inline create `{showForm && ...}` dan form edit inline per-target (jika ada).
   - Tambah tombol "Tambah Target" → Dialog create (`TargetForm` tanpa nilaiAwal).
   - Setiap target: tombol "Edit" → Dialog edit (`TargetForm` dengan `nilaiAwal` dari row target). Pertahankan tombol hapus (form delete inline) yang sudah ada.
   - Karena setiap santri punya baris target sendiri, state `editing: { target: TargetRow; santriId: number } | null` bila target bukan nested di santri — sesuaikan dengan struktur page saat ini.

3. Verifikasi: `npm run types:check` + `npm run build` + smoke manual.
4. Commit: `feat: convert target hafalan forms to modals`

---

## Task 8 — Ustadz Mutabaah Bulanan Batch (Backend + Frontend)

**Goal:** Batch upsert bulanan per halaqah via modal di halaman santri; prefill sudah dikirim dari `HalaqahController@santris` (Task 6).

1. **`app/Http/Requests/Ustadz/StoreMutabaahBulananRequest.php`**:
```php
<?php

namespace App\Http\Requests\Ustadz;

use Illuminate\Foundation\Http\FormRequest;

class StoreMutabaahBulananRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->ustadz !== null;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'records' => ['required', 'array', 'min:1'],
            'records.*.santri_id' => ['required', 'exists:santris,id'],
            'records.*.halaman_kumulatif' => ['required', 'integer', 'min:0'],
            'records.*.juz_dihafal' => ['nullable', 'string', 'max:100'],
            'records.*.tasmi_pekan_1' => ['nullable', 'integer', 'between:10,100'],
            'records.*.tasmi_pekan_2' => ['nullable', 'integer', 'between:10,100'],
            'records.*.tasmi_pekan_3' => ['nullable', 'integer', 'between:10,100'],
            'records.*.tasmi_pekan_4' => ['nullable', 'integer', 'between:10,100'],
            'records.*.tasmi_pekan_5' => ['nullable', 'integer', 'between:10,100'],
            'records.*.ujian_soal_1' => ['nullable', 'integer', 'between:10,100'],
            'records.*.ujian_soal_2' => ['nullable', 'integer', 'between:10,100'],
            'records.*.ujian_soal_3' => ['nullable', 'integer', 'between:10,100'],
            'records.*.ujian_soal_4' => ['nullable', 'integer', 'between:10,100'],
            'records.*.ujian_soal_5' => ['nullable', 'integer', 'between:10,100'],
        ];
    }
}
```

2. **`app/Http/Controllers/Ustadz/MutabaahBulananController.php`**:
```php
<?php

namespace App\Http\Controllers\Ustadz;

use App\Actions\MutabaahBulanan\MutabaahBulananCalculator;
use App\Http\Controllers\Controller;
use App\Http\Requests\Ustadz\StoreMutabaahBulananRequest;
use App\Models\MutabaahBulanan;
use App\Models\MutabaahSetting;
use App\Models\Santri;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MutabaahBulananController extends Controller
{
    public function update(StoreMutabaahBulananRequest $request, int $bulan): RedirectResponse
    {
        abort_unless($bulan >= 1 && $bulan <= 12, 422, __('Bulan tidak valid.'));

        $ustadz = $request->user()->ustadz;
        $settings = MutabaahSetting::setting();
        $tahun = $settings->tahun_aktif;
        $calculator = app(MutabaahBulananCalculator::class);

        $ownedSantriIds = $ustadz->halaqahs()
            ->with('santris:id')
            ->get()
            ->flatMap->santris
            ->pluck('id')
            ->unique()
            ->all();

        $records = $request->validated('records');

        DB::transaction(function () use ($records, $ownedSantriIds, $calculator, $tahun, $bulan): void {
            foreach ($records as $record) {
                abort_unless(
                    in_array($record['santri_id'], $ownedSantriIds, true),
                    403,
                    __('This santri is not in any of your halaqah.'),
                );

                $santri = Santri::query()->findOrFail($record['santri_id']);
                $halamanAwalBulan = $calculator->halamanAwalBulan($santri, $bulan, $tahun);

                if ($halamanAwalBulan !== null && $record['halaman_kumulatif'] < $halamanAwalBulan) {
                    abort(422, __('Halaman kumulatif tidak boleh kurang dari halaman awal bulan.'));
                }

                MutabaahBulanan::updateOrCreate(
                    ['santri_id' => $record['santri_id'], 'tahun' => $tahun, 'bulan' => $bulan],
                    [
                        'halaman_awal_bulan' => $halamanAwalBulan,
                        'halaman_kumulatif' => $record['halaman_kumulatif'],
                        'juz_dihafal' => $record['juz_dihafal'] ?? null,
                        'tasmi_pekan_1' => $record['tasmi_pekan_1'] ?? null,
                        'tasmi_pekan_2' => $record['tasmi_pekan_2'] ?? null,
                        'tasmi_pekan_3' => $record['tasmi_pekan_3'] ?? null,
                        'tasmi_pekan_4' => $record['tasmi_pekan_4'] ?? null,
                        'tasmi_pekan_5' => $record['tasmi_pekan_5'] ?? null,
                        'ujian_soal_1' => $record['ujian_soal_1'] ?? null,
                        'ujian_soal_2' => $record['ujian_soal_2'] ?? null,
                        'ujian_soal_3' => $record['ujian_soal_3'] ?? null,
                        'ujian_soal_4' => $record['ujian_soal_4'] ?? null,
                        'ujian_soal_5' => $record['ujian_soal_5'] ?? null,
                    ],
                );
            }
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Mutabaah bulanan berhasil disimpan.')]);

        return back();
    }
}
```

3. **`routes/ustadz.php`** — tambah:
```php
use App\Http\Controllers\Ustadz\MutabaahBulananController;
// ...
Route::post('mutabaah-bulanan/{bulan}', [MutabaahBulananController::class, 'update'])
    ->whereNumber('bulan')
    ->name('mutabaah-bulanan.update');
```

4. **`resources/js/lib/mutabaah-bulanan.ts`** — helper preview klien (mirror kalkulator):
```ts
export type MutabaahSettings = {
    konversi_juz_halaman: number;
    ambang_hadiah_juz: number;
    tahun_aktif: number;
};

export function tambahHalaman(halamanKumulatif: number | null, halamanAwalBulan: number | null): number {
    if (halamanKumulatif === null) {
        return 0;
    }
    return halamanKumulatif - (halamanAwalBulan ?? 0);
}

export function tambahJuz(halamanKumulatif: number | null, halamanAwalBulan: number | null, konversiJuz: number): number {
    return Math.round((tambahHalaman(halamanKumulatif, halamanAwalBulan) / konversiJuz) * 100) / 100;
}

export function totalJuz(halamanKumulatif: number | null, konversiJuz: number): number | null {
    if (halamanKumulatif === null) {
        return null;
    }
    return Math.round((halamanKumulatif / konversiJuz) * 100) / 100;
}

export function keterangan(halamanKumulatif: number | null, halamanAwalBulan: number | null, settings: MutabaahSettings): string {
    if (halamanKumulatif === null) {
        return 'Belum Diisi';
    }
    const juz = tambahJuz(halamanKumulatif, halamanAwalBulan, settings.konversi_juz_halaman);
    if (juz >= settings.ambang_hadiah_juz) {
        return 'Berprestasi (Hadiah)';
    }
    if (juz < 0.25) {
        return 'Di Bawah Target';
    }
    return 'Sesuai Target';
}
```

5. **Frontend `resources/js/pages/ustadz/halaqahs/santris.tsx`** — tambah "Rekap Bulanan":
   - Header card tambah tombol:
```tsx
<Button variant="outline" onClick={() => setShowRekap(true)}>Rekap Bulanan</Button>
```
   - State `rekapBulan: number` diinisialisasi dari prop `bulan`.
   - Dialog batch (lebar: `DialogContent className="max-w-5xl"`):
     - `Form {...MutabaahBulananController.update.form({ bulan: rekapBulan })}`
     - Select bulan (1..12, label Januari..Desember) → `setRekapBulan(n)` — value submit via route param, bukan form field; gunakan tombol submit yang memicu request ke `{bulan: rekapBulan}`.
     - Tabel batch dari `bulanan` (SEMUA santri halaqah, bukan `santris` paginated). Per baris (state `rows` diinit dari `bulanan`):
       - nama (readonly)
       - `records[${i}][halaman_kumulatif]` — Input number; defaultValue `existing?.halaman_kumulatif ?? prefill_kumulatif ?? ''`; min `halaman_awal_bulan ?? 0`
       - `records[${i}][juz_dihafal]` — Input text
       - `records[${i}][tasmi_pekan_1..5]` — 5 Input number (10..100)
       - `records[${i}][ujian_soal_1..5]` — 5 Input number (10..100)
       - Preview turunan live: `tambahHalaman`, `tambahJuz`, `keterangan` dari `@/lib/mutabaah-bulanan` pakai `settings`.
     - Input controlled oleh state `rows` (untuk preview hidup) — `value={row.halaman_kumulatif ?? ''}` + `onChange`.
     - Submit → toast sukses → `onSuccess={() => setShowRekap(false)}` → controller `back()` → halaman reload dgn props segar.

6. **`tests/Feature/Ustadz/MutabaahBulananTest.php`** (baru):
```php
<?php

use App\Enums\UserRole;
use App\Models\Halaqah;
use App\Models\Mutabaah;
use App\Models\MutabaahBulanan;
use App\Models\Santri;
use App\Models\User;
use App\Models\Ustadz;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(RefreshDatabase::class, TestCase::class);

function actingUstadz(TestCase $test): Ustadz
{
    $user = User::factory()->create(['role' => UserRole::Ustadz]);
    $ustadz = Ustadz::factory()->create(['user_id' => $user->id]);
    $test->actingAs($user);

    return $ustadz;
}

test('ustadz can batch upsert mutabaah bulanan for halaqah santri', function () {
    $ustadz = actingUstadz($this);
    $halaqah = Halaqah::factory()->create(['ustadz_id' => $ustadz->id]);
    $santri = Santri::factory()->create();
    $halaqah->santris()->attach($santri->id);

    $this->post(route('ustadz.mutabaah-bulanan.update', 1), [
        'records' => [[
            'santri_id' => $santri->id,
            'halaman_kumulatif' => 25,
            'tasmi_pekan_1' => 80,
            'ujian_soal_1' => 90,
        ]],
    ])->assertRedirect();

    $this->assertDatabaseHas('mutabaah_bulanans', [
        'santri_id' => $santri->id,
        'tahun' => 2026,
        'bulan' => 1,
        'halaman_kumulatif' => 25,
    ]);

    // upsert: post lagi dengan nilai baru
    $this->post(route('ustadz.mutabaah-bulanan.update', 1), [
        'records' => [[
            'santri_id' => $santri->id,
            'halaman_kumulatif' => 30,
        ]],
    ])->assertRedirect();

    $this->assertDatabaseCount('mutabaah_bulanans', 1);
    $this->assertDatabaseHas('mutabaah_bulanans', ['santri_id' => $santri->id, 'halaman_kumulatif' => 30]);
});

test('ustadz cannot submit a santri outside their halaqah', function () {
    $ustadz = actingUstadz($this);
    $halaqah = Halaqah::factory()->create(['ustadz_id' => $ustadz->id]);
    $member = Santri::factory()->create();
    $halaqah->santris()->attach($member->id);
    $stranger = Santri::factory()->create();

    $this->post(route('ustadz.mutabaah-bulanan.update', 1), [
        'records' => [
            ['santri_id' => $member->id, 'halaman_kumulatif' => 10],
            ['santri_id' => $stranger->id, 'halaman_kumulatif' => 20],
        ],
    ])->assertForbidden();
});

test('bulan must be between 1 and 12', function () {
    actingUstadz($this);
    $this->post(route('ustadz.mutabaah-bulanan.update', 13), [
        'records' => [['santri_id' => 1, 'halaman_kumulatif' => 10]],
    ])->assertStatus(422);
});

test('halaman kumulatif cannot be below halaman awal bulan', function () {
    $ustadz = actingUstadz($this);
    $halaqah = Halaqah::factory()->create(['ustadz_id' => $ustadz->id]);
    $santri = Santri::factory()->create(['halaman_awal' => 10]);
    $halaqah->santris()->attach($santri->id);

    $this->post(route('ustadz.mutabaah-bulanan.update', 1), [
        'records' => [['santri_id' => $santri->id, 'halaman_kumulatif' => 9]],
    ])->assertStatus(422);
});

test('halaqah santri page exposes prefill for given month', function () {
    $ustadz = actingUstadz($this);
    $halaqah = Halaqah::factory()->create(['ustadz_id' => $ustadz->id]);
    $santri = Santri::factory()->create(['halaman_awal' => 5]);
    $halaqah->santris()->attach($santri->id);

    Mutabaah::factory()->create([
        'santri_id' => $santri->id,
        'tanggal' => '2026-01-03',
        'halaman' => 7,
    ]);

    $this->get(route('ustadz.halaqahs.santris.show', ['halaqah' => $halaqah, 'bulan' => 1]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('ustadz/halaqahs/santris')
            ->where('bulan', 1)
            ->has('bulanan.0', fn ($row) => $row
                ->where('santri_id', $santri->id)
                ->where('halaman_awal_bulan', 5)
                ->where('prefill_kumulatif', 12)));
});
```

7. Jalankan: `php artisan test --filter="MutabaahBulananTest"` + `npm run types:check` + `npm run build` (wayfinder regenerate route baru).
8. Commit: `feat: add monthly mutabaah batch input for ustadz`

---

## Task 9 — Admin Dashboard + Settings (Backend + Frontend)

**Goal:** Halaman dashboard mutaba'ah bulanan admin + halaman settings.

1. **`app/Http/Controllers/Admin/MutabaahBulananDashboardController.php`**:
```php
<?php

namespace App\Http\Controllers\Admin;

use App\Actions\MutabaahBulanan\MutabaahBulananCalculator;
use App\Enums\MutabaahKategori;
use App\Enums\SantriJenis;
use App\Http\Controllers\Controller;
use App\Models\Halaqah;
use App\Models\MutabaahBulanan;
use App\Models\MutabaahSetting;
use App\Models\Santri;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MutabaahBulananDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $settings = MutabaahSetting::setting();
        $tahun = $settings->tahun_aktif;
        $bulan = $request->integer('bulan', now()->month);
        $bulan = max(1, min(12, $bulan));

        $calculator = app(MutabaahBulananCalculator::class);

        $bulanans = MutabaahBulanan::query()
            ->with(['santri.halaqahs.ustadz'])
            ->where('tahun', $tahun)
            ->where('bulan', $bulan)
            ->get();

        $halaqahs = Halaqah::query()->withCount('santris')->orderBy('nama')->get();

        $rows = $halaqahs->map(function (Halaqah $halaqah) use ($calculator, $tahun, $bulan, $bulanans) {
            $santriIds = $halaqah->santris()->pluck('santris.id');

            $owned = $bulanans->filter(fn (MutabaahBulanan $mb) => $santriIds->contains($mb->santri_id));

            $berprestasi = $owned->filter(
                fn (MutabaahBulanan $mb) => $calculator->keterangan($mb, $settings->konversi_juz_halaman, $settings->ambang_hadiah_juz) === 'Berprestasi (Hadiah)',
            )->count();

            return [
                'jenis' => $this->jenisLabel($halaqah->santris()->first()?->jenis),
                'kelompok' => $halaqah->nama,
                'muhafidz' => $halaqah->ustadz?->nama,
                'jumlah_santri' => $halaqah->santris_count,
                'terisi' => $owned->count(),
                'rata_halaman_kumulatif' => $this->avg($owned->pluck('halaman_kumulatif')),
                'rata_tambah_juz' => $this->avg(
                    $owned->map(fn (MutabaahBulanan $mb) => $calculator->tambahJuz($mb, $settings->konversi_juz_halaman)),
                ),
                'rata_tasmi' => $this->avg($owned->map(fn (MutabaahBulanan $mb) => $calculator->rataTasmi($mb))),
                'rata_ujian' => $this->avg($owned->map(fn (MutabaahBulanan $mb) => $calculator->rataUjian($mb))),
                'berprestasi' => $berprestasi,
            ];
        });

        // distribusi kategori x jenis
        $distribusi = collect(MutabaahKategori::cases())->map(function (MutabaahKategori $kategori) use ($bulanans, $settings, $calculator, $tahun, $bulan) {
            $countIkhwan = 0;
            $countAkhwat = 0;

            foreach ($bulanans as $mb) {
                if ($calculator->kategori($mb, $settings->konversi_juz_halaman) !== $kategori) {
                    continue;
                }

                if ($mb->santri?->jenis === SantriJenis::Ikhwan) {
                    $countIkhwan++;
                } elseif ($mb->santri?->jenis === SantriJenis::Akhwat) {
                    $countAkhwat++;
                }
            }

            return [
                'kategori' => $kategori->label(),
                'ikhwan' => $countIkhwan,
                'akhwat' => $countAkhwat,
                'total' => $countIkhwan + $countAkhwat,
            ];
        });

        return Inertia::render('admin/mutabaah-bulanan', [
            'rows' => $rows,
            'distribusi' => $distribusi,
            'settings' => $settings->only(['konversi_juz_halaman', 'ambang_hadiah_juz', 'tahun_aktif']),
            'bulan' => $bulan,
            'tahun' => $tahun,
        ]);
    }

    /**
     * @param iterable<int, int|float|null> $values
     */
    private function avg(iterable $values): ?float
    {
        $filtered = array_values(array_filter(
            iterator_to_array($values),
            fn ($value) => $value !== null,
        ));

        if ($filtered === []) {
            return null;
        }

        return round(array_sum($filtered) / count($filtered), 2);
    }

    private function jenisLabel(?SantriJenis $jenis): string
    {
        return $jenis?->label() ?? '-';
    }
}
```
> Catatan: `$halaqah->santris()->first()?->jenis` — pakai eager load `santris.jenis`? Sederhanakan: `$santriIds` & jenis diambil dari relasi; untuk performa kecil cukup `withCount` + `santris` eager. Sesuaikan implementasi saat coding agar tidak N+1 parah (data dashboard kecil, tolerable).

2. **`app/Http/Controllers/Admin/MutabaahSettingController.php`** — pola `edit` + `update`:
```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\MutabaahSetting\UpdateMutabaahSettingRequest;
use App\Models\MutabaahSetting;
use Inertia\Inertia;
use Inertia\Response;

class MutabaahSettingController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('admin/mutabaah-settings', [
            'settings' => MutabaahSetting::setting(),
        ]);
    }

    public function update(UpdateMutabaahSettingRequest $request): RedirectResponse
    {
        MutabaahSetting::setting()->update($request->validated());

        return back();
    }
}
```

3. **`app/Http/Requests/Admin/MutabaahSetting/UpdateMutabaahSettingRequest.php`**:
```php
<?php

namespace App\Http\Requests\Admin\MutabaahSetting;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMutabaahSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === \App\Enums\UserRole::Admin;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'konversi_juz_halaman' => ['required', 'integer', 'min:1'],
            'ambang_hadiah_juz' => ['required', 'numeric', 'min:0'],
            'tahun_aktif' => ['required', 'integer', 'min:2000', 'max:2100'],
        ];
    }
}
```

4. **`routes/admin.php`** — tambah:
```php
use App\Http\Controllers\Admin\MutabaahBulananDashboardController;
use App\Http\Controllers\Admin\MutabaahSettingController;
// ...
Route::get('mutabaah-bulanan', [MutabaahBulananDashboardController::class, 'index'])->name('mutabaah-bulanan.index');
Route::get('mutabaah-settings', [MutabaahSettingController::class, 'edit'])->name('mutabaah-settings.edit');
Route::put('mutabaah-settings', [MutabaahSettingController::class, 'update'])->name('mutabaah-settings.update');
```

5. **Frontend `resources/js/pages/admin/mutabaah-bulanan/index.tsx`**:
   - Props: `rows`, `distribusi`, `settings`, `bulan`, `tahun`.
   - Header `Heading` + kontrol: Select bulan (1..12) + Select tahun (opsional; cukup pakai `tahun_aktif` untuk sekarang) → `router.get(MutabaahBulananDashboardController.index().url(), { bulan }, { preserveState: true })`.
   - Tabel "Ringkasan per Kelompok": jenis, kelompok, muhafidz, jumlah_santri, terisi, rata halaman kumulatif, rata tambah juz, rata tasmi', rata ujian, berprestasi.
   - Tabel "Distribusi Kategori": baris = kategori (22), kolom = ikhwan, akhwat, total.
   - Pakai `PageContainer`, `Card`, `Table` existing (cek gaya halaman admin lain).

6. **Frontend `resources/js/pages/admin/mutabaah-settings.tsx`**:
   - Props: `settings`.
   - `Form {...MutabaahSettingController.update.form()}` dengan field konversi_juz_halaman (Input number), ambang_hadiah_juz (Input number step 0.1), tahun_aktif (Input number). Pakai pattern `InputError` + `Button` submit.

7. **`resources/js/components/app-sidebar.tsx`** — tambah nav admin (pakai pattern existing):
```tsx
{
    title: 'Mutabaah Bulanan',
    url: MutabaahBulananDashboardController.index().url(),
    icon: CalendarCheck,
},
{
    title: 'Pengaturan Mutabaah',
    url: MutabaahSettingController.edit().url(),
    icon: Settings,
},
```
(import `MutabaahBulananDashboardController`, `MutabaahSettingController` dari `@/routes/...` atau `@/actions/...` — ikuti pattern Sidebar saat ini; icon `CalendarCheck`/`Settings` dari lucide-react.)

8. **Tests baru:**
   - `tests/Feature/Admin/MutabaahBulananDashboardTest.php`:
```php
test('admin can view mutabaah bulanan dashboard', function () {
    $user = User::factory()->create(['role' => UserRole::Admin]);
    $this->actingAs($user);

    $halaqah = Halaqah::factory()->create();
    $santri = Santri::factory()->create(['jenis' => SantriJenis::Ikhwan]);
    $halaqah->santris()->attach($santri->id);
    MutabaahBulanan::factory()->create([
        'santri_id' => $santri->id,
        'tahun' => 2026,
        'bulan' => 1,
        'halaman_kumulatif' => 40,
    ]);

    $this->get(route('admin.mutabaah-bulanan.index', ['bulan' => 1]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/mutabaah-bulanan')
            ->where('bulan', 1)
            ->has('rows', 1)
            ->has('distribusi', 22));
});
```
   - `tests/Feature/Admin/MutabaahSettingTest.php`:
```php
test('admin can update mutabaah settings', function () {
    $user = User::factory()->create(['role' => UserRole::Admin]);
    $this->actingAs($user);

    $this->put(route('admin.mutabaah-settings.update'), [
        'konversi_juz_halaman' => 25,
        'ambang_hadiah_juz' => 2.0,
        'tahun_aktif' => 2027,
    ])->assertRedirect();

    $this->assertDatabaseHas('mutabaah_settings', [
        'konversi_juz_halaman' => 25,
        'ambang_hadiah_juz' => 2.0,
        'tahun_aktif' => 2027,
    ]);
});

test('non admin cannot update mutabaah settings', function () {
    $user = User::factory()->create(['role' => UserRole::Ustadz]);
    $this->actingAs($user);

    $this->put(route('admin.mutabaah-settings.update'), [
        'konversi_juz_halaman' => 25,
    ])->assertForbidden();
});
```

9. Jalankan: `php artisan test --filter="MutabaahBulananDashboardTest|MutabaahSettingTest"` + `npm run types:check` + `npm run build`.
10. Commit: `feat: add admin mutabaah bulanan dashboard and settings`

---

## Task 10 — Final Verification

1. **Wayfinder regenerate:** `npm run build` (sudah otomatis regenerate `resources/js/routes` + `resources/js/actions`). Verifikasi file `resources/js/routes/ustadz/mutabaahs/index.ts` tidak lagi mengekspor `create`.
2. `npm run types:check` → bersih.
3. `vendor/bin/pint --dirty --format agent` → bersih (karena banyak file PHP diubah).
4. `php artisan test --compact` → semua hijau.
5. Smoke test manual: login ustadz → halaman halaqah → santri → Catat Mutabaah (modal) → Rekap Bulanan (modal batch) → submit; login admin → 5 halaman modal create/edit → dashboard mutabaah bulanan → settings.
6. Commit terakhir bila ada penyesuaian kecil dari smoke test.

---

## Catatan Risiko / Asumsi

- `UserController.update` / `TargetHafalanController.update` existing sudah benar (dipakai targets) — pola modal edit mengikuti itu.
- Validasi `abort(422)` di dalam `DB::transaction` membatalkan seluruh batch (semua-atau-tidak).
- `prefill_kumulatif` = `halaman_awal_bulan` + Σ `halaman` setoran harian bulan tersebut; hanya tampil jika ada setoran.
- Tahun diambil dari `MutabaahSetting::setting()->tahun_aktif` di semua titik (santris props, batch upsert, dashboard).
- Data dashboard & modal batch kecil skalanya → query N+1 ringan tolerable; tidak perlu optimasi berlebihan.




