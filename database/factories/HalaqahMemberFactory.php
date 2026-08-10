<?php

namespace Database\Factories;

use App\Enums\HalaqahMemberStatus;
use App\Models\Halaqah;
use App\Models\HalaqahMember;
use App\Models\Santri;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<HalaqahMember>
 */
class HalaqahMemberFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'halaqah_id' => Halaqah::factory(),
            'santri_id' => Santri::factory(),
            'joined_at' => now(),
            'status' => HalaqahMemberStatus::Aktif,
        ];
    }
}
