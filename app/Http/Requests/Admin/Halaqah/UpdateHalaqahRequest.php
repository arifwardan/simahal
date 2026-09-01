<?php

namespace App\Http\Requests\Admin\Halaqah;

use App\Enums\HalaqahStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdateHalaqahRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'nama' => ['required', 'string', 'max:255'],
            'muhafidz_id' => ['required', 'exists:muhafidzs,id'],
            'jam_mulai' => ['required', 'string', 'date_format:H:i'],
            'jam_selesai' => ['required', 'string', 'date_format:H:i', 'after:jam_mulai'],
            'status' => ['required', new Enum(HalaqahStatus::class)],
        ];
    }
}
