<?php

namespace App\Models;

use App\Concerns\BelongsToPondok;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SetoranDetail extends Model
{
    use BelongsToPondok;

    protected $fillable = ['mutabaah_id', 'surah_id', 'baris', 'pondok_id'];

    protected function casts(): array
    {
        return ['baris' => 'integer'];
    }

    /** @return BelongsTo<Mutabaah, $this> */
    public function mutabaah(): BelongsTo
    {
        return $this->belongsTo(Mutabaah::class);
    }

    /** @return BelongsTo<Surah, $this> */
    public function surah(): BelongsTo
    {
        return $this->belongsTo(Surah::class);
    }
}
