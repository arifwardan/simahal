<?php

namespace Database\Factories;

use App\Enums\SantriStatus;
use App\Enums\UserRole;
use App\Models\Santri;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Santri>
 */
class SantriFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->role(UserRole::Santri),
            'orang_tua_id' => null,
            'nis' => (string) fake()->unique()->numberBetween(100000, 999999),
            'nama' => fake()->name(),
            'tanggal_lahir' => fake()->date(),
            'status' => SantriStatus::Aktif,
        ];
    }
}
