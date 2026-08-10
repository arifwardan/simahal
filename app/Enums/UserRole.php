<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Ustadz = 'ustadz';
    case Santri = 'santri';
    case OrangTua = 'orang_tua';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Admin',
            self::Ustadz => 'Ustadz',
            self::Santri => 'Santri',
            self::OrangTua => 'Orang Tua',
        };
    }
}
