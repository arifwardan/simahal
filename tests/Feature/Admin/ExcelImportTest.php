<?php

use App\Enums\UserRole;
use App\Models\Halaqah;
use App\Models\HalaqahMember;
use App\Models\Santri;
use App\Models\User;
use App\Models\Ustadz;
use App\Services\ExcelImport\ImportExecutor;
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
        ->assertRedirect(route('admin.excel-import.index'));

    $this->get(route('admin.excel-import.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/excel-import')
            ->where('plan.summary.santri.create', 1)
            ->where('plan.summary.santri.placeholder', 1)
            ->where('plan.summary.ustadz.create', 1)
            ->where('plan.summary.halaqah.create', 1));
});

test('redirect setelah preview/execute tidak menuju URL metode POST sehingga tidak 405', function () {
    $this->actingAs(User::factory()->create(['role' => UserRole::Admin]));
    $file = uploadExcel([
        ['jenis' => 'Ikhwan', 'kelompok' => 'Kelompok 1', 'muhafidz' => 'Hammam', 'nama' => 'Yahya', 'halamanAwal' => 0],
    ]);

    $preview = $this->post(route('admin.excel-import.preview'), ['file' => $file]);

    $preview->assertRedirect(route('admin.excel-import.index'));
    $this->get($preview->headers->get('Location'))->assertOk();

    $execute = $this->withHeader('referer', $preview->headers->get('Location'))
        ->post(route('admin.excel-import.execute'), ['file' => $file]);

    $execute->assertRedirect(route('admin.excel-import.index'));
    $this->get($execute->headers->get('Location'))->assertOk();
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

test('admin menerima flash error saat eksekusi import gagal', function () {
    $this->actingAs(User::factory()->create(['role' => UserRole::Admin]));

    $this->mock(ImportExecutor::class)
        ->shouldReceive('execute')
        ->andThrow(new RuntimeException('boom'));

    $this->post(route('admin.excel-import.execute'), ['file' => uploadExcel([
        ['jenis' => 'Ikhwan', 'kelompok' => 'Kelompok 1', 'muhafidz' => 'Hammam', 'nama' => 'Yahya', 'halamanAwal' => 0],
    ])])
        ->assertRedirect()
        ->assertInertiaFlash('toast.type', 'error')
        ->assertInertiaFlash('toast.message', 'Import gagal: boom');

    expect(Santri::count())->toBe(0);
    expect(Ustadz::count())->toBe(0);
    expect(Halaqah::count())->toBe(0);
    expect(User::where('email', 'yahya@simahal.test')->count())->toBe(0);
});

test('non-admin tidak dapat mengakses halaman import', function () {
    $this->actingAs(User::factory()->create(['role' => UserRole::Ustadz]));

    $this->get(route('admin.excel-import.index'))->assertForbidden();
    $this->post(route('admin.excel-import.preview'))->assertForbidden();
    $this->post(route('admin.excel-import.execute'))->assertForbidden();
});
