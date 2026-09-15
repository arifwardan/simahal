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
 * @property int $muhafidz_id
 * @property string|null $jadwal
 * @property string|null $jam_mulai
 * @property string|null $jam_selesai
 * @property HalaqahStatus $status
 */
#[Fillable(['nama', 'muhafidz_id', 'jadwal', 'jam_mulai', 'jam_selesai', 'status'])]
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
     * @return BelongsTo<Muhafidz, $this>
     */
    public function muhafidz(): BelongsTo
    {
        return $this->belongsTo(Muhafidz::class);
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

    /**
     * @return HasMany<HalaqahSchedule, $this>
     */
    public function schedules(): HasMany
    {
        return $this->hasMany(HalaqahSchedule::class, 'halaqah_id');
    }
}
