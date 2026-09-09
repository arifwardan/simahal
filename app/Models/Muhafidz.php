<?php

namespace App\Models;

use App\Concerns\BelongsToPondok;
use Database\Factories\MuhafidzFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $user_id
 * @property string $nama
 * @property string|null $kontak
 */
#[Fillable(['user_id', 'nama', 'kontak', 'pondok_id'])]
class Muhafidz extends Model
{
    /** @use HasFactory<MuhafidzFactory> */
    use BelongsToPondok, HasFactory;

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<Halaqah, $this>
     */
    public function halaqahs(): HasMany
    {
        return $this->hasMany(Halaqah::class);
    }

    /**
     * @return HasMany<Mutabaah, $this>
     */
    public function mutabaahs(): HasMany
    {
        return $this->hasMany(Mutabaah::class);
    }
}
