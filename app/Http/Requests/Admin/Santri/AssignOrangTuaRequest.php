<?php

namespace App\Http\Requests\Admin\Santri;

use Illuminate\Foundation\Http\FormRequest;

class AssignOrangTuaRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if ($this->input('orang_tua_id') === '' || $this->input('orang_tua_id') === '__none__') {
            $this->merge(['orang_tua_id' => null]);
        }
    }

    public function authorize(): bool
    {
        return $this->user()?->role?->value === 'admin';
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'orang_tua_id' => ['nullable', 'exists:orang_tuas,id'],
        ];
    }
}
