<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\Muhafidz;
use App\Models\Pondok;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Muhafidz>
 */
class MuhafidzFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->role(UserRole::Muhafidz),
            'nama' => fake()->name(),
            'kontak' => fake()->phoneNumber(),
            // Adopt the linked user's pondok so factory graphs stay within one pondok.
            // Runs after user_id is resolved; explicit pondok_id overrides still win.
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
