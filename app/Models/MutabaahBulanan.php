<?php

namespace App\Models;

use Database\Factories\MutabaahBulananFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $santri_id
 * @property int $tahun
 * @property int $bulan
 * @property int|null $halaman_awal_bulan
 * @property int|null $halaman_kumulatif
 */
#[Fillable([
    'santri_id', 'tahun', 'bulan', 'halaman_awal_bulan', 'halaman_kumulatif',
    'juz_dihafal', 'tasmi_pekan_1', 'tasmi_pekan_2', 'tasmi_pekan_3', 'tasmi_pekan_4', 'tasmi_pekan_5',
    'ujian_bulanan', 'catatan_tasmi', 'catatan_ujian',
])]
class MutabaahBulanan extends Model
{
    /** @use HasFactory<MutabaahBulananFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tahun' => 'integer',
            'bulan' => 'integer',
            'halaman_awal_bulan' => 'integer',
            'halaman_kumulatif' => 'integer',
            'tasmi_pekan_1' => 'integer',
            'tasmi_pekan_2' => 'integer',
            'tasmi_pekan_3' => 'integer',
            'tasmi_pekan_4' => 'integer',
            'tasmi_pekan_5' => 'integer',
            'ujian_bulanan' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Santri, $this>
     */
    public function santri(): BelongsTo
    {
        return $this->belongsTo(Santri::class);
    }
}
