<?php

namespace Database\Factories;

use App\Enums\MutabaahJenis;
use App\Enums\MutabaahStatus;
use App\Models\Muhafidz;
use App\Models\Mutabaah;
use App\Models\Santri;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Mutabaah>
 */
class MutabaahFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $mulai = fake()->numberBetween(1, 250);

        return [
            'santri_id' => Santri::factory(),
            'muhafidz_id' => Muhafidz::factory(),
            'tanggal' => now(),
            'jenis' => MutabaahJenis::Setoran,
            'surah' => 'Al-Baqarah',
            'ayat_mulai' => $mulai,
            'ayat_selesai' => $mulai + fake()->numberBetween(1, 20),
            'nilai' => fake()->numberBetween(60, 100),
            'status' => MutabaahStatus::Lulus,
            'catatan' => null,
            'halaman' => fake()->numberBetween(1, 10),
        ];
    }
}
