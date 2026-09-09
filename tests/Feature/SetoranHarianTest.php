<?php

use App\Models\Halaqah;
use App\Models\HalaqahMember;
use App\Models\Muhafidz;
use App\Models\Mutabaah;
use App\Models\Santri;
use App\Models\Surah;
use Database\Seeders\SurahSeeder;

beforeEach(function (): void {
    $this->seed(SurahSeeder::class);
});

it('stores one day with 3 surahs and server-computed total', function (): void {
    $muhafidz = Muhafidz::factory()->create();
    $user = $muhafidz->user;
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create();
    HalaqahMember::factory()->create(['halaqah_id' => $halaqah->id, 'santri_id' => $santri->id]);
    $ids = Surah::whereIn('nomor', [112, 113, 114])->orderBy('nomor')->pluck('id')->all();

    $this->actingAs($user)->post(route('muhafidz.setoran-harian.store'), [
        'santri_id' => $santri->id,
        'tanggal' => '2026-09-09',
        'details' => [
            ['surah_id' => $ids[0], 'baris' => 4],
            ['surah_id' => $ids[1], 'baris' => 5],
            ['surah_id' => $ids[2], 'baris' => 6],
        ],
    ])->assertRedirect();

    $m = Mutabaah::where('santri_id', $santri->id)->whereDate('tanggal', '2026-09-09')->first();
    expect($m->halaman)->toBe(15);
    expect($m->surah)->toBe('Al-Ikhlas – An-Nas');
    expect($m->details()->count())->toBe(3);
});

it('rejects duplicate surah in one day', function (): void {
    $muhafidz = Muhafidz::factory()->create();
    $user = $muhafidz->user;
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create();
    HalaqahMember::factory()->create(['halaqah_id' => $halaqah->id, 'santri_id' => $santri->id]);
    $id = Surah::where('nomor', 112)->first()->id;

    $this->actingAs($user)->post(route('muhafidz.setoran-harian.store'), [
        'santri_id' => $santri->id,
        'tanggal' => '2026-09-09',
        'details' => [
            ['surah_id' => $id, 'baris' => 4],
            ['surah_id' => $id, 'baris' => 5],
        ],
    ])->assertSessionHasErrors('details.1.surah_id');
});

it('rejects future date', function (): void {
    $muhafidz = Muhafidz::factory()->create();
    $user = $muhafidz->user;
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create();
    HalaqahMember::factory()->create(['halaqah_id' => $halaqah->id, 'santri_id' => $santri->id]);
    $id = Surah::where('nomor', 112)->first()->id;

    $this->actingAs($user)->post(route('muhafidz.setoran-harian.store'), [
        'santri_id' => $santri->id,
        'tanggal' => now()->addDay()->toDateString(),
        'details' => [['surah_id' => $id, 'baris' => 4]],
    ])->assertSessionHasErrors('tanggal');
});

it('deletes the day when details are emptied', function (): void {
    $muhafidz = Muhafidz::factory()->create();
    $user = $muhafidz->user;
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create();
    HalaqahMember::factory()->create(['halaqah_id' => $halaqah->id, 'santri_id' => $santri->id]);
    $id = Surah::where('nomor', 112)->first()->id;

    $this->actingAs($user)->post(route('muhafidz.setoran-harian.store'), [
        'santri_id' => $santri->id,
        'tanggal' => '2026-09-09',
        'details' => [['surah_id' => $id, 'baris' => 4]],
    ])->assertRedirect();

    $this->actingAs($user)->post(route('muhafidz.setoran-harian.store'), [
        'santri_id' => $santri->id,
        'tanggal' => '2026-09-09',
        'details' => [],
    ])->assertRedirect();

    expect(Mutabaah::where('santri_id', $santri->id)->whereDate('tanggal', '2026-09-09')->exists())->toBeFalse();
});
