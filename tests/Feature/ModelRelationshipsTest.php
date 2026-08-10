<?php

use App\Enums\HalaqahStatus;
use App\Enums\SantriStatus;
use App\Enums\TargetHafalanStatus;
use App\Enums\UserRole;
use App\Models\Halaqah;
use App\Models\Mutabaah;
use App\Models\OrangTua;
use App\Models\Santri;
use App\Models\TargetHafalan;
use App\Models\User;
use App\Models\Ustadz;

test('user has one profile per role', function () {
    $user = User::factory()->create(['role' => UserRole::Ustadz]);
    $ustadz = Ustadz::factory()->create(['user_id' => $user->id]);

    expect($user->ustadz->id)->toBe($ustadz->id);
});

test('santri belongs to user, ustadz and orang tua', function () {
    $user = User::factory()->create(['role' => UserRole::Santri]);
    $santri = Santri::factory()->create(['user_id' => $user->id]);
    $ustadz = Ustadz::factory()->create();
    $orangTua = OrangTua::factory()->create();

    $santri->update(['orang_tua_id' => $orangTua->id]);

    expect($santri->user->id)->toBe($user->id)
        ->and($santri->orangTua->id)->toBe($orangTua->id);
});

test('halaqah belongs to ustadz and has many santri through members', function () {
    $ustadz = Ustadz::factory()->create();
    $halaqah = Halaqah::factory()->create(['ustadz_id' => $ustadz->id]);

    $santriA = Santri::factory()->create();
    $santriB = Santri::factory()->create();

    $halaqah->santris()->attach([$santriA->id, $santriB->id]);

    expect($halaqah->ustadz->id)->toBe($ustadz->id)
        ->and($halaqah->santris)->toHaveCount(2)
        ->and($santriA->halaqahs)->toHaveCount(1);
});

test('target hafalan belongs to santri and reports progress percent', function () {
    $santri = Santri::factory()->create();
    $target = TargetHafalan::factory()->create([
        'santri_id' => $santri->id,
        'target' => 120,
        'progress' => 30,
    ]);

    expect($target->santri->id)->toBe($santri->id)
        ->and($target->progressPercent())->toBe(25);
});

test('mutabaah belongs to santri and ustadz', function () {
    $santri = Santri::factory()->create();
    $ustadz = Ustadz::factory()->create();
    $mutabaah = Mutabaah::factory()->create([
        'santri_id' => $santri->id,
        'ustadz_id' => $ustadz->id,
    ]);

    expect($mutabaah->santri->id)->toBe($santri->id)
        ->and($mutabaah->ustadz->id)->toBe($ustadz->id);
});

test('santri status and halaqah status enum casts work', function () {
    $santri = Santri::factory()->create(['status' => SantriStatus::Aktif]);
    $halaqah = Halaqah::factory()->create(['status' => HalaqahStatus::Aktif]);
    $target = TargetHafalan::factory()->create(['status' => TargetHafalanStatus::Berlangsung]);

    expect($santri->status)->toBe(SantriStatus::Aktif)
        ->and($halaqah->status)->toBe(HalaqahStatus::Aktif)
        ->and($target->status)->toBe(TargetHafalanStatus::Berlangsung);
});
