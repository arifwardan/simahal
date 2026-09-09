<?php

namespace App\Concerns;

use App\Models\Pondok;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToPondok
{
    public static function bootBelongsToPondok(): void
    {
        static::addGlobalScope('pondok', new PondokScope);

        static::creating(function ($model): void {
            if (empty($model->pondok_id)) {
                $model->pondok_id = auth()->user()?->pondok_id;
            }

            if (empty($model->pondok_id) && ! app()->runningInConsole() && ! app()->runningUnitTests()) {
                throw new \LogicException('pondok_id is required.');
            }
        });
    }

    /** @return BelongsTo<Pondok, $this> */
    public function pondok(): BelongsTo
    {
        return $this->belongsTo(Pondok::class);
    }
}
