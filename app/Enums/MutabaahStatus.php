<?php

namespace App\Enums;

enum MutabaahStatus: string
{
    case Lulus = 'lulus';
    case PerluMurajaah = 'perlu_murajaah';
    case Mengulang = 'mengulang';

    public function label(): string
    {
        return match ($this) {
            self::Lulus => 'Lulus',
            self::PerluMurajaah => 'Perlu Murajaah',
            self::Mengulang => 'Mengulang',
        };
    }
}
