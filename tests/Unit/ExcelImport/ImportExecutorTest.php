<?php

use App\Enums\SantriJenis;
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
use App\Services\ExcelImport\ImportResult;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\ExcelFixtures;
use Tests\TestCase;

uses(RefreshDatabase::class, TestCase::class);

function jalankanImport(array $rows): ImportResult
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
    expect($santri->jenis)->toBe(SantriJenis::Akhwat);
    expect($santri->nis)->toBe('SIM-2026-0002');
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
    expect(User::where('email', 'yahya@simahal.test')->count())->toBe(0);
    expect(Santri::first()->halaman_awal)->toBe(7);
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
