# Import Data Massal dari Excel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan halaman admin "Import Excel" yang mengimpor data master (santri, ustadz, halaqah, `halaman_awal`) dari sheet `Data Kelompok` file `Mutabaah_Hafalan_Santri.xlsx`.

**Architecture:** Tiga service murni/terisolasi di `app/Services/ExcelImport`: `ExcelReader` (parse xlsx via PhpSpreadsheet), `ImportPlanner` (cocokkan data existing + hitung tindakan create/update/placeholder/error), `ImportExecutor` (tulis dalam satu transaksi). Controller admin tipis menghubungkan upload → pratinjau → eksekusi, dengan halaman Inertia/React satu komponen.

**Tech Stack:** Laravel 13, PHP 8.5, PhpSpreadsheet (baru, disetujui), Inertia v3 + React + TypeScript, shadcn/ui, Pest 5.

## Global Constraints

- Dependency baru yang diizinkan: `phpoffice/phpspreadsheet` saja (disetujui pengguna). Jangan tambah yang lain.
- Rute admin harus di dalam grup `routes/admin.php` dengan middleware `['auth', 'verified', 'role:admin']`.
- **Never mass-assign `role` via user input** (rules projects): role hanya ditetapkan eksplisit (`UserRole::Ustadz` / `UserRole::Santri`) di kode.
- Pembuatan `User` + profile (Ustadz/Santri) harus dibungkus `DB::transaction` (rules projects admin).
- Konvensi verifikasi: TDD (tulis test gagal dulu), `php artisan test --compact`, `npx tsc --noEmit`, `vendor/bin/pint --dirty --format agent`, regenerate Wayfinder setelah route berubah (`php artisan wayfinder:generate`).
- NIS: `SIM-{tahun_aktif}-{0001}` (tahun dari `MutabaahSetting::setting()->tahun_aktif`), unik, urut setelah nilai terbesar yang sudah ada.
- Email: `Str::slug(nama).'@simahal.test'`, lowercase, unik dengan suffix `-2`, `-3` bila bentrok (dalam-file maupun dengan user existing).
- Password default semua akun impor: string literal `password` (konvensi seeder).
- Halaqah: nama `Kelompok {n} {Jenis}` (mis. `Kelompok 1 Ikhwan`), `status` = `HalaqahStatus::Aktif`, `jadwal` = null.
- `halaqah_members`: `joined_at` = now, `status` = `HalaqahMemberStatus::Aktif`.
- Kop/UI: Bahasa Indonesia, `PageContainer`, `Heading`, shadcn/ui, `page.layout = { breadcrumbs }`, aksen emerald.

---

### Task 1: PhpSpreadsheet + `ExcelReader` + DTO Parsing

**Files:**
- Create: `app/Services/ExcelImport/ParsedGroup.php`
- Create: `app/Services/ExcelImport/ParsedSantri.php`
- Create: `app/Services/ExcelImport/ParsedWorkbook.php`
- Create: `app/Services/ExcelImport/ExcelReader.php`
- Create: `tests/Support/ExcelFixtures.php`
- Test: `tests/Unit/ExcelImport/ExcelReaderTest.php`

**Interfaces:**
- Produces (dipakai Task 2): `ExcelReader::readDataKelompok(string $path): ParsedWorkbook`; `ExcelReader::normalizeName(string $name): string` (public); `ParsedSantri{nama, normalizedNama, jenis, kelompok, halamanAwal, isReal}`; `ParsedGroup{jenis, kelompok, muhafidz, isRealMuhafidz}`; `ParsedWorkbook{groups: ParsedGroup[], santris: ParsedSantri[]}`.
- Produces (dipakai Task 3 & 4): `Tests\Support\ExcelFixtures::dataKelompokXlsx(array $rows): string` — membuat file .xlsx temporer, format sama dengan sheet Data Kelompok (header baris 3, data baris 4+).

- [ ] **Step 1: Install PhpSpreadsheet**

```bash
composer require phpoffice/phpspreadsheet
```

- [ ] **Step 2: Write fixture helper (failing test belum bisa, tulis helper dulu)**

Create `tests/Support/ExcelFixtures.php`:

```php
<?php

namespace Tests\Support;

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

final class ExcelFixtures
{
    /**
     * @param  list<array{jenis: string, kelompok: string, muhafidz: string, nama: string, halamanAwal: int}>  $rows
     */
    public static function dataKelompokXlsx(array $rows): string
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Data Kelompok');
        $sheet->setCellValue('A3', 'No');
        $sheet->setCellValue('B3', 'Jenis');
        $sheet->setCellValue('C3', 'Kelompok');
        $sheet->setCellValue('D3', 'Muhafidz/Muhafidzah');
        $sheet->setCellValue('E3', 'Nama Santri');
        $sheet->setCellValue('F3', 'Halaman Awal');

        foreach ($rows as $i => $row) {
            $no = $i + 4;
            $sheet->setCellValue("A{$no}", $i + 1);
            $sheet->setCellValue("B{$no}", $row['jenis']);
            $sheet->setCellValue("C{$no}", $row['kelompok']);
            $sheet->setCellValue("D{$no}", $row['muhafidz']);
            $sheet->setCellValue("E{$no}", $row['nama']);
            $sheet->setCellValue("F{$no}", $row['halamanAwal']);
        }

        $dir = sys_get_temp_dir().'/simahal-excel-fixtures';
        if (! is_dir($dir)) {
            mkdir($dir, 0777, true);
        }
        $path = $dir.'/'.uniqid('fixture-', true).'.xlsx';
        (new Xlsx($spreadsheet))->save($path);

        return $path;
    }
}
```

- [ ] **Step 3: Write the failing test**

Create `tests/Unit/ExcelImport/ExcelReaderTest.php`:

```php
<?php

use App\Services\ExcelImport\ExcelReader;
use Tests\Support\ExcelFixtures;

test('reader mem-parsing sheet data kelompok', function () {
    $path = ExcelFixtures::dataKelompokXlsx([
        ['jenis' => 'Ikhwan', 'kelompok' => 'Kelompok 1', 'muhafidz' => 'Hammam', 'nama' => 'Yahya', 'halamanAwal' => 0],
        ['jenis' => 'Ikhwan', 'kelompok' => 'Kelompok 1', 'muhafidz' => 'Hammam', 'nama' => 'Zuhdan Sahl Hunaif', 'halamanAwal' => 3],
        ['jenis' => 'Ikhwan', 'kelompok' => 'Kelompok 2', 'muhafidz' => 'Rizkiansya Alfin', 'nama' => 'Hudzaifah', 'halamanAwal' => 0],
        ['jenis' => 'Ikhwan', 'kelompok' => 'Kelompok 5', 'muhafidz' => 'Muhafidz Ikhwan 5', 'nama' => 'Nama 2', 'halamanAwal' => 0],
    ]);

    $wb = app(ExcelReader::class)->readDataKelompok($path);

    expect($wb->santris)->toHaveCount(4);
    expect($wb->santris[1]->nama)->toBe('Zuhdan Sahl Hunaif');
    expect($wb->santris[1]->halamanAwal)->toBe(3);
    expect($wb->santris[0]->isReal)->toBeTrue();
    expect($wb->santris[3]->isReal)->toBeFalse();
    expect($wb->santris[3]->normalizedNama)->toBe('nama 2');

    $grup = collect($wb->groups)->first(fn ($g) => $g->kelompok === 'Kelompok 2');
    expect($grup->isRealMuhafidz)->toBeTrue();
    $grupPlaceholder = collect($wb->groups)->first(fn ($g) => $g->kelompok === 'Kelompok 5');
    expect($grupPlaceholder->isRealMuhafidz)->toBeFalse();
});

test('reader menormalisasi nama dengan unicode tak terlihat dan kutip', function () {
    $path = ExcelFixtures::dataKelompokXlsx([
        ['jenis' => 'Ikhwan', 'kelompok' => 'Kelompok 1', 'muhafidz' => 'Hammam', 'nama' => "\u{2060}Putra Rizky Pratomo", 'halamanAwal' => 0],
        ['jenis' => 'Ikhwan', 'kelompok' => 'Kelompok 1', 'muhafidz' => 'Hammam', 'nama' => 'Masura Dani Quthni "', 'halamanAwal' => 0],
    ]);

    $wb = app(ExcelReader::class)->readDataKelompok($path);

    expect($wb->santris[0]->normalizedNama)->toBe('putra rizky pratomo');
    expect($wb->santris[1]->normalizedNama)->toBe('masura dani quthni');
    expect($wb->santris[0]->nama)->toBe("\u{2060}Putra Rizky Pratomo");
});

test('reader melempar exception saat sheet data kelompok hilang', function () {
    $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
    $spreadsheet->getActiveSheet()->setTitle('Lain');
    $dir = sys_get_temp_dir().'/simahal-excel-fixtures';
    $path = $dir.'/'.uniqid('bad-', true).'.xlsx';
    (new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet))->save($path);

    app(ExcelReader::class)->readDataKelompok($path);
})->throws(\RuntimeException::class);
```

- [ ] **Step 4: Run the tests to confirm they fail**

Run: `php artisan test --compact tests/Unit/ExcelImport/ExcelReaderTest.php`
Expected: FAIL — kelas `ExcelReader` tidak ditemukan.

- [ ] **Step 5: Implement DTOs**

Create `app/Services/ExcelImport/ParsedGroup.php`:

```php
<?php

namespace App\Services\ExcelImport;

final readonly class ParsedGroup
{
    public function __construct(
        public string $jenis,
        public string $kelompok,
        public string $muhafidz,
        public bool $isRealMuhafidz,
    ) {}
}
```

Create `app/Services/ExcelImport/ParsedSantri.php`:

```php
<?php

namespace App\Services\ExcelImport;

final readonly class ParsedSantri
{
    public function __construct(
        public string $nama,
        public string $normalizedNama,
        public string $jenis,
        public string $kelompok,
        public ?int $halamanAwal,
        public bool $isReal,
    ) {}
}
```

Create `app/Services/ExcelImport/ParsedWorkbook.php`:

```php
<?php

namespace App\Services\ExcelImport;

final readonly class ParsedWorkbook
{
    /** @param  list<ParsedGroup>  $groups */
    /** @param  list<ParsedSantri>  $santris */
    public function __construct(
        public array $groups,
        public array $santris,
    ) {}
}
```

- [ ] **Step 6: Implement `ExcelReader`**

Create `app/Services/ExcelImport/ExcelReader.php`:

```php
<?php

namespace App\Services\ExcelImport;

use PhpOffice\PhpSpreadsheet\Reader\Xlsx;
use RuntimeException;

final class ExcelReader
{
    private const SHEET_NAME = 'Data Kelompok';

    private const INVISIBLE_REGEX = '/[\x{200B}-\x{200F}\x{FEFF}\x{2060}]/u';

    public function readDataKelompok(string $path): ParsedWorkbook
    {
        $sheet = (new Xlsx())->setReadDataOnly(true)->load($path)->getSheetByName(self::SHEET_NAME)
            ?? throw new RuntimeException('Sheet "Data Kelompok" tidak ditemukan.');

        $groups = [];
        $santris = [];

        for ($row = 4; $row <= $sheet->getHighestDataRow(); $row++) {
            $no = trim((string) $sheet->getCell("A{$row}")->getValue());
            $jenis = trim((string) $sheet->getCell("B{$row}")->getValue());
            $kelompok = trim((string) $sheet->getCell("C{$row}")->getValue());
            $muhafidz = trim((string) $sheet->getCell("D{$row}")->getValue());
            $nama = trim((string) $sheet->getCell("E{$row}")->getValue());
            $halamanAwal = $this->toNullableInt($sheet->getCell("F{$row}")->getValue());

            if ($no === '' && $nama === '') {
                break;
            }

            $normalized = $this->normalizeName($nama);
            $key = $jenis.'-'.$kelompok;

            $groups[$key] ??= new ParsedGroup(
                jenis: $jenis,
                kelompok: $kelompok,
                muhafidz: $muhafidz,
                isRealMuhafidz: $muhafidz !== '' && ! $this->isPlaceholderMuhafidz($muhafidz),
            );

            $santris[] = new ParsedSantri(
                nama: $nama,
                normalizedNama: $normalized,
                jenis: $jenis,
                kelompok: $kelompok,
                halamanAwal: $halamanAwal,
                isReal: $nama !== '' && ! $this->isPlaceholderSantri($normalized),
            );
        }

        return new ParsedWorkbook(array_values($groups), $santris);
    }

    public function normalizeName(string $name): string
    {
        $name = trim($name);
        $name = preg_replace(self::INVISIBLE_REGEX, '', $name) ?? $name;
        $name = preg_replace('/^"|"$/u', '', $name) ?? $name;
        $name = preg_replace('/\s+/u', ' ', $name) ?? $name;

        return mb_strtolower($name, 'UTF-8');
    }

    public function isPlaceholderSantri(string $normalizedNama): bool
    {
        return $normalizedNama === '' || (bool) preg_match('/^nama\s*\d*$/', $normalizedNama);
    }

    public function isPlaceholderMuhafidz(string $muhafidz): bool
    {
        return $muhafidz === '' || (bool) preg_match('/^muhafidz(ah)?(\s+(ikhwan|akhwat))?\s+\d+$/i', trim($muhafidz));
    }

    private function toNullableInt(mixed $value): ?int
    {
        if ($value === null || trim((string) $value) === '') {
            return null;
        }

        return (int) $value;
    }
}
```

- [ ] **Step 7: Run the tests to confirm they pass**

Run: `php artisan test --compact tests/Unit/ExcelImport/ExcelReaderTest.php`
Expected: PASS (3 tests).

- [ ] **Step 8: Commit**

```bash
git add composer.json composer.lock app/Services/ExcelImport tests/Support/ExcelFixtures.php tests/Unit/ExcelImport
git commit -m "feat: add ExcelReader for Data Kelompok parsing"
```

---

### Task 2: `ImportPlanner` — perencanaan create/update/skip

**Files:**
- Create: `app/Services/ExcelImport/ImportAction.php`
- Create: `app/Services/ExcelImport/ImportPlanItem.php`
- Create: `app/Services/ExcelImport/ImportPlan.php`
- Create: `app/Services/ExcelImport/ImportPlanner.php`
- Test: `tests/Unit/ExcelImport/ImportPlannerTest.php`

**Interfaces:**
- Consumes: `ParsedWorkbook`, `ParsedGroup`, `ParsedSantri`, `ExcelReader::normalizeName()` dari Task 1.
- Produces (dipakai Task 3 & 4): `ImportPlanner::plan(ParsedWorkbook $wb): ImportPlan`; `ImportPlan{items: ImportPlanItem[], summary(): array, toArray(): array}`; `ImportPlanItem{type, action, groupKey, nama, email?, nis?, jenis?, kelompok?, halamanAwal?, existingId?, reason?, toArray()}`; `ImportAction` enum string-backed (`create|update|placeholder|error`).

- [ ] **Step 1: Write the failing test**

Create `tests/Unit/ExcelImport/ImportPlannerTest.php`:

```php
<?php

use App\Enums\UserRole;
use App\Models\Halaqah;
use App\Models\Santri;
use App\Models\User;
use App\Models\Ustadz;
use App\Services\ExcelImport\ExcelReader;
use App\Services\ExcelImport\ImportPlanner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\ExcelFixtures;
use Tests\TestCase;

uses(RefreshDatabase::class, TestCase::class);

function planDariWorkbook(array $rows): \App\Services\ExcelImport\ImportPlan
{
    $path = ExcelFixtures::dataKelompokXlsx($rows);
    $wb = app(ExcelReader::class)->readDataKelompok($path);

    return app(ImportPlanner::class)->plan($wb);
}

test('planner mengklasifikasikan create, placeholder, dan error', function () {
    $plan = planDariWorkbook([
        ['jenis' => 'Ikhwan', 'kelompok' => 'Kelompok 1', 'muhafidz' => 'Hammam', 'nama' => 'Yahya', 'halamanAwal' => 0],
        ['jenis' => 'Ikhwan', 'kelompok' => 'Kelompok 1', 'muhafidz' => 'Hammam', 'nama' => 'Nama 2', 'halamanAwal' => 0],
        ['jenis' => 'Lainnya', 'kelompok' => 'Kelompok 1', 'muhafidz' => 'Hammam', 'nama' => 'Budi', 'halamanAwal' => 0],
    ]);

    $santri = collect($plan->items)->where('type', 'santri');
    expect($santri->where('action', 'create')->first()->nama)->toBe('Yahya');
    expect($santri->where('action', 'placeholder')->first()->reason)->toBeString();
    expect($santri->where('action', 'error')->first()->reason)->toBeString();
});

test('planner membuat email unik berdasar nama, in-file dan terhadap user existing', function () {
    User::factory()->create(['role' => UserRole::Santri, 'email' => 'yahya@simahal.test']);

    $plan = planDariWorkbook([
        ['jenis' => 'Ikhwan', 'kelompok' => 'Kelompok 1', 'muhafidz' => 'Hammam', 'nama' => 'Yahya', 'halamanAwal' => 0],
        ['jenis' => 'Ikhwan', 'kelompok' => 'Kelompok 2', 'muhafidz' => 'Rizkiansya Alfin', 'nama' => 'Yahya', 'halamanAwal' => 0],
        ['jenis' => 'Akhwat', 'kelompok' => 'Kelompok 1', 'muhafidz' => 'Asma Alhikmah', 'nama' => 'Yahya', 'halamanAwal' => 0],
    ]);

    $emails = collect($plan->items)->where('action', 'create')->where('type', 'santri')->pluck('email')->all();
    expect($emails)->toBe(['yahya-2@simahal.test', 'yahya-3@simahal.test', 'yahya-4@simahal.test']);
});

test('planner memetakan santri existing dengan jenis sama sebagai update', function () {
    $santri = Santri::factory()->create(['nama' => 'Yahya', 'jenis' => 'ikhwan', 'halaman_awal' => 1]);

    $plan = planDariWorkbook([
        ['jenis' => 'Ikhwan', 'kelompok' => 'Kelompok 1', 'muhafidz' => 'Hammam', 'nama' => 'Yahya', 'halamanAwal' => 4],
    ]);

    $item = collect($plan->items)->first(fn ($i) => $i->type === 'santri');
    expect($item->action)->toBe('update');
    expect($item->existingId)->toBe($santri->id);
});

test('planner menghasilkan nis urut dan grup dengan muhafidz placeholder diabaikan', function () {
    Santri::factory()->create(['nis' => 'SIM-2026-0007']);

    $plan = planDariWorkbook([
        ['jenis' => 'Ikhwan', 'kelompok' => 'Kelompok 1', 'muhafidz' => 'Hammam', 'nama' => 'Yahya', 'halamanAwal' => 0],
        ['jenis' => 'Ikhwan', 'kelompok' => 'Kelompok 1', 'muhafidz' => 'Hammam', 'nama' => 'Zuhdan Sahl Hunaif', 'halamanAwal' => 0],
        ['jenis' => 'Ikhwan', 'kelompok' => 'Kelompok 5', 'muhafidz' => 'Muhafidz Ikhwan 5', 'nama' => 'Nama 2', 'halamanAwal' => 0],
    ]);

    $nis = collect($plan->items)->where('type', 'santri')->where('action', 'create')->pluck('nis')->all();
    expect($nis)->toBe(['SIM-2026-0008', 'SIM-2026-0009']);

    expect($plan->items->where('type', 'halaqah')->pluck('nama'))->not->toContain('Kelompok 5 Ikhwan');
});

test('planner mencocokkan ustadz dan halaqah existing', function () {
    $ustadz = Ustadz::create(['user_id' => User::factory()->role(UserRole::Ustadz)->create()->id, 'nama' => 'Hammam']);
    $halaqah = Halaqah::create(['nama' => 'Kelompok 1 Ikhwan', 'ustadz_id' => $ustadz->id, 'status' => 'aktif']);

    $plan = planDariWorkbook([
        ['jenis' => 'Ikhwan', 'kelompok' => 'Kelompok 1', 'muhafidz' => 'Hammam', 'nama' => 'Yahya', 'halamanAwal' => 0],
    ]);

    $ustadzItem = $plan->items->first(fn ($i) => $i->type === 'ustadz');
    $halaqahItem = $plan->items->first(fn ($i) => $i->type === 'halaqah');
    expect($ustadzItem->action)->toBe('update');
    expect($ustadzItem->existingId)->toBe($ustadz->id);
    expect($halaqahItem->action)->toBe('update');
    expect($halaqahItem->existingId)->toBe($halaqah->id);
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `php artisan test --compact tests/Unit/ExcelImport/ImportPlannerTest.php`
Expected: FAIL — kelas `ImportPlanner` / `ImportPlan` tidak ditemukan.

- [ ] **Step 3: Implement support classes**

Create `app/Services/ExcelImport/ImportAction.php`:

```php
<?php

namespace App\Services\ExcelImport;

enum ImportAction: string
{
    case Create = 'create';
    case Update = 'update';
    case Placeholder = 'placeholder';
    case Error = 'error';

    public function label(): string
    {
        return match ($this) {
            self::Create => 'Dibuat',
            self::Update => 'Diperbarui',
            self::Placeholder => 'Dilewati',
            self::Error => 'Gagal',
        };
    }
}
```

Create `app/Services/ExcelImport/ImportPlanItem.php`:

```php
<?php

namespace App\Services\ExcelImport;

final readonly class ImportPlanItem
{
    /**
     * @param  array<string, mixed>  $extra
     */
    public function __construct(
        public string $type, // 'ustadz' | 'halaqah' | 'santri'
        public ImportAction $action,
        public string $groupKey,
        public string $nama,
        public ?string $email = null,
        public ?string $nis = null,
        public ?string $jenis = null,
        public ?string $kelompok = null,
        public ?int $halamanAwal = null,
        public ?int $existingId = null,
        public ?string $reason = null,
        public array $extra = [],
    ) {}

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'type' => $this->type,
            'action' => $this->action->value,
            'action_label' => $this->action->label(),
            'group_key' => $this->groupKey,
            'nama' => $this->nama,
            'email' => $this->email,
            'nis' => $this->nis,
            'jenis' => $this->jenis,
            'kelompok' => $this->kelompok,
            'halaman_awal' => $this->halamanAwal,
            'existing_id' => $this->existingId,
            'reason' => $this->reason,
            'extra' => $this->extra,
        ];
    }
}
```

Create `app/Services/ExcelImport/ImportPlan.php`:

```php
<?php

namespace App\Services\ExcelImport;

use Illuminate\Support\Collection;

final class ImportPlan
{
    /** @param  Collection<int, ImportPlanItem>  $items */
    public function __construct(public readonly Collection $items) {}

    /** @return array<string, int> */
    public function summary(): array
    {
        $byAction = fn (string $type) => $this->items->where('type', $type)->countBy(fn ($i) => $i->action->value)->all();

        return [
            'ustadz' => $byAction('ustadz'),
            'halaqah' => $byAction('halaqah'),
            'santri' => $byAction('santri'),
        ];
    }

    /** @return array{summary: array<string, int>, items: list<array<string, mixed>>} */
    public function toArray(): array
    {
        return [
            'summary' => $this->summary(),
            'items' => $this->items->map(fn (ImportPlanItem $item) => $item->toArray())->all(),
        ];
    }
}
```

- [ ] **Step 4: Implement `ImportPlanner`**

Create `app/Services/ExcelImport/ImportPlanner.php`:

```php
<?php

namespace App\Services\ExcelImport;

use App\Models\Halaqah;
use App\Models\MutabaahSetting;
use App\Models\Santri;
use App\Models\User;
use App\Models\Ustadz;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

final class ImportPlanner
{
    public const DEFAULT_PASSWORD = 'password';
    public const EMAIL_DOMAIN = 'simahal.test';

    public function plan(ParsedWorkbook $wb): ImportPlan
    {
        $items = collect();

        // Indeks data existing (skala kecil, aman dimuat penuh).
        $existingUsers = User::query()->pluck('email');
        $usedEmails = $existingUsers->map(fn (string $e) => strtolower($e))->flip();
        $existingUstadzs = Ustadz::query()->get()->keyBy(fn (Ustadz $u) => (new ExcelReader())->normalizeName($u->nama));
        $existingHalaqahs = Halaqah::query()->get()->keyBy(fn (Halaqah $h) => (new ExcelReader())->normalizeName($h->nama));
        $existingSantris = Santri::query()->get()->keyBy(fn (Santri $s) => (new ExcelReader())->normalizeName($s->nama).'|'.$s->jenis);

        // NIS: nomor urut berikutnya untuk tahun aktif.
        $tahun = MutabaahSetting::setting()->tahun_aktif;
        $maxSeq = 0;
        foreach (Santri::query()->pluck('nis') as $nis) {
            if (is_string($nis) && preg_match('/^SIM-'.$tahun.'-(\d{4})$/', $nis, $m) === 1) {
                $maxSeq = max($maxSeq, (int) $m[1]);
            }
        }
        $nisSeq = $maxSeq;

        // 1) Ustadz unik per muhafidz asli.
        $ustadzForNama = [];
        foreach ($wb->groups as $group) {
            if (! $group->isRealMuhafidz) {
                continue;
            }
            $normalized = (new ExcelReader())->normalizeName($group->muhafidz);
            if (isset($ustadzForNama[$normalized])) {
                continue;
            }
            $ustadzForNama[$normalized] = $normalized;
            $existing = $existingUstadzs->get($normalized);
            $email = $this->uniqueEmail($normalized, $usedEmails);
            $items->push(new ImportPlanItem(
                type: 'ustadz',
                action: $existing ? ImportAction::Update : ImportAction::Create,
                groupKey: $group->jenis.'-'.$group->kelompok,
                nama: trim($group->muhafidz),
                email: $email,
                existingId: $existing?->id,
                extra: ['muhafidz_normalized' => $normalized],
            ));
        }

        // 2) Halaqah per grup (hanya grup dengan muhafidz asli).
        $halaqahForKey = [];
        foreach ($wb->groups as $group) {
            if (! $group->isRealMuhafidz) {
                continue;
            }
            $key = $group->jenis.'-'.$group->kelompok;
            $name = 'Kelompok '.str_replace('Kelompok ', '', $group->kelompok).' '.ucfirst(strtolower($group->jenis));
            $existing = $existingHalaqahs->get((new ExcelReader())->normalizeName($name));
            $halaqahForKey[$key] = $name;
            $items->push(new ImportPlanItem(
                type: 'halaqah',
                action: $existing ? ImportAction::Update : ImportAction::Create,
                groupKey: $key,
                nama: $name,
                existingId: $existing?->id,
                extra: ['muhafidz_normalized' => (new ExcelReader())->normalizeName($group->muhafidz)],
            ));
        }

        // 3) Santri.
        foreach ($wb->santris as $santri) {
            $key = $santri->jenis.'-'.$santri->kelompok;
            $group = collect($wb->groups)->first(fn ($g) => $g->jenis.'-'.$g->kelompok === $key);

            if (! $santri->isReal) {
                $items->push(new ImportPlanItem(
                    type: 'santri',
                    action: ImportAction::Placeholder,
                    groupKey: $key,
                    nama: $santri->nama === '' ? '(kosong)' : $santri->nama,
                    reason: 'Placeholder (nama N/kosong).',
                ));
                continue;
            }

            if (! in_array(strtolower($santri->jenis), ['ikhwan', 'akhwat'], true)) {
                $items->push(new ImportPlanItem(
                    type: 'santri',
                    action: ImportAction::Error,
                    groupKey: $key,
                    nama: $santri->nama,
                    reason: 'Jenis tidak dikenali: '.$santri->jenis.'.',
                ));
                continue;
            }

            if ($group === null || ! $group->isRealMuhafidz) {
                $items->push(new ImportPlanItem(
                    type: 'santri',
                    action: ImportAction::Error,
                    groupKey: $key,
                    nama: $santri->nama,
                    reason: 'Grup tidak memiliki muhafidz asli.',
                ));
                continue;
            }

            $existing = $existingSantris->get($santri->normalizedNama.'|'.strtolower($santri->jenis));
            $nis = null;
            if ($existing === null) {
                $nisSeq++;
                $nis = sprintf('SIM-%d-%04d', $tahun, $nisSeq);
            }

            $items->push(new ImportPlanItem(
                type: 'santri',
                action: $existing ? ImportAction::Update : ImportAction::Create,
                groupKey: $key,
                nama: trim($santri->nama),
                email: $existing ? null : $this->uniqueEmail($santri->normalizedNama, $usedEmails),
                nis: $nis,
                jenis: strtolower($santri->jenis),
                kelompok: $santri->kelompok,
                halamanAwal: $santri->halamanAwal,
                existingId: $existing?->id,
                reason: $existing ? 'Sudah ada — halaman awal diperbarui.' : null,
            ));
        }

        return new ImportPlan($items);
    }

    /** @param  Collection<string, int>  $usedEmails */
    private function uniqueEmail(string $normalizedNama, Collection &$usedEmails): string
    {
        $base = Str::slug($normalizedNama).'@'.self::EMAIL_DOMAIN;
        $candidate = $base;
        $i = 2;
        while ($usedEmails->has($candidate)) {
            $candidate = Str::slug($normalizedNama).'-'.$i.'@'.self::EMAIL_DOMAIN;
            $i++;
        }
        $usedEmails->put($candidate, 1);

        return $candidate;
    }
}
```

- [ ] **Step 5: Run the tests to confirm they pass**

Run: `php artisan test --compact tests/Unit/ExcelImport/ImportPlannerTest.php`
Expected: PASS (5 tests). Catatan: pastikan `Santri` factory mendukung atribut `jenis`/`halaman_awal`/`nis` (sudah dipakai di tes lain).

- [ ] **Step 6: Commit**

```bash
git add app/Services/ExcelImport tests/Unit/ExcelImport
git commit -m "feat: add ImportPlanner for excel import planning"
```

---

### Task 3: `ImportExecutor` — eksekusi transaksional

**Files:**
- Create: `app/Services/ExcelImport/ImportResult.php`
- Create: `app/Services/ExcelImport/ImportExecutor.php`
- Test: `tests/Unit/ExcelImport/ImportExecutorTest.php`

**Interfaces:**
- Consumes: `ImportPlan`, `ImportPlanItem`, `ImportAction`, `ExcelFixtures::dataKelompokXlsx()`, `ExcelReader`, `ImportPlanner`.
- Produces (dipakai Task 4): `ImportExecutor::execute(ImportPlan $plan): ImportResult`; `ImportResult{toArray(): array}` berisi ringkasan + daftar email yang dibuat.

- [ ] **Step 1: Write the failing test**

Create `tests/Unit/ExcelImport/ImportExecutorTest.php`:

```php
<?php

use App\Enums\UserRole;
use App\Models\Halaqah;
use App\Models\HalaqahMember;
use App\Models\MutabaahSetting;
use App\Models\Santri;
use App\Models\User;
use App\Models\Ustadz;
use App\Services\ExcelImport\ExcelReader;
use App\Services\ExcelImport\ImportExecutor;
use App\Services\ExcelImport\ImportPlanner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\ExcelFixtures;
use Tests\TestCase;

uses(RefreshDatabase::class, TestCase::class);

function jalankanImport(array $rows): \App\Services\ExcelImport\ImportResult
{
    $path = ExcelFixtures::dataKelompokXlsx($rows);
    $wb = app(ExcelReader::class)->readDataKelompok($path);
    $plan = app(ImportPlanner::class)->plan($wb);

    return app(ImportExecutor::class)->execute($plan);
}

test('executor membuat santri, ustadz, halaqah, dan keanggotaan', function () {
    $result = jalankanImport([
        ['jenis' => 'Ikhwan', 'kelompok' => 'Kelompok 1', 'muhafidz' => 'Hammam', 'nama' => 'Yahya', 'halamanAwal' => 0],
        ['jenis' => 'Akhwat', 'kelompok' => 'Kelompok 1', 'muhafidz' => 'Asma Alhikmah', 'nama' => 'Roona Humairoh', 'halamanAwal' => 2],
    ]);

    expect(Santri::count())->toBe(2);
    expect(Ustadz::count())->toBe(2);
    expect(Halaqah::count())->toBe(2);
    expect(HalaqahMember::count())->toBe(2);

    $santri = Santri::where('nama', 'Roona Humairoh')->first();
    expect($santri->halaman_awal)->toBe(2);
    expect($santri->jenis)->toBe('akhwat');
    expect($santri->nis)->toBe('SIM-2026-0001');
    expect($santri->user->role)->toBe(UserRole::Santri);
    expect($santri->halaqahs->first()->nama)->toBe('Kelompok 1 Akhwat');

    expect($result->emailsCreated)->toContain('yahya@simahal.test');
    expect($result->emailsCreated)->toContain('roona-humairoh@simahal.test');
});

test('executor memperbarui halaman awal santri existing dan idempoten', function () {
    $santri = Santri::factory()->create(['nama' => 'Yahya', 'jenis' => 'ikhwan', 'halaman_awal' => 1]);
    $rows = [
        ['jenis' => 'Ikhwan', 'kelompok' => 'Kelompok 1', 'muhafidz' => 'Hammam', 'nama' => 'Yahya', 'halamanAwal' => 7],
    ];

    jalankanImport($rows);
    $santri->refresh();
    expect($santri->halaman_awal)->toBe(7);

    jalankanImport($rows);

    expect(Santri::count())->toBe(1);
    expect(User::where('email', 'yahya@simahal.test')->count())->toBe(1);
    expect(Santri::first()->halaman_awal)->toBe(3);
    expect(Santri::first()->halaqahs()->count())->toBe(1);
});

test('executor membuat akun user ustadz dan mencetak nis unik', function () {
    MutabaahSetting::setting()->update(['tahun_aktif' => 2027, 'konversi_juz_halaman' => 20, 'ambang_hadiah_juz' => 1.5]);

    jalankanImport([
        ['jenis' => 'Ikhwan', 'kelompok' => 'Kelompok 1', 'muhafidz' => 'Hammam', 'nama' => 'Yahya', 'halamanAwal' => 0],
        ['jenis' => 'Ikhwan', 'kelompok' => 'Kelompok 1', 'muhafidz' => 'Hammam', 'nama' => 'Zuhdan Sahl Hunaif', 'halamanAwal' => 0],
    ]);

    $ustadz = Ustadz::where('nama', 'Hammam')->first();
    expect($ustadz->user->role)->toBe(UserRole::Ustadz);
    expect(Santri::pluck('nis')->all())->toBe(['SIM-2027-0001', 'SIM-2027-0002']);
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `php artisan test --compact tests/Unit/ExcelImport/ImportExecutorTest.php`
Expected: FAIL — kelas `ImportExecutor` / `ImportResult` tidak ditemukan.

- [ ] **Step 3: Implement `ImportResult` dan `ImportExecutor`**

Create `app/Services/ExcelImport/ImportResult.php`:

```php
<?php

namespace App\Services\ExcelImport;

final class ImportResult
{
    /** @var list<string> */
    public array $emailsCreated = [];
    public int $santriCreated = 0;
    public int $santriUpdated = 0;
    public int $ustadzCreated = 0;
    public int $ustadzUpdated = 0;
    public int $halaqahCreated = 0;
    public int $halaqahUpdated = 0;
    /** @var list<array{nama: string, reason: string}> */
    public array $errors = [];

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'emails_created' => $this->emailsCreated,
            'santri_created' => $this->santriCreated,
            'santri_updated' => $this->santriUpdated,
            'ustadz_created' => $this->ustadzCreated,
            'ustadz_updated' => $this->ustadzUpdated,
            'halaqah_created' => $this->halaqahCreated,
            'halaqah_updated' => $this->halaqahUpdated,
            'errors' => $this->errors,
        ];
    }
}
```

Create `app/Services/ExcelImport/ImportExecutor.php`:

```php
<?php

namespace App\Services\ExcelImport;

use App\Enums\HalaqahMemberStatus;
use App\Enums\HalaqahStatus;
use App\Enums\SantriStatus;
use App\Enums\UserRole;
use App\Models\Halaqah;
use App\Models\Santri;
use App\Models\User;
use App\Models\Ustadz;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

final class ImportExecutor
{
    public function execute(ImportPlan $plan): ImportResult
    {
        $result = new ImportResult;
        /** @var array<string, Ustadz> $ustadzByNama */
        $ustadzByNama = [];
        /** @var array<string, Halaqah> $halaqahByKey */
        $halaqahByKey = [];

        DB::transaction(function () use ($plan, $result, &$ustadzByNama, &$halaqahByKey): void {
            foreach ($plan->items as $item) {
                try {
                    $this->executeItem($item, $result, $ustadzByNama, $halaqahByKey);
                } catch (Throwable $e) {
                    Log::warning('Excel import row failed', ['item' => $item->toArray(), 'error' => $e->getMessage()]);
                    $result->errors[] = ['nama' => $item->nama, 'reason' => $e->getMessage()];
                }
            }
        });

        return $result;
    }

    /** @param  array<string, Ustadz>  $ustadzByNama */
    /** @param  array<string, Halaqah>  $halaqahByKey */
    private function executeItem(ImportPlanItem $item, ImportResult $result, array &$ustadzByNama, array &$halaqahByKey): void
    {
        if ($item->action === ImportAction::Placeholder || $item->action === ImportAction::Error) {
            return;
        }

        if ($item->type === 'ustadz') {
            $normalized = $item->extra['muhafidz_normalized'];
            if ($item->action === ImportAction::Create) {
                $user = $this->createUser($item->nama, $item->email, UserRole::Ustadz);
                $ustadz = Ustadz::create(['user_id' => $user->id, 'nama' => $item->nama]);
                $ustadzByNama[$normalized] = $ustadz;
                $result->ustadzCreated++;
                $result->emailsCreated[] = $item->email;
            } else {
                $ustadz = Ustadz::findOrFail($item->existingId);
                $ustadz->update(['nama' => $item->nama]);
                $ustadzByNama[$normalized] = $ustadz;
                $result->ustadzUpdated++;
            }

            return;
        }

        if ($item->type === 'halaqah') {
            $ustadz = $ustadzByNama[$item->extra['muhafidz_normalized']] ?? null;
            if ($ustadz === null) {
                throw new \RuntimeException('Ustadz untuk halaqah belum tersedia.');
            }
            if ($item->action === ImportAction::Create) {
                $halaqah = Halaqah::create([
                    'nama' => $item->nama,
                    'ustadz_id' => $ustadz->id,
                    'status' => HalaqahStatus::Aktif->value,
                ]);
                $result->halaqahCreated++;
            } else {
                $halaqah = Halaqah::findOrFail($item->existingId);
                $halaqah->update(['nama' => $item->nama, 'ustadz_id' => $ustadz->id]);
                $result->halaqahUpdated++;
            }
            $halaqahByKey[$item->groupKey] = $halaqah;

            return;
        }

        // santri
        if ($item->action === ImportAction::Create) {
            $user = $this->createUser($item->nama, $item->email, UserRole::Santri);
            $santri = Santri::create([
                'user_id' => $user->id,
                'nis' => $item->nis,
                'nama' => $item->nama,
                'status' => SantriStatus::Aktif,
                'halaman_awal' => $item->halamanAwal,
                'jenis' => $item->jenis,
            ]);
            $this->attachToHalaqah($santri, $item->groupKey, $halaqahByKey);
            $result->santriCreated++;
            $result->emailsCreated[] = $item->email;
        } else {
            $santri = Santri::findOrFail($item->existingId);
            $santri->update([
                'halaman_awal' => $item->halamanAwal,
                'jenis' => $item->jenis,
            ]);
            $this->attachToHalaqah($santri, $item->groupKey, $halaqahByKey);
            $result->santriUpdated++;
        }
    }

    private function createUser(string $name, string $email, UserRole $role): User
    {
        return User::create([
            'name' => $name,
            'email' => $email,
            'password' => ImportPlanner::DEFAULT_PASSWORD,
            'role' => $role,
        ]);
    }

    /** @param  array<string, Halaqah>  $halaqahByKey */
    private function attachToHalaqah(Santri $santri, string $groupKey, array $halaqahByKey): void
    {
        $halaqah = $halaqahByKey[$groupKey] ?? null;
        if ($halaqah === null) {
            throw new \RuntimeException('Halaqah untuk santri belum tersedia.');
        }
        $santri->halaqahs()->syncWithoutDetaching([$halaqah->id => [
            'joined_at' => now(),
            'status' => HalaqahMemberStatus::Aktif->value,
        ]]);
    }
}
```

Catatan implementer: `User` model — pastikan atribut `name`, `email`, `password`, `role` lolos fillable (controller admin existing sudah `User::create([... 'role' => ...])`, jadi sudah aman).

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `php artisan test --compact tests/Unit/ExcelImport/ImportExecutorTest.php`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add app/Services/ExcelImport tests/Unit/ExcelImport
git commit -m "feat: add ImportExecutor and ImportResult"
```

---

### Task 4: Controller, FormRequest, dan Routes

**Files:**
- Create: `app/Http/Requests/Admin/ExcelImport/ImportExcelRequest.php`
- Create: `app/Http/Controllers/Admin/ExcelImportController.php`
- Modify: `routes/admin.php` (tambah 3 route di dalam grup)
- Test: `tests/Feature/Admin/ExcelImportTest.php`

**Interfaces:**
- Consumes: `ExcelReader`, `ImportPlanner`, `ImportExecutor`, `ExcelFixtures`.
- Produces (dipakai Task 5): route `admin.excel-import.index|preview|execute`; prop Inertia `plan` (array dari `ImportPlan::toArray()`) dan `result` (array dari `ImportResult::toArray()`).

- [ ] **Step 1: Write the failing test**

Create `tests/Feature/Admin/ExcelImportTest.php`:

```php
<?php

use App\Enums\UserRole;
use App\Models\Halaqah;
use App\Models\HalaqahMember;
use App\Models\Santri;
use App\Models\User;
use App\Models\Ustadz;
use Illuminate\Http\UploadedFile;
use Tests\Support\ExcelFixtures;

function uploadExcel(array $rows): UploadedFile
{
    $path = ExcelFixtures::dataKelompokXlsx($rows);

    return new UploadedFile(
        $path,
        'data.xlsx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        null,
        true,
    );
}

test('admin dapat membuka halaman import excel', function () {
    $this->actingAs(User::factory()->create(['role' => UserRole::Admin]));

    $this->get(route('admin.excel-import.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/excel-import'));
});

test('admin melihat pratinjau rencana import', function () {
    $this->actingAs(User::factory()->create(['role' => UserRole::Admin]));

    $this->post(route('admin.excel-import.preview'), ['file' => uploadExcel([
        ['jenis' => 'Ikhwan', 'kelompok' => 'Kelompok 1', 'muhafidz' => 'Hammam', 'nama' => 'Yahya', 'halamanAwal' => 0],
        ['jenis' => 'Ikhwan', 'kelompok' => 'Kelompok 1', 'muhafidz' => 'Hammam', 'nama' => 'Nama 2', 'halamanAwal' => 0],
    ])])
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/excel-import')
            ->where('plan.summary.santri.create', 1)
            ->where('plan.summary.santri.placeholder', 1)
            ->where('plan.summary.ustadz.create', 1)
            ->where('plan.summary.halaqah.create', 1));
});

test('preview menolak file non-excel', function () {
    $this->actingAs(User::factory()->create(['role' => UserRole::Admin]));

    $this->post(route('admin.excel-import.preview'), [
        'file' => UploadedFile::fake()->create('data.txt', 100),
    ])->assertSessionHasErrors('file');
});

test('admin mengeksekusi import dan db tersimpan', function () {
    $this->actingAs(User::factory()->create(['role' => UserRole::Admin]));

    $this->post(route('admin.excel-import.execute'), ['file' => uploadExcel([
        ['jenis' => 'Ikhwan', 'kelompok' => 'Kelompok 1', 'muhafidz' => 'Hammam', 'nama' => 'Yahya', 'halamanAwal' => 0],
        ['jenis' => 'Akhwat', 'kelompok' => 'Kelompok 1', 'muhafidz' => 'Asma Alhikmah', 'nama' => 'Roona Humairoh', 'halamanAwal' => 2],
    ])]);

    expect(Santri::count())->toBe(2);
    expect(Ustadz::count())->toBe(2);
    expect(Halaqah::count())->toBe(2);
    expect(HalaqahMember::count())->toBe(2);
    expect(User::where('email', 'yahya@simahal.test')->exists())->toBeTrue();
    expect(Santri::where('nama', 'Roona Humairoh')->first()->nis)->toBe('SIM-2026-0002');
});

test('import idempoten tidak menggandakan data', function () {
    $this->actingAs(User::factory()->create(['role' => UserRole::Admin]));
    $file = uploadExcel([
        ['jenis' => 'Ikhwan', 'kelompok' => 'Kelompok 1', 'muhafidz' => 'Hammam', 'nama' => 'Yahya', 'halamanAwal' => 3],
    ]);

    $this->post(route('admin.excel-import.execute'), ['file' => $file]);
    $this->post(route('admin.excel-import.execute'), ['file' => $file]);

    expect(Santri::count())->toBe(1);
    expect(User::where('email', 'yahya@simahal.test')->count())->toBe(1);
    expect(Santri::first()->halaman_awal)->toBe(3);
    expect(Santri::first()->halaqahs()->count())->toBe(1);
});

test('non-admin tidak dapat mengakses halaman import', function () {
    $this->actingAs(User::factory()->create(['role' => UserRole::Ustadz]));

    $this->get(route('admin.excel-import.index'))->assertForbidden();
    $this->post(route('admin.excel-import.preview'))->assertForbidden();
    $this->post(route('admin.excel-import.execute'))->assertForbidden();
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `php artisan test --compact tests/Feature/Admin/ExcelImportTest.php`
Expected: FAIL — route `admin.excel-import.*` tidak ditemukan.

- [ ] **Step 3: Implement FormRequest**

Create `app/Http/Requests/Admin/ExcelImport/ImportExcelRequest.php`:

```php
<?php

namespace App\Http\Requests\Admin\ExcelImport;

use Illuminate\Foundation\Http\FormRequest;

class ImportExcelRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:xlsx,xls', 'max:2048'],
        ];
    }
}
```

- [ ] **Step 4: Implement controller**

Create `app/Http/Controllers/Admin/ExcelImportController.php`:

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ExcelImport\ImportExcelRequest;
use App\Services\ExcelImport\ExcelReader;
use App\Services\ExcelImport\ImportExecutor;
use App\Services\ExcelImport\ImportPlanner;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Session;
use Inertia\Inertia;
use Inertia\Response;

class ExcelImportController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/excel-import', [
            'result' => Session::pull('excel_import_result'),
        ]);
    }

    public function preview(ImportExcelRequest $request): Response
    {
        $path = $request->file('file')->getRealPath();
        $workbook = app(ExcelReader::class)->readDataKelompok($path);
        $plan = app(ImportPlanner::class)->plan($workbook);

        return Inertia::render('admin/excel-import', [
            'plan' => $plan->toArray(),
        ]);
    }

    public function execute(ImportExcelRequest $request): RedirectResponse
    {
        $path = $request->file('file')->getRealPath();
        $workbook = app(ExcelReader::class)->readDataKelompok($path);
        $plan = app(ImportPlanner::class)->plan($workbook);
        $result = app(ImportExecutor::class)->execute($plan);

        Session::flash('excel_import_result', $result->toArray());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Import selesai: :santri santri, :ustadz ustadz.', [
                'santri' => $result->santriCreated,
                'ustadz' => $result->ustadzCreated,
            ]),
        ]);

        return back();
    }
}
```

- [ ] **Step 5: Add routes**

Edit `routes/admin.php` — tambahkan `use` dan route di dalam grup (setelah route `mutabaah-settings`):

```php
use App\Http\Controllers\Admin\ExcelImportController;

Route::get('excel-import', [ExcelImportController::class, 'index'])->name('excel-import.index');
Route::post('excel-import/preview', [ExcelImportController::class, 'preview'])->name('excel-import.preview');
Route::post('excel-import/execute', [ExcelImportController::class, 'execute'])->name('excel-import.execute');
```

- [ ] **Step 6: Run the tests to confirm they pass**

Run: `php artisan test --compact tests/Feature/Admin/ExcelImportTest.php`
Expected: PASS (5 tests).

- [ ] **Step 7: Regenerate Wayfinder + commit**

```bash
php artisan wayfinder:generate
git add app/Http/Requests/Admin/ExcelImport app/Http/Controllers/Admin/ExcelImportController.php routes/admin.php tests/Feature/Admin
git commit -m "feat: add admin excel import routes and controller"
```

---

### Task 5: Halaman Frontend + Navigasi

**Files:**
- Create: `resources/js/pages/admin/excel-import.tsx`
- Modify: `resources/js/components/app-sidebar.tsx` (tambah nav item)
- Regenerate: `resources/js/actions`, `resources/js/routes` (via `php artisan wayfinder:generate`)

**Interfaces:**
- Consumes: route `admin.excel-import.index|preview|execute` (Task 4); wayfinder `@/actions/App/Http/Controllers/Admin/ExcelImportController` dan `@/routes/admin/excel-import`.

- [ ] **Step 1: Regenerate Wayfinder**

```bash
php artisan wayfinder:generate
```

Verifikasi file `resources/js/actions/App/Http/Controllers/Admin/ExcelImportController.ts` dan `resources/js/routes/admin/excel-import.ts` ada.

- [ ] **Step 2: Implement halaman**

Create `resources/js/pages/admin/excel-import.tsx`:

```tsx
import { useForm } from '@inertiajs/react';
import ExcelImportController from '@/actions/App/Http/Controllers/Admin/ExcelImportController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import PageContainer from '@/components/page-container';
import { index as excelImportIndex } from '@/routes/admin/excel-import';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from '@inertiajs/react';
import { FileUp, CheckCircle2 } from 'lucide-react';

type PlanItem = {
    type: 'ustadz' | 'halaqah' | 'santri';
    action: 'create' | 'update' | 'placeholder' | 'error';
    action_label: string;
    nama: string;
    email?: string | null;
    nis?: string | null;
    jenis?: string | null;
    kelompok?: string | null;
    reason?: string | null;
};

type Plan = {
    summary: {
        ustadz: Record<string, number>;
        halaqah: Record<string, number>;
        santri: Record<string, number>;
    };
    items: PlanItem[];
};

type Result = {
    santri_created: number;
    santri_updated: number;
    ustadz_created: number;
    ustadz_updated: number;
    halaqah_created: number;
    halaqah_updated: number;
    emails_created: string[];
    errors: Array<{ nama: string; reason: string }>;
};

type Props = {
    plan?: Plan | null;
    result?: Result | null;
};

const actionBadge: Record<PlanItem['action'], string> = {
    create: 'bg-emerald-100 text-emerald-800',
    update: 'bg-sky-100 text-sky-800',
    placeholder: 'bg-zinc-100 text-zinc-600',
    error: 'bg-red-100 text-red-700',
};

export default function AdminExcelImport({ plan, result }: Props) {
    const form = useForm<{ file: File | null }>({ file: null });

    const hasPlan = Boolean(plan);

    return (
        <PageContainer>
            <Heading
                title="Import Excel"
                description="Impor data master santri, ustadz, dan halaqah dari file Excel (sheet Data Kelompok)."
            />

            {result ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle2 className="size-5 text-emerald-600" />
                            Import Selesai
                        </CardTitle>
                        <CardDescription>
                            Santri baru: {result.santri_created} · Santri diperbarui: {result.santri_updated}
                            {' · '}Ustadz baru: {result.ustadz_created} · Halaqah baru: {result.halaqah_created}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {result.emails_created.length > 0 && (
                            <div className="grid gap-1">
                                <p className="text-sm font-medium">Email akun yang dibuat:</p>
                                <ul className="max-h-40 list-inside list-disc overflow-auto rounded-md bg-muted p-3 text-sm">
                                    {result.emails_created.map((email) => (
                                        <li key={email}>{email}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <div className="flex gap-2">
                            <Button asChild variant="outline">
                                <Link href={excelImportIndex()}>Import Lagi</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileUp className="size-5 text-emerald-600" />
                                {hasPlan ? 'Pratinjau Rencana' : 'Unggah File Excel'}
                            </CardTitle>
                            <CardDescription>
                                {hasPlan
                                    ? 'Periksa rencana di bawah sebelum dieksekusi.'
                                    : 'Format mengikuti sheet "Data Kelompok" pada Mutabaah_Hafalan_Santri.xlsx.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="file">File Excel</Label>
                                <Input
                                    id="file"
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={(e) => form.setData('file', e.target.files?.[0] ?? null)}
                                />
                                <InputError message={form.errors.file} />
                            </div>
                            <div className="flex justify-end gap-2">
                                {hasPlan && (
                                    <Button type="button" variant="outline" onClick={() => window.location.reload()}>
                                        Batalkan
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    disabled={form.processing || !form.data.file}
                                    onClick={() =>
                                        hasPlan
                                            ? form.post(ExcelImportController.execute.url())
                                            : form.post(ExcelImportController.preview.url())
                                    }
                                >
                                    {hasPlan ? 'Konfirmasi Import' : 'Lihat Pratinjau'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {hasPlan && plan && <PlanTable plan={plan} />}
                </>
            )}
        </PageContainer>
    );
}

function PlanTable({ plan }: { plan: Plan }) {
    const counts = (type: keyof Plan['summary']) => {
        const s = plan.summary[type];
        const total = Object.values(s).reduce((a, b) => a + b, 0);

        return `${total} ${type}`;
    };

    return (
        <Card className="mt-4">
            <CardHeader>
                <CardTitle>Ringkasan Rencana</CardTitle>
                <CardDescription>{counts('ustadz')} · {counts('halaqah')} · {counts('santri')}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto rounded-md border">
                    <table className="text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                {['Entitas', 'Nama', 'Tindakan', 'Detail'].map((h) => (
                                    <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {plan.items.map((item, i) => (
                                <tr key={`${item.type}-${i}`} className="border-b last:border-0">
                                    <td className="px-3 py-2 capitalize">{item.type}</td>
                                    <td className="px-3 py-2">{item.nama}</td>
                                    <td className="px-3 py-2">
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${actionBadge[item.action]}`}>
                                            {item.action_label}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 text-muted-foreground">
                                        {[item.nis, item.email, item.reason].filter(Boolean).join(', ') || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}

AdminExcelImport.layout = {
    breadcrumbs: [
        {
            title: 'Import Excel',
            href: excelImportIndex(),
        },
    ],
};
```

- [ ] **Step 3: Add nav item**

Edit `resources/js/components/app-sidebar.tsx`:
- Tambah import `FileUp` dari `lucide-react` dan `import { index as excelImportIndex } from '@/routes/admin/excel-import';`.
- Tambah item di `adminNavItems`, misal setelah `Pengaturan Mutabaah`:

```ts
{ title: 'Import Excel', href: excelImportIndex(), icon: FileUp },
```

- [ ] **Step 4: Type-check frontend**

Run: `npx tsc --noEmit`
Expected: clean (0 errors). Jika error terkait wayfinder, jalankan `php artisan wayfinder:generate` lalu ulangi.

- [ ] **Step 5: Build + pint + full suite + commit**

```bash
npm run build
vendor/bin/pint --dirty --format agent
php artisan test --compact
git add resources/js/pages/admin/excel-import.tsx resources/js/components/app-sidebar.tsx resources/js/actions resources/js/routes
git commit -m "feat: add admin excel import page"
```

---

### Task 6: Verifikasi Final

**Files:** (tidak ada file baru)

- [ ] **Step 1: Jalankan seluruh rangkaian verifikasi**

```bash
vendor/bin/pint --dirty --format agent
php artisan test --compact
npx tsc --noEmit
npm run build
```

Expected: semua hijau.

- [ ] **Step 2: Smoke test manual UI (jika perangkat pengembangan aktif)**

Buka `GET /admin/excel-import` (login admin `admin@simahal.test` / `password`), unggah file asli `Mutabaah_Hafalan_Santri.xlsx`, lihat pratinjau, konfirmasi, pastikan laporan tampil dan data muncul di `admin/santris`. Jika frontend tidak berubah di browser, jalankan `npm run dev` atau `composer run dev`.

- [ ] **Step 3: Catat keputusan durable ke rules (setelah disetujui)**

Gunakan `record-rule` dari MCP Boost, glob `app/Services/ExcelImport/**`, judul singkat, isi: import hanya membuat/memperbarui entity via service layer; ingredient: jangan panggil `ImportExecutor` dari luar transaksi penuh; email/NIS deterministik; placeholder `Nama N` & `Muhafidz... N` selalu dilewati.