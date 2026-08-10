<?php

namespace App\Models;

use App\Enums\HalaqahMemberStatus;
use Database\Factories\HalaqahMemberFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Support\Carbon;

/**
 * @property int $halaqah_id
 * @property int $santri_id
 * @property Carbon|null $joined_at
 * @property HalaqahMemberStatus $status
 */
#[Fillable(['halaqah_id', 'santri_id', 'joined_at', 'status'])]
class HalaqahMember extends Pivot
{
    /** @use HasFactory<HalaqahMemberFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'joined_at' => 'date',
            'status' => HalaqahMemberStatus::class,
        ];
    }

    /**
     * @return BelongsTo<Halaqah, $this>
     */
    public function halaqah(): BelongsTo
    {
        return $this->belongsTo(Halaqah::class);
    }

    /**
     * @return BelongsTo<Santri, $this>
     */
    public function santri(): BelongsTo
    {
        return $this->belongsTo(Santri::class);
    }
}
