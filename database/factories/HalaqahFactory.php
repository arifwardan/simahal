<?php

namespace Database\Factories;

use App\Enums\HalaqahStatus;
use App\Models\Halaqah;
use App\Models\Muhafidz;
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
            'muhafidz_id' => Muhafidz::factory(),
            'jadwal' => fake()->sentence(3),
            'jam_mulai' => '07:00',
            'jam_selesai' => '08:00',
            'status' => HalaqahStatus::Aktif,
        ];
    }
}
