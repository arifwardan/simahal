<?php

namespace Database\Factories;

use App\Enums\MutabaahJenis;
use App\Enums\MutabaahStatus;
use App\Models\Muhafidz;
use App\Models\Mutabaah;
use App\Models\Pondok;
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
            'tanggal' => fake()->dateTimeBetween('-90 days', 'now')->format('Y-m-d'),
            'jenis' => MutabaahJenis::Setoran,
            'surah' => 'Al-Baqarah',
            'ayat_mulai' => $mulai,
            'ayat_selesai' => $mulai + fake()->numberBetween(1, 20),
            'nilai' => fake()->numberBetween(60, 100),
            'status' => MutabaahStatus::Lulus,
            'catatan' => null,
            'halaman' => fake()->numberBetween(1, 10),
            // Adopt the linked muhafidz's (then santri's) pondok so factory graphs stay coherent.
            'pondok_id' => function (array $attributes) {
                foreach ([
                    [Muhafidz::class, $attributes['muhafidz_id'] ?? null],
                    [Santri::class, $attributes['santri_id'] ?? null],
                ] as [$model, $key]) {
                    if (is_numeric($key)) {
                        $pondokId = $model::withoutGlobalScope('pondok')->whereKey($key)->value('pondok_id');

                        if ($pondokId !== null) {
                            return $pondokId;
                        }
                    }
                }

                return PondokFactory::shared();
            },
        ];
    }
}
