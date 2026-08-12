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
