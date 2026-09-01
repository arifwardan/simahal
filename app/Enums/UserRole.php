<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Muhafidz = 'muhafidz';
    case Santri = 'santri';
    case OrangTua = 'orang_tua';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Admin',
            self::Muhafidz => 'Muhafidz',
            self::Santri => 'Santri',
            self::OrangTua => 'Orang Tua',
        };
    }
}
