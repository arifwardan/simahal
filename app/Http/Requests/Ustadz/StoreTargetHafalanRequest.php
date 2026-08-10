<?php

namespace App\Http\Requests\Ustadz;

use App\Enums\TargetHafalanStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreTargetHafalanRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'santri_id' => ['required', 'exists:santris,id'],
            'periode' => ['required', 'string', 'max:50'],
            'target' => ['required', 'integer', 'min:1'],
            'status' => ['required', new Enum(TargetHafalanStatus::class)],
        ];
    }
}
