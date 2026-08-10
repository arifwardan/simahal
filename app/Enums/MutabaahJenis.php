<?php

namespace App\Enums;

enum MutabaahJenis: string
{
    case Setoran = 'setoran';
    case Murajaah = 'murajaah';

    public function label(): string
    {
        return match ($this) {
            self::Setoran => 'Setoran',
            self::Murajaah => 'Murajaah',
        };
    }
}
