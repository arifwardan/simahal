<?php

namespace Database\Factories;

use App\Enums\HalaqahStatus;
use App\Models\Halaqah;
use App\Models\Ustadz;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Halaqah>
 */
class HalaqahFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nama' => 'Halaqah '.fake()->word(),
            'ustadz_id' => Ustadz::factory(),
            'jadwal' => fake()->sentence(3),
            'status' => HalaqahStatus::Aktif,
        ];
    }
}
