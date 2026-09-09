<?php

namespace Database\Factories;

use App\Models\MutabaahBulanan;
use App\Models\Pondok;
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
            // Adopt the linked santri's pondok so factory graphs stay within one pondok.
            'pondok_id' => function (array $attributes) {
                $santriId = $attributes['santri_id'] ?? null;

                if (is_numeric($santriId)) {
                    $pondokId = Santri::withoutGlobalScope('pondok')->whereKey($santriId)->value('pondok_id');

                    if ($pondokId !== null) {
                        return $pondokId;
                    }
                }

                return PondokFactory::shared();
            },
        ];
    }
}
