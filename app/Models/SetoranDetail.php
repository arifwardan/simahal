<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SetoranDetail extends Model
{
    protected $fillable = ['mutabaah_id', 'surah_id', 'baris'];

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
