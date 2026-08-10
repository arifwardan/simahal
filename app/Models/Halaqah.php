<?php

namespace App\Models;

use App\Enums\HalaqahStatus;
use Database\Factories\HalaqahFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $nama
 * @property int $ustadz_id
 * @property string|null $jadwal
 * @property HalaqahStatus $status
 */
#[Fillable(['nama', 'ustadz_id', 'jadwal', 'status'])]
class Halaqah extends Model
{
    /** @use HasFactory<HalaqahFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => HalaqahStatus::class,
        ];
    }

    /**
     * @return BelongsTo<Ustadz, $this>
     */
    public function ustadz(): BelongsTo
    {
        return $this->belongsTo(Ustadz::class);
    }

    /**
     * @return HasMany<HalaqahMember, $this>
     */
    public function members(): HasMany
    {
        return $this->hasMany(HalaqahMember::class);
    }

    /**
     * @return BelongsToMany<Santri, $this>
     */
    public function santris(): BelongsToMany
    {
        return $this->belongsToMany(Santri::class, 'halaqah_members')
            ->using(HalaqahMember::class)
            ->withPivot('joined_at', 'status')
            ->withTimestamps();
    }
}
