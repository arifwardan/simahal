<?php

namespace App\Services\ExcelImport;

enum ImportAction: string
{
    case Create = 'create';
    case Update = 'update';
    case Placeholder = 'placeholder';
    case Error = 'error';

    public function label(): string
    {
        return match ($this) {
            self::Create => 'Dibuat',
            self::Update => 'Diperbarui',
            self::Placeholder => 'Dilewati',
            self::Error => 'Gagal',
        };
    }
}
