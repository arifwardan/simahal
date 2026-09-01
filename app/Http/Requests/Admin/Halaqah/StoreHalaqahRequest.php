<?php

namespace App\Http\Requests\Admin\Halaqah;

use App\Enums\HalaqahStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreHalaqahRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'nama' => ['required', 'string', 'max:255'],
            'muhafidz_id' => ['nullable', 'required_without:muhafidz_ids', 'exists:muhafidzs,id'],
            'muhafidz_ids' => ['nullable', 'required_without:muhafidz_id', 'array', 'min:1'],
            'muhafidz_ids.*' => ['integer', 'exists:muhafidzs,id'],
            'jam_mulai' => ['required', 'string', 'date_format:H:i'],
            'jam_selesai' => ['required', 'string', 'date_format:H:i', 'after:jam_mulai'],
            'status' => ['required', new Enum(HalaqahStatus::class)],
        ];
    }
}
