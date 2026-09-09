<?php

namespace App\Http\Requests\Muhafidz;

use App\Models\HalaqahMember;
use Illuminate\Foundation\Http\FormRequest;

class StoreSetoranHarianRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && $user->muhafidz !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'santri_id' => [
                'required',
                'exists:santris,id',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    $muhafidzId = $this->user()->muhafidz->id;
                    $belongs = HalaqahMember::where('santri_id', $value)
                        ->whereHas('halaqah', fn ($q) => $q->where('muhafidz_id', $muhafidzId))
                        ->exists();

                    if (! $belongs) {
                        $fail('Santri tidak terdaftar di halaqah Anda.');
                    }
                },
            ],
            'tanggal' => ['required', 'date', 'before_or_equal:today'],
            'details' => ['present', 'array'],
            'details.*.surah_id' => ['required', 'integer', 'exists:surahs,id', 'distinct'],
            'details.*.baris' => ['required', 'integer', 'min:1', 'max:30'],
        ];
    }
}
