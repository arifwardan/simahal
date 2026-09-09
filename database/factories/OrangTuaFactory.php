<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\OrangTua;
use App\Models\Pondok;
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
            // Adopt the linked user's pondok so factory graphs stay within one pondok.
            'pondok_id' => function (array $attributes) {
                $userId = $attributes['user_id'] ?? null;

                if (is_numeric($userId)) {
                    $pondokId = User::whereKey($userId)->value('pondok_id');

                    if ($pondokId !== null) {
                        return $pondokId;
                    }
                }

                return PondokFactory::shared();
            },
        ];
    }
}
