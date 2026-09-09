<?php

namespace Database\Factories;

use App\Enums\SantriStatus;
use App\Enums\UserRole;
use App\Models\Pondok;
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
            'jenis' => null,
            'halaman_awal' => null,
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
