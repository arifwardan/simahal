<?php

namespace App\Http\Requests\Admin\Santri;

use App\Enums\SantriJenis;
use App\Enums\SantriStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;
use Illuminate\Validation\Rules\Password;

class StoreSantriRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', Password::min(8)],
            'nis' => ['nullable', 'string', 'max:50', 'unique:santris,nis'],
            'tanggal_lahir' => ['nullable', 'date'],
            'status' => ['required', new Enum(SantriStatus::class)],
            'orang_tua_id' => ['nullable', 'exists:orang_tuas,id'],
            'halaman_awal' => ['nullable', 'integer', 'min:0'],
            'jenis' => ['nullable', new Enum(SantriJenis::class)],
        ];
    }
}
