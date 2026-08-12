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
