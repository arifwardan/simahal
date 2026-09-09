<?php

namespace Database\Factories;

use App\Models\Pondok;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Pondok>
 */
class PondokFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nama_yayasan' => fake()->unique()->company().' Pondok',
            'slug' => fake()->unique()->slug(2),
            'logo_path' => null,
        ];
    }

    /**
     * Reuse the first pondok when one exists so factory graphs built without
     * an explicit pondok_id stay within a single pondok (test coherence).
     * Explicit pondok_id overrides always win over this default.
     */
    public static function shared(): Pondok|static
    {
        return Pondok::first() ?? Pondok::factory();
    }
}
