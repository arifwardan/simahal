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
