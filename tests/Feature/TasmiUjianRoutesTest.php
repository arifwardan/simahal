<?php

use App\Models\Halaqah;
use App\Models\HalaqahMember;
use App\Models\Muhafidz;
use App\Models\MutabaahBulanan;
use App\Models\Santri;

beforeEach(function (): void {
    $this->withoutVite();
});

it('stores tasmi for the active pekan only', function (): void {
    $muhafidz = Muhafidz::factory()->create();
    $user = $muhafidz->user;
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create();
    HalaqahMember::factory()->create(['halaqah_id' => $halaqah->id, 'santri_id' => $santri->id]);

    $this->actingAs($user)->post(route('muhafidz.tasmi.store'), [
        'santri_id' => $santri->id,
        'minggu' => '2026-09-07',
        'tasmi_pekan' => 85,
        'catatan_tasmi' => 'lancar',
    ])->assertRedirect();

    $mb = MutabaahBulanan::where('santri_id', $santri->id)->where('tahun', 2026)->where('bulan', 9)->first();
    // 2026-09-07 is a Monday, day 7 -> intdiv(7-1,7)+1 = 1 (not 2)
    expect($mb->tasmi_pekan_1)->toBe(85);
    expect($mb->tasmi_pekan_2)->toBeNull();
    expect($mb->catatan_tasmi)->toBe('lancar');
});

it('stores 5 soal ujian with cached total', function (): void {
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
        'catatan_ujian' => 'baik',
    ])->assertRedirect();

    $mb = MutabaahBulanan::where('santri_id', $santri->id)->where('tahun', 2026)->where('bulan', 9)->first();
    expect($mb->ujian_bulanan)->toBe(60);
    expect($mb->catatan_ujian)->toBe('baik');
});

it('rejects tasmi outside 10-100 range', function (): void {
    $muhafidz = Muhafidz::factory()->create();
    $user = $muhafidz->user;
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create();
    HalaqahMember::factory()->create(['halaqah_id' => $halaqah->id, 'santri_id' => $santri->id]);

    $this->actingAs($user)->post(route('muhafidz.tasmi.store'), [
        'santri_id' => $santri->id,
        'minggu' => '2026-09-07',
        'tasmi_pekan' => 200,
    ])->assertSessionHasErrors('tasmi_pekan');
});

it('rejects tasmi and ujian for santri outside own halaqah', function (): void {
    $muhafidz = Muhafidz::factory()->create();
    $other = Muhafidz::factory()->create();
    $user = $muhafidz->user;
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $other->id]);
    $santri = Santri::factory()->create();
    HalaqahMember::factory()->create(['halaqah_id' => $halaqah->id, 'santri_id' => $santri->id]);

    $this->actingAs($user)->post(route('muhafidz.tasmi.store'), [
        'santri_id' => $santri->id,
        'minggu' => '2026-09-07',
        'tasmi_pekan' => 80,
    ])->assertSessionHasErrors('santri_id');

    $this->actingAs($user)->post(route('muhafidz.ujian.store'), [
        'santri_id' => $santri->id,
        'tahun' => 2026,
        'bulan' => 9,
        'ujian_soal' => [true, true, true, true, true],
    ])->assertSessionHasErrors('santri_id');
});

it('legacy 5-panel routes are gone', function (): void {
    $muhafidz = Muhafidz::factory()->create();
    $this->actingAs($muhafidz->user)->get('/muhafidz/halaqahs/1/setoran')->assertNotFound();
});
