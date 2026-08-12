<?php

use App\Services\ExcelImport\ExcelReader;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
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
    $spreadsheet = new Spreadsheet;
    $spreadsheet->getActiveSheet()->setTitle('Lain');
    $dir = sys_get_temp_dir().'/simahal-excel-fixtures';
    $path = $dir.'/'.uniqid('bad-', true).'.xlsx';
    (new Xlsx($spreadsheet))->save($path);

    app(ExcelReader::class)->readDataKelompok($path);
})->throws(RuntimeException::class);
