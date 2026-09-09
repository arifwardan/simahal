<?php

use App\Enums\HalaqahStatus;
use App\Enums\SantriStatus;
use App\Enums\TargetHafalanStatus;
use App\Enums\UserRole;
use App\Models\Halaqah;
use App\Models\Muhafidz;
use App\Models\Mutabaah;
use App\Models\MutabaahBulanan;
use App\Models\OrangTua;
use App\Models\Santri;
use App\Models\TargetHafalan;
use App\Models\User;

test('user has one profile per role', function () {
    $user = User::factory()->create(['role' => UserRole::Muhafidz]);
    $muhafidz = Muhafidz::factory()->create(['user_id' => $user->id]);

    expect($user->muhafidz->id)->toBe($muhafidz->id);
});

test('santri belongs to user, muhafidz and orang tua', function () {
    $user = User::factory()->create(['role' => UserRole::Santri]);
    $santri = Santri::factory()->create(['user_id' => $user->id]);
    $muhafidz = Muhafidz::factory()->create();
    $orangTua = OrangTua::factory()->create();

    $santri->update(['orang_tua_id' => $orangTua->id]);

    expect($santri->user->id)->toBe($user->id)
        ->and($santri->orangTua->id)->toBe($orangTua->id);
});

test('halaqah belongs to muhafidz and has many santri through members', function () {
    $muhafidz = Muhafidz::factory()->create();
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);

    $santriA = Santri::factory()->create();
    $santriB = Santri::factory()->create();

    $halaqah->santris()->attach([$santriA->id, $santriB->id]);

    expect($halaqah->muhafidz->id)->toBe($muhafidz->id)
        ->and($halaqah->santris)->toHaveCount(2)
        ->and($santriA->halaqahs)->toHaveCount(1);
});

test('target hafalan belongs to santri and reports progress percent', function () {
    $santri = Santri::factory()->create();
    $target = TargetHafalan::factory()->create([
        'santri_id' => $santri->id,
        'target' => 6,
        'progress' => 30,
    ]);

    expect($target->santri->id)->toBe($santri->id)
        ->and($target->progressPercent())->toBe(25);
});

test('mutabaah belongs to santri and muhafidz', function () {
    $santri = Santri::factory()->create();
    $muhafidz = Muhafidz::factory()->create();
    $mutabaah = Mutabaah::factory()->create([
        'santri_id' => $santri->id,
        'muhafidz_id' => $muhafidz->id,
    ]);

    expect($mutabaah->santri->id)->toBe($santri->id)
        ->and($mutabaah->muhafidz->id)->toBe($muhafidz->id);
});

test('mutabaah bulanan belongs to santri', function () {
    $santri = Santri::factory()->create();
    $bulanan = MutabaahBulanan::factory()->create(['santri_id' => $santri->id]);

    expect($bulanan->santri->id)->toBe($santri->id);
});

test('santri status and halaqah status enum casts work', function () {
    $santri = Santri::factory()->create(['status' => SantriStatus::Aktif]);
    $halaqah = Halaqah::factory()->create(['status' => HalaqahStatus::Aktif]);
    $target = TargetHafalan::factory()->create(['status' => TargetHafalanStatus::Berlangsung]);

    expect($santri->status)->toBe(SantriStatus::Aktif)
        ->and($halaqah->status)->toBe(HalaqahStatus::Aktif)
        ->and($target->status)->toBe(TargetHafalanStatus::Berlangsung);
});
