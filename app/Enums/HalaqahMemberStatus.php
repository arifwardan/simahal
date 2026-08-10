<?php

namespace App\Enums;

enum HalaqahMemberStatus: string
{
    case Aktif = 'aktif';
    case Keluar = 'keluar';

    public function label(): string
    {
        return match ($this) {
            self::Aktif => 'Aktif',
            self::Keluar => 'Keluar',
        };
    }
}
