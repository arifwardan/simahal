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

test('reader mengabaikan baris judul di atas baris header yang berbeda posisi', function () {
    $spreadsheet = new Spreadsheet;
    $sheet = $spreadsheet->getActiveSheet();
    $sheet->setTitle('Data Kelompok');
    $sheet->setCellValue('A1', 'DATA KELOMPOK MUHAFIDZ & SANTRI');
    $sheet->setCellValue('A3', 'Total Santri:');
    // Header baru saja di baris 6.
    $sheet->setCellValue('A6', 'No');
    $sheet->setCellValue('B6', 'Jenis');
    $sheet->setCellValue('C6', 'Kelompok');
    $sheet->setCellValue('D6', 'Muhafidz/Muhafidzah');
    $sheet->setCellValue('E6', 'Nama Santri');
    $sheet->setCellValue('F6', 'Halaman Awal (Sebelum Program)');
    $sheet->setCellValue('A7', '1');
    $sheet->setCellValue('B7', 'Ikhwan');
    $sheet->setCellValue('C7', 'Kelompok 1');
    $sheet->setCellValue('D7', 'Hammam');
    $sheet->setCellValue('E7', 'Yahya');
    $sheet->setCellValue('F7', '4');
    $dir = sys_get_temp_dir().'/simahal-excel-fixtures';
    $path = $dir.'/'.uniqid('vary-', true).'.xlsx';
    (new Xlsx($spreadsheet))->save($path);

    $wb = app(ExcelReader::class)->readDataKelompok($path);

    expect($wb->santris)->toHaveCount(1);
    expect($wb->santris[0]->nama)->toBe('Yahya');
    expect($wb->santris[0]->halamanAwal)->toBe(4);
    expect($wb->santris[0]->normalizedNama)->toBe('yahya');
});

test('reader melempar exception saat sheet data kelompok hilang', function () {
    $spreadsheet = new Spreadsheet;
    $spreadsheet->getActiveSheet()->setTitle('Lain');
    $dir = sys_get_temp_dir().'/simahal-excel-fixtures';
    $path = $dir.'/'.uniqid('bad-', true).'.xlsx';
    (new Xlsx($spreadsheet))->save($path);

    app(ExcelReader::class)->readDataKelompok($path);
})->throws(RuntimeException::class);
