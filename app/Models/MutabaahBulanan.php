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
    'ujian_soal_1', 'ujian_soal_2', 'ujian_soal_3', 'ujian_soal_4', 'ujian_soal_5',
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
            'ujian_soal_1' => 'boolean',
            'ujian_soal_2' => 'boolean',
            'ujian_soal_3' => 'boolean',
            'ujian_soal_4' => 'boolean',
            'ujian_soal_5' => 'boolean',
        ];
    }

    public function ujianTotal(): int
    {
        $count = collect([
            $this->ujian_soal_1, $this->ujian_soal_2, $this->ujian_soal_3,
            $this->ujian_soal_4, $this->ujian_soal_5,
        ])->filter(fn ($v) => $v === true)->count();

        return $count * 20;
    }

    /**
     * @return BelongsTo<Santri, $this>
     */
    public function santri(): BelongsTo
    {
        return $this->belongsTo(Santri::class);
    }
}
