<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\OrangTua;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OrangTua>
 */
class OrangTuaFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->role(UserRole::OrangTua),
            'nama' => fake()->name(),
            'kontak' => fake()->phoneNumber(),
        ];
    }
}
