<?php

namespace App\Models;

use App\Enums\HalaqahHari;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $halaqah_id
 * @property HalaqahHari $hari
 * @property string $jam_mulai
 * @property string $jam_selesai
 */
#[Fillable(['halaqah_id', 'hari', 'jam_mulai', 'jam_selesai'])]
class HalaqahSchedule extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'hari' => HalaqahHari::class,
        ];
    }

    /**
     * @return BelongsTo<Halaqah, $this>
     */
    public function halaqah(): BelongsTo
    {
        return $this->belongsTo(Halaqah::class);
    }
}
