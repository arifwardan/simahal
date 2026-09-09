<?php

namespace Database\Factories;

use App\Models\MutabaahSetting;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MutabaahSetting>
 */
class MutabaahSettingFactory extends Factory
{
    public function definition(): array
    {
        return [
            'konversi_juz_halaman' => 20,
            'ambang_hadiah_juz' => 1.5,
            'tahun_aktif' => 2026,
            'pondok_id' => PondokFactory::shared(),
        ];
    }
}
