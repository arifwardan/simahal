<?php

namespace App\Services\ExcelImport;

final class ImportResult
{
    /** @var list<string> */
    public array $emailsCreated = [];

    public int $santriCreated = 0;

    public int $santriUpdated = 0;

    public int $muhafidzCreated = 0;

    public int $muhafidzUpdated = 0;

    public int $halaqahCreated = 0;

    public int $halaqahUpdated = 0;

    /** @var list<array{nama: string, reason: string}> */
    public array $errors = [];

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'emails_created' => $this->emailsCreated,
            'santri_created' => $this->santriCreated,
            'santri_updated' => $this->santriUpdated,
            'muhafidz_created' => $this->muhafidzCreated,
            'muhafidz_updated' => $this->muhafidzUpdated,
            'halaqah_created' => $this->halaqahCreated,
            'halaqah_updated' => $this->halaqahUpdated,
            'errors' => $this->errors,
        ];
    }
}
