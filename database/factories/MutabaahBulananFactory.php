<?php

namespace Database\Factories;

use App\Models\MutabaahBulanan;
use App\Models\Santri;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MutabaahBulanan>
 */
class MutabaahBulananFactory extends Factory
{
    public function definition(): array
    {
        return [
            'santri_id' => Santri::factory(),
            'tahun' => 2026,
            'bulan' => 1,
            'halaman_awal_bulan' => null,
            'halaman_kumulatif' => null,
            'juz_dihafal' => null,
            'tasmi_pekan_1' => null,
            'tasmi_pekan_2' => null,
            'tasmi_pekan_3' => null,
            'tasmi_pekan_4' => null,
            'tasmi_pekan_5' => null,
            'ujian_bulanan' => null,
            'catatan_tasmi' => null,
            'catatan_ujian' => null,
        ];
    }
}
