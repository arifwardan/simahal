<?php

use App\Actions\Mutabaah\RecalculateTargetProgress;
use App\Enums\MutabaahJenis;
use App\Enums\MutabaahStatus;
use App\Enums\TargetHafalanStatus;
use App\Models\Mutabaah;
use App\Models\Santri;
use App\Models\TargetHafalan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(RefreshDatabase::class, TestCase::class);

test('progress sums ayat spans of lulus setoran mutabaah', function () {
    $santri = Santri::factory()->create();
    $target = TargetHafalan::factory()->create([
        'santri_id' => $santri->id,
        'target' => 10,
        'progress' => 0,
    ]);

    Mutabaah::factory()->create([
        'santri_id' => $santri->id,
        'tanggal' => '2024-05-13',
        'jenis' => MutabaahJenis::Setoran,
        'status' => MutabaahStatus::Lulus,
        'ayat_mulai' => 1,
        'ayat_selesai' => 7,
        'halaman' => 7,
    ]);
    Mutabaah::factory()->create([
        'santri_id' => $santri->id,
        'tanggal' => '2024-05-14',
        'jenis' => MutabaahJenis::Setoran,
        'status' => MutabaahStatus::Lulus,
        'ayat_mulai' => 8,
        'ayat_selesai' => 15,
        'halaman' => 8,
    ]);

    RecalculateTargetProgress::run($santri);

    expect($target->fresh()->progress)->toBe(15);
});

test('progress percent uses halaman', function () {
    $target = TargetHafalan::factory()->create(['target' => 6, 'progress' => 60]);

    expect($target->progressPercent())->toBe(50);
});

test('non-lulus and murajaah mutabaah are excluded', function () {
    $santri = Santri::factory()->create();
    $target = TargetHafalan::factory()->create([
        'santri_id' => $santri->id,
        'target' => 100,
        'progress' => 0,
    ]);

    Mutabaah::factory()->create([
        'santri_id' => $santri->id,
        'tanggal' => '2024-05-13',
        'jenis' => MutabaahJenis::Setoran,
        'status' => MutabaahStatus::Mengulang,
        'ayat_mulai' => 1,
        'ayat_selesai' => 10,
    ]);
    Mutabaah::factory()->create([
        'santri_id' => $santri->id,
        'tanggal' => '2024-05-14',
        'jenis' => MutabaahJenis::Murajaah,
        'status' => MutabaahStatus::Lulus,
        'ayat_mulai' => 1,
        'ayat_selesai' => 20,
    ]);

    RecalculateTargetProgress::run($santri);

    expect($target->fresh()->progress)->toBe(0);
});

test('progress is capped at target', function () {
    $santri = Santri::factory()->create();
    $target = TargetHafalan::factory()->create([
        'santri_id' => $santri->id,
        'target' => 10,
        'progress' => 0,
    ]);

    Mutabaah::factory()->create([
        'santri_id' => $santri->id,
        'tanggal' => '2026-07-03',
        'jenis' => MutabaahJenis::Setoran,
        'status' => MutabaahStatus::Lulus,
        'ayat_mulai' => 1,
        'ayat_selesai' => 30,
        'halaman' => 150,
    ]);
    Mutabaah::factory()->create([
        'santri_id' => $santri->id,
        'tanggal' => '2026-07-04',
        'jenis' => MutabaahJenis::Setoran,
        'status' => MutabaahStatus::Lulus,
        'ayat_mulai' => 31,
        'ayat_selesai' => 60,
        'halaman' => 100,
    ]);

    RecalculateTargetProgress::run($santri);

    expect($target->fresh()->progress)->toBe(200);
});

test('santri with no berlangsung target does nothing', function () {
    $santri = Santri::factory()->create();
    TargetHafalan::factory()->create([
        'santri_id' => $santri->id,
        'status' => TargetHafalanStatus::Selesai,
    ]);

    RecalculateTargetProgress::run($santri);

    expect($santri->fresh()->targetHafalans->first()->progress)->toBe(0);
});
