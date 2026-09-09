<?php

namespace App\Http\Requests\Santri;

use App\Enums\TargetHafalanStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreTargetHafalanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->santri !== null;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'periode' => ['required', 'string', 'max:50'],
            'target' => ['required', 'integer', 'min:1', 'max:30'],
            'status' => ['required', new Enum(TargetHafalanStatus::class)],
        ];
    }
}
