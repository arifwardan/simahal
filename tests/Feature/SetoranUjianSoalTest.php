<?php

use App\Models\Halaqah;
use App\Models\HalaqahMember;
use App\Models\Muhafidz;
use App\Models\Mutabaah;
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

it('stores harian baris and 3 correct soal as total 60', function (): void {
    $muhafidz = Muhafidz::factory()->create();
    $user = $muhafidz->user;
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create();
    HalaqahMember::factory()->create(['halaqah_id' => $halaqah->id, 'santri_id' => $santri->id]);

    $this->actingAs($user)->post(route('muhafidz.setoran.store'), [
        'halaqah_id' => $halaqah->id,
        'santri_id' => $santri->id,
        'minggu' => '2026-09-07',
        'harian' => ['senin' => 3, 'selasa' => 4, 'rabu' => null, 'kamis' => null, 'jumat' => null, 'sabtu' => null, 'ahad' => null],
        'ujian_soal' => [true, true, false, true, false],
    ])->assertRedirect();

    $mb = MutabaahBulanan::where('santri_id', $santri->id)->where('tahun', 2026)->where('bulan', 9)->first();
    expect($mb->ujian_bulanan)->toBe(60);
    expect((int) Mutabaah::where('santri_id', $santri->id)->whereDate('tanggal', '2026-09-08')->first()->halaman)->toBe(4);
});

it('rejects harian above 30 baris', function (): void {
    $muhafidz = Muhafidz::factory()->create();
    $user = $muhafidz->user;
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create();
    HalaqahMember::factory()->create(['halaqah_id' => $halaqah->id, 'santri_id' => $santri->id]);

    $this->actingAs($user)->post(route('muhafidz.setoran.store'), [
        'halaqah_id' => $halaqah->id,
        'santri_id' => $santri->id,
        'minggu' => '2026-09-07',
        'harian' => ['senin' => 31, 'selasa' => null, 'rabu' => null, 'kamis' => null, 'jumat' => null, 'sabtu' => null, 'ahad' => null],
    ])->assertSessionHasErrors('harian.senin');
});
