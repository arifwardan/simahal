<?php

namespace App\Models;

use App\Enums\SantriJenis;
use App\Enums\SantriStatus;
use Database\Factories\SantriFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property int|null $orang_tua_id
 * @property string|null $nis
 * @property string $nama
 * @property Carbon|null $tanggal_lahir
 * @property SantriStatus $status
 * @property int|null $halaman_awal
 * @property SantriJenis|null $jenis
 */
#[Fillable(['user_id', 'orang_tua_id', 'nis', 'nama', 'tanggal_lahir', 'status', 'halaman_awal', 'jenis'])]
class Santri extends Model
{
    /** @use HasFactory<SantriFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tanggal_lahir' => 'date',
            'status' => SantriStatus::class,
            'halaman_awal' => 'integer',
            'jenis' => SantriJenis::class,
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<OrangTua, $this>
     */
    public function orangTua(): BelongsTo
    {
        return $this->belongsTo(OrangTua::class);
    }

    /**
     * @return BelongsToMany<Halaqah, $this>
     */
    public function halaqahs(): BelongsToMany
    {
        return $this->belongsToMany(Halaqah::class, 'halaqah_members')
            ->using(HalaqahMember::class)
            ->withPivot('joined_at', 'status')
            ->withTimestamps();
    }

    /**
     * @return HasMany<HalaqahMember, $this>
     */
    public function memberships(): HasMany
    {
        return $this->hasMany(HalaqahMember::class);
    }

    /**
     * @return HasMany<TargetHafalan, $this>
     */
    public function targetHafalans(): HasMany
    {
        return $this->hasMany(TargetHafalan::class);
    }

    /**
     * @return HasMany<Mutabaah, $this>
     */
    public function mutabaahs(): HasMany
    {
        return $this->hasMany(Mutabaah::class);
    }
}
