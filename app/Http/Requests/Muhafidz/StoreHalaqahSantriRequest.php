<?php

namespace App\Http\Requests\Muhafidz;

use App\Models\Halaqah;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreHalaqahSantriRequest extends FormRequest
{
    public function authorize(): bool
    {
        $halaqah = $this->route('halaqah');

        if ($halaqah instanceof Halaqah) {
            return $this->user()?->muhafidz?->id === $halaqah->muhafidz_id;
        }

        return false;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'santri_id' => ['required', 'integer', 'exists:santris,id'],
        ];
    }
}
