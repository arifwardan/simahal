<?php

namespace App\Http\Requests\Muhafidz;

use App\Models\Halaqah;
use App\Models\HalaqahMember;
use Illuminate\Foundation\Http\FormRequest;

class StoreSetoranRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if ($user === null || $user->muhafidz === null) {
            return false;
        }

        $halaqahId = $this->input('halaqah_id');

        if ($halaqahId === null || $halaqahId === '') {
            return true;
        }

        $halaqah = Halaqah::find($halaqahId);

        if ($halaqah === null) {
            return true;
        }

        return (int) $halaqah->muhafidz_id === (int) $user->muhafidz->id;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'halaqah_id' => ['required', 'exists:halaqahs,id'],
            'santri_id' => [
                'required',
                'exists:santris,id',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    $halaqahId = $this->input('halaqah_id');

                    if ($halaqahId === null || $value === null) {
                        return;
                    }

                    $exists = HalaqahMember::where('halaqah_id', $halaqahId)
                        ->where('santri_id', $value)
                        ->exists();

                    if (! $exists) {
                        $fail('Santri tidak terdaftar di halaqah ini.');
                    }
                },
            ],
            'minggu' => ['required', 'date', 'before_or_equal:today'],
            'harian' => ['nullable', 'array'],
            'harian.senin' => ['nullable', 'integer', 'min:0', 'max:30'],
            'harian.selasa' => ['nullable', 'integer', 'min:0', 'max:30'],
            'harian.rabu' => ['nullable', 'integer', 'min:0', 'max:30'],
            'harian.kamis' => ['nullable', 'integer', 'min:0', 'max:30'],
            'harian.jumat' => ['nullable', 'integer', 'min:0', 'max:30'],
            'harian.sabtu' => ['nullable', 'integer', 'min:0', 'max:30'],
            'harian.ahad' => ['nullable', 'integer', 'min:0', 'max:30'],
            'harian.*' => ['nullable', 'integer', 'min:0', 'max:30'],
            'tasmi_pekan' => ['nullable', 'integer', 'min:10', 'max:100'],
            'ujian_bulanan' => ['nullable', 'integer', 'min:1', 'max:100'],
            'ujian_soal' => ['nullable', 'array', 'size:5'],
            'ujian_soal.*' => ['nullable', 'boolean'],
            'catatan_tasmi' => ['nullable', 'string', 'max:1000'],
            'catatan_ujian' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
