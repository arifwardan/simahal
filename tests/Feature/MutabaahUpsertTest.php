<?php

use App\Models\Muhafidz;
use App\Models\Mutabaah;
use App\Models\Santri;
use Illuminate\Support\Facades\Schema;

it('upserts 7 hari distinct', function (): void {
    $santri = Santri::factory()->create();
    $muhafidz = Muhafidz::factory()->create();

    $first = Mutabaah::updateOrCreate(['santri_id' => $santri->id, 'tanggal' => '2024-05-13'], ['halaman' => 5, 'muhafidz_id' => $muhafidz->id, 'surah' => 'Al-Baqarah', 'ayat_mulai' => 1, 'ayat_selesai' => 5]);
    Mutabaah::updateOrCreate(['santri_id' => $santri->id, 'tanggal' => $first->tanggal], ['halaman' => 7, 'muhafidz_id' => $muhafidz->id, 'surah' => 'Al-Baqarah', 'ayat_mulai' => 1, 'ayat_selesai' => 10]);

    expect(Mutabaah::where('santri_id', $santri->id)->count())->toBe(1);
    expect(Mutabaah::first()->halaman)->toBe(7);
});

it('has unique index on santri_id and tanggal', function (): void {
    $indexes = collect(Schema::getIndexes('mutabaahs'));
    $hasUnique = $indexes->contains(function ($index): bool {
        $cols = $index['columns'] ?? $index['columns'] ?? [];
        // Schema::getIndexes returns ['name','columns','type','unique']
        $columns = $index['columns'] ?? [];
        sort($columns);

        return $columns === ['santri_id', 'tanggal'] && ($index['unique'] ?? false) === true;
    });

    expect($hasUnique)->toBeTrue();
});

it('prevents duplicate santri tanggal via database constraint', function (): void {
    $santri = Santri::factory()->create();
    $muhafidz = Muhafidz::factory()->create();

    Mutabaah::factory()->create(['santri_id' => $santri->id, 'tanggal' => '2024-05-13', 'muhafidz_id' => $muhafidz->id]);

    expect(fn () => Mutabaah::factory()->create(['santri_id' => $santri->id, 'tanggal' => '2024-05-13', 'muhafidz_id' => $muhafidz->id]))->toThrow(Exception::class);
});
