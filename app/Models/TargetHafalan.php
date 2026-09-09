<?php

namespace App\Models;

use App\Concerns\BelongsToPondok;
use App\Enums\TargetHafalanStatus;
use Database\Factories\TargetHafalanFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $santri_id
 * @property string $periode
 * @property int $target
 * @property int $progress
 * @property TargetHafalanStatus $status
 */
#[Fillable(['santri_id', 'periode', 'target', 'progress', 'status', 'pondok_id'])]
class TargetHafalan extends Model
{
    /** @use HasFactory<TargetHafalanFactory> */
    use BelongsToPondok, HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => TargetHafalanStatus::class,
        ];
    }

    /**
     * @return BelongsTo<Santri, $this>
     */
    public function santri(): BelongsTo
    {
        return $this->belongsTo(Santri::class);
    }

    public function progressPercent(): int
    {
        if ($this->target <= 0) {
            return 0;
        }

        // target disimpan sebagai Juz (max 30), progress disimpan sebagai halaman
        // konversi target ke halaman untuk persentase yang akurat
        $targetHalaman = $this->target * 20;

        return (int) floor(($this->progress / $targetHalaman) * 100);
    }
}
