<?php

namespace App\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class PondokScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $pondokId = auth()->user()?->pondok_id;

        if ($pondokId !== null) {
            $builder->where($model->getTable().'.pondok_id', $pondokId);
        }
    }
}
