<?php

namespace App\Models;

use App\Concerns\BelongsToPondok;
use App\Enums\MutabaahJenis;
use App\Enums\MutabaahStatus;
use Database\Factories\MutabaahFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
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
#[Fillable(['santri_id', 'muhafidz_id', 'tanggal', 'jenis', 'surah', 'ayat_mulai', 'ayat_selesai', 'nilai', 'status', 'catatan', 'halaman', 'pondok_id'])]
class Mutabaah extends Model
{
    /** @use HasFactory<MutabaahFactory> */
    use BelongsToPondok, HasFactory;

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

    /** @return HasMany<SetoranDetail, $this> */
    public function details(): HasMany
    {
        return $this->hasMany(SetoranDetail::class);
    }

    public function buildSurahSummary(): string
    {
        $names = $this->details()->with('surah')
            ->get()
            ->sortBy(fn (SetoranDetail $d) => $d->surah->nomor)
            ->map(fn (SetoranDetail $d) => ['nomor' => $d->surah->nomor, 'nama' => $d->surah->nama_latin])
            ->values();

        if ($names->isEmpty()) {
            return '-';
        }

        $numbers = $names->pluck('nomor')->all();
        $isRange = $numbers === range(min($numbers), max($numbers));

        if ($isRange && $names->count() > 1) {
            return $names->first()['nama'].' – '.$names->last()['nama'];
        }

        $shown = $names->take(3)->pluck('nama')->all();
        $rest = $names->count() - count($shown);

        return implode(', ', $shown).($rest > 0 ? ', +'.$rest : '');
    }
}
