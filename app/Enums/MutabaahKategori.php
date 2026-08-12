<?php

namespace App\Enums;

enum MutabaahKategori: string
{
    case Belum = '0';
    case Seperempat = '0.25';
    case Sepertiga = '0.333333';
    case Setengah = '0.5';
    case Satu = '1';
    case SatuSetengah = '1.5';
    case Dua = '2';
    case DuaSetengah = '2.5';
    case Tiga = '3';
    case TigaSetengah = '3.5';
    case Empat = '4';
    case EmpatSetengah = '4.5';
    case Lima = '5';
    case LimaSetengah = '5.5';
    case Enam = '6';
    case EnamSetengah = '6.5';
    case Tujuh = '7';
    case TujuhSetengah = '7.5';
    case Delapan = '8';
    case DelapanSetengah = '8.5';
    case Sembilan = '9';
    case SembilanSetengah = '9.5';

    public function threshold(): float
    {
        return (float) $this->value;
    }

    public function label(): string
    {
        return match ($this) {
            self::Belum => 'Belum Mencapai 1/4 Juz',
            self::Seperempat => '1/4 Juz',
            self::Sepertiga => '1/3 Juz',
            self::Setengah => '1/2 Juz',
            self::Satu => '1 Juz',
            default => str_replace('.', ',', $this->value).' Juz',
        };
    }

    public static function forTotalJuz(float $juz): ?self
    {
        $result = null;

        foreach (self::cases() as $case) {
            if ($case->threshold() <= $juz) {
                $result = $case;
            }
        }

        return $result;
    }
}
