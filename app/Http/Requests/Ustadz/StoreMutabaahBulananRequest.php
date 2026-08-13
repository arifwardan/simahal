<?php

namespace App\Http\Requests\Ustadz;

use Illuminate\Foundation\Http\FormRequest;

class StoreMutabaahBulananRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->ustadz !== null;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'santri_id' => ['required', 'exists:santris,id'],
            'halaman_kumulatif' => ['required', 'integer', 'min:0'],
            'juz_dihafal' => ['nullable', 'string', 'max:100'],
            'tasmi_pekan_1' => ['nullable', 'integer', 'between:10,100'],
            'tasmi_pekan_2' => ['nullable', 'integer', 'between:10,100'],
            'tasmi_pekan_3' => ['nullable', 'integer', 'between:10,100'],
            'tasmi_pekan_4' => ['nullable', 'integer', 'between:10,100'],
            'tasmi_pekan_5' => ['nullable', 'integer', 'between:10,100'],
            'ujian_soal_1' => ['nullable', 'integer', 'between:10,100'],
            'ujian_soal_2' => ['nullable', 'integer', 'between:10,100'],
            'ujian_soal_3' => ['nullable', 'integer', 'between:10,100'],
            'ujian_soal_4' => ['nullable', 'integer', 'between:10,100'],
            'ujian_soal_5' => ['nullable', 'integer', 'between:10,100'],
        ];
    }
}
