<?php

use App\Models\Muhafidz;
use App\Models\Mutabaah;
use App\Models\Santri;
use App\Models\Surah;
use Database\Seeders\SurahSeeder;

beforeEach(function (): void {
    $this->seed(SurahSeeder::class);
});

it('builds range summary for consecutive surahs', function (): void {
    $santri = Santri::factory()->create();
    $muhafidz = Muhafidz::factory()->create();
    $m = Mutabaah::factory()->create(['santri_id' => $santri->id, 'muhafidz_id' => $muhafidz->id]);
    $m->details()->create(['surah_id' => Surah::where('nomor', 112)->first()->id, 'baris' => 4]);
    $m->details()->create(['surah_id' => Surah::where('nomor', 113)->first()->id, 'baris' => 5]);
    $m->details()->create(['surah_id' => Surah::where('nomor', 114)->first()->id, 'baris' => 6]);

    expect($m->fresh()->buildSurahSummary())->toBe('Al-Ikhlas – An-Nas');
    expect($m->fresh()->details()->sum('baris'))->toBe(15);
});

it('builds joined summary for non-consecutive surahs', function (): void {
    $santri = Santri::factory()->create();
    $muhafidz = Muhafidz::factory()->create();
    $m = Mutabaah::factory()->create(['santri_id' => $santri->id, 'muhafidz_id' => $muhafidz->id]);
    $m->details()->create(['surah_id' => Surah::where('nomor', 1)->first()->id, 'baris' => 3]);
    $m->details()->create(['surah_id' => Surah::where('nomor', 36)->first()->id, 'baris' => 3]);

    expect($m->fresh()->buildSurahSummary())->toBe('Al-Fatihah, Yasin');
});
