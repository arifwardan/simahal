<?php

use App\Models\MutabaahBulanan;
use App\Models\Santri;

it('caches ujian total from 5 soal booleans', function (): void {
    $santri = Santri::factory()->create();
    $mb = MutabaahBulanan::factory()->create([
        'santri_id' => $santri->id,
        'ujian_soal_1' => true,
        'ujian_soal_2' => true,
        'ujian_soal_3' => false,
        'ujian_soal_4' => true,
        'ujian_soal_5' => null,
    ]);

    expect($mb->ujianTotal())->toBe(60);
});
