<?php

namespace App\Http\Requests\Admin\Santri;

use App\Enums\SantriStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

class UpdateSantriRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $santri = $this->route('santri');
        $user = $santri->user;

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', $user ? Rule::unique('users', 'email')->ignore($user->id) : 'unique:users,email'],
            'nis' => ['nullable', 'string', 'max:50', Rule::unique('santris', 'nis')->ignore($santri->id)],
            'tanggal_lahir' => ['nullable', 'date'],
            'status' => ['required', new Enum(SantriStatus::class)],
            'orang_tua_id' => ['nullable', 'exists:orang_tuas,id'],
        ];
    }
}
