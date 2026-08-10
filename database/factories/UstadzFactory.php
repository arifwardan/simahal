<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\User;
use App\Models\Ustadz;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Ustadz>
 */
class UstadzFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->role(UserRole::Ustadz),
            'nama' => fake()->name(),
            'kontak' => fake()->phoneNumber(),
        ];
    }
}
