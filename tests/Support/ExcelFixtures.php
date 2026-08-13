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
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Data Kelompok');
        // Meniru struktur file asli Mutabaah_Hafalan_Santri.xlsx: judul & statistik
        // di baris 1-3, header di baris 4, data mulai baris 5.
        $sheet->setCellValue('A1', 'DATA KELOMPOK MUHAFIDZ & SANTRI');
        $sheet->setCellValue('A4', 'No');
        $sheet->setCellValue('B4', 'Jenis');
        $sheet->setCellValue('C4', 'Kelompok');
        $sheet->setCellValue('D4', 'Muhafidz/Muhafidzah');
        $sheet->setCellValue('E4', 'Nama Santri');
        $sheet->setCellValue('F4', 'Halaman Awal (Sebelum Program)');

        foreach ($rows as $i => $row) {
            $no = $i + 5;
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
