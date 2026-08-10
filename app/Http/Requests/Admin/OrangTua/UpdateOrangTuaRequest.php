<?php

namespace App\Http\Requests\Admin\OrangTua;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOrangTuaRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $orangTua = $this->route('orangTua');
        $user = $orangTua->user;

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', $user ? Rule::unique('users', 'email')->ignore($user->id) : 'unique:users,email'],
            'kontak' => ['nullable', 'string', 'max:50'],
        ];
    }
}
