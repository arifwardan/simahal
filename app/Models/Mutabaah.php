<?php

namespace App\Models;

use App\Enums\MutabaahJenis;
use App\Enums\MutabaahStatus;
use Database\Factories\MutabaahFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $santri_id
 * @property int $muhafidz_id
 * @property Carbon $tanggal
 * @property MutabaahJenis $jenis
 * @property string $surah
 * @property int $ayat_mulai
 * @property int $ayat_selesai
 * @property int|null $nilai
 * @property MutabaahStatus $status
 * @property string|null $catatan
 * @property int|null $halaman Satuan baris (nama kolom historis, isi = jumlah baris)
 */
#[Fillable(['santri_id', 'muhafidz_id', 'tanggal', 'jenis', 'surah', 'ayat_mulai', 'ayat_selesai', 'nilai', 'status', 'catatan', 'halaman'])]
class Mutabaah extends Model
{
    /** @use HasFactory<MutabaahFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
            'jenis' => MutabaahJenis::class,
            'status' => MutabaahStatus::class,
            'halaman' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Santri, $this>
     */
    public function santri(): BelongsTo
    {
        return $this->belongsTo(Santri::class);
    }

    /**
     * @return BelongsTo<Muhafidz, $this>
     */
    public function muhafidz(): BelongsTo
    {
        return $this->belongsTo(Muhafidz::class);
    }
}
