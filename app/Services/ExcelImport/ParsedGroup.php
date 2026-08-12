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
