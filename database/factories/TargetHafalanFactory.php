<?php

namespace Database\Factories;

use App\Enums\TargetHafalanStatus;
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
        ];
    }
}
