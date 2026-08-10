<?php

namespace App\Http\Requests\Admin\Halaqah;

use App\Enums\HalaqahStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdateHalaqahRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'nama' => ['required', 'string', 'max:255'],
            'ustadz_id' => ['required', 'exists:ustadzs,id'],
            'jadwal' => ['nullable', 'string', 'max:255'],
            'status' => ['required', new Enum(HalaqahStatus::class)],
            'santri_ids' => ['nullable', 'array'],
            'santri_ids.*' => ['integer', 'exists:santris,id'],
        ];
    }
}
