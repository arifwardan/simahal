<?php

namespace App\Http\Requests\Admin\MutabaahSetting;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;

class UpdateMutabaahSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === UserRole::Admin;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'konversi_juz_halaman' => ['required', 'integer', 'min:1'],
            'ambang_hadiah_juz' => ['required', 'numeric', 'min:0'],
            'tahun_aktif' => ['required', 'integer', 'min:2000', 'max:2100'],
        ];
    }
}
