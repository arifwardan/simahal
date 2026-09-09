<?php

namespace App\Models;

use App\Concerns\BelongsToPondok;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int $konversi_juz_halaman
 * @property float $ambang_hadiah_juz
 * @property int $tahun_aktif
 */
#[Fillable(['konversi_juz_halaman', 'ambang_hadiah_juz', 'tahun_aktif', 'pondok_id'])]
class MutabaahSetting extends Model
{
    use BelongsToPondok, HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'konversi_juz_halaman' => 'integer',
            'ambang_hadiah_juz' => 'float',
            'tahun_aktif' => 'integer',
        ];
    }

    public static function setting(): self
    {
        return self::query()->firstOrCreate(
            ['id' => 1],
            ['konversi_juz_halaman' => 20, 'ambang_hadiah_juz' => 1.5, 'tahun_aktif' => (int) now()->year],
        );
    }
}
