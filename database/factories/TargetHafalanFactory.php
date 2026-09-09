<?php

namespace Database\Factories;

use App\Enums\TargetHafalanStatus;
use App\Models\Pondok;
use App\Models\Santri;
use App\Models\TargetHafalan;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TargetHafalan>
 */
class TargetHafalanFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'santri_id' => Santri::factory(),
            'periode' => now()->year.'-'.(now()->year + 1),
            'target' => fake()->numberBetween(5, 30),
            'progress' => 0,
            'status' => TargetHafalanStatus::Berlangsung,
            // Adopt the linked santri's pondok so factory graphs stay within one pondok.
            'pondok_id' => function (array $attributes) {
                $santriId = $attributes['santri_id'] ?? null;

                if (is_numeric($santriId)) {
                    $pondokId = Santri::withoutGlobalScope('pondok')->whereKey($santriId)->value('pondok_id');

                    if ($pondokId !== null) {
                        return $pondokId;
                    }
                }

                return PondokFactory::shared();
            },
        ];
    }
}
