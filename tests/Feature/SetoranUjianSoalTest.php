<?php

use App\Models\Halaqah;
use App\Models\HalaqahMember;
use App\Models\Muhafidz;
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

it('stores 3 correct soal as total 60 via ujian route', function (): void {
    $muhafidz = Muhafidz::factory()->create();
    $user = $muhafidz->user;
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create();
    HalaqahMember::factory()->create(['halaqah_id' => $halaqah->id, 'santri_id' => $santri->id]);

    $this->actingAs($user)->post(route('muhafidz.ujian.store'), [
        'santri_id' => $santri->id,
        'tahun' => 2026,
        'bulan' => 9,
        'ujian_soal' => [true, true, false, true, false],
    ])->assertRedirect();

    $mb = MutabaahBulanan::where('santri_id', $santri->id)->where('tahun', 2026)->where('bulan', 9)->first();
    expect($mb->ujian_bulanan)->toBe(60);
});

it('rejects ujian_soal with wrong size', function (): void {
    $muhafidz = Muhafidz::factory()->create();
    $user = $muhafidz->user;
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create();
    HalaqahMember::factory()->create(['halaqah_id' => $halaqah->id, 'santri_id' => $santri->id]);

    $this->actingAs($user)->post(route('muhafidz.ujian.store'), [
        'santri_id' => $santri->id,
        'tahun' => 2026,
        'bulan' => 9,
        'ujian_soal' => [true, true, true],
    ])->assertSessionHasErrors('ujian_soal');
});
