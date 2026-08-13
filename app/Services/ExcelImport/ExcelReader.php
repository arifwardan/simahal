<?php

namespace App\Services\ExcelImport;

use PhpOffice\PhpSpreadsheet\Reader\Xlsx;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use RuntimeException;

final class ExcelReader
{
    private const SHEET_NAME = 'Data Kelompok';

    private const INVISIBLE_REGEX = '/[\x{200B}-\x{200F}\x{FEFF}\x{2060}]/u';

    public function readDataKelompok(string $path): ParsedWorkbook
    {
        $sheet = (new Xlsx)->setReadDataOnly(true)->load($path)->getSheetByName(self::SHEET_NAME)
            ?? throw new RuntimeException('Sheet "Data Kelompok" tidak ditemukan.');

        $groups = [];
        $santris = [];

        $headerRow = $this->locateHeaderRow($sheet);

        for ($row = $headerRow + 1; $row <= $sheet->getHighestDataRow(); $row++) {
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

        return mb_strtolower(trim($name), 'UTF-8');
    }

    private function locateHeaderRow(Worksheet $sheet): int
    {
        $highest = $sheet->getHighestDataRow();

        for ($row = 1; $row <= $highest; $row++) {
            $e = mb_strtolower(trim((string) $sheet->getCell("E{$row}")->getValue()), 'UTF-8');
            $b = mb_strtolower(trim((string) $sheet->getCell("B{$row}")->getValue()), 'UTF-8');

            if (str_contains($e, 'nama santri')) {
                return $row;
            }
            if ($this->isPlausibleHeaderRow($e, $b)) {
                return $row;
            }
        }

        throw new RuntimeException('Baris header sheet "Data Kelompok" tidak ditemukan.');
    }

    private function isPlausibleHeaderRow(string $cellE, string $cellB): bool
    {
        $known = ['no', 'jenis', 'kelompok', 'muhafidz', 'nama santri', 'halaman awal'];

        $hits = 0;
        foreach ([$cellE, $cellB] as $cell) {
            foreach ($known as $label) {
                if (str_contains($cell, $label)) {
                    $hits++;
                    break;
                }
            }
        }

        return $hits >= 2;
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
