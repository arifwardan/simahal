<?php

namespace App\Http\Requests\Ustadz;

use App\Enums\MutabaahJenis;
use App\Enums\MutabaahStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreMutabaahRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'santri_id' => ['required', 'exists:santris,id'],
            'tanggal' => ['required', 'date'],
            'jenis' => ['required', new Enum(MutabaahJenis::class)],
            'surah' => ['required', 'string', 'max:100'],
            'ayat_mulai' => ['required', 'integer', 'min:1'],
            'ayat_selesai' => ['required', 'integer', 'gte:ayat_mulai'],
            'nilai' => ['nullable', 'integer', 'between:0,100'],
            'status' => ['required', new Enum(MutabaahStatus::class)],
            'catatan' => ['nullable', 'string', 'max:1000'],
            'halaman' => ['required', 'integer', 'min:1'],
        ];
    }
}
