<?php

namespace App\Enums;

enum TargetHafalanStatus: string
{
    case Berlangsung = 'berlangsung';
    case Selesai = 'selesai';

    public function label(): string
    {
        return match ($this) {
            self::Berlangsung => 'Berlangsung',
            self::Selesai => 'Selesai',
        };
    }
}
