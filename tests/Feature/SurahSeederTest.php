<?php

use App\Models\Surah;
use Database\Seeders\SurahSeeder;

beforeEach(function (): void {
    $this->seed(SurahSeeder::class);
});

it('seeds 114 surahs with complete data', function (): void {
    expect(Surah::count())->toBe(114);
    expect(Surah::where('nomor', 1)->first()->nama_latin)->toBe('Al-Fatihah');
    expect(Surah::where('nomor', 114)->first()->nama_latin)->toBe('An-Nas');
    expect(Surah::where('nomor', 2)->first()->jumlah_ayat)->toBe(286);
    expect(Surah::where('nomor', 112)->first()->toArray())->toMatchArray([
        'nama_latin' => 'Al-Ikhlas', 'jumlah_ayat' => 4, 'juz' => 30,
    ]);
});
