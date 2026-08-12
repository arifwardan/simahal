<?php

namespace App\Enums;

enum SantriJenis: string
{
    case Ikhwan = 'ikhwan';
    case Akhwat = 'akhwat';

    public function label(): string
    {
        return match ($this) {
            self::Ikhwan => 'Ikhwan',
            self::Akhwat => 'Akhwat',
        };
    }
}
