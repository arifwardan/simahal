<?php

use App\Enums\HalaqahMemberStatus;
use App\Enums\HalaqahStatus;
use App\Enums\MutabaahJenis;
use App\Enums\MutabaahKategori;
use App\Enums\MutabaahStatus;
use App\Enums\SantriJenis;
use App\Enums\SantriStatus;
use App\Enums\TargetHafalanStatus;
use App\Enums\UserRole;

test('user role enum has all SIMAHAL roles', function () {
    expect(UserRole::cases())
        ->toHaveCount(4)
        ->and(UserRole::Admin->value)->toBe('admin')
        ->and(UserRole::Ustadz->value)->toBe('ustadz')
        ->and(UserRole::Santri->value)->toBe('santri')
        ->and(UserRole::OrangTua->value)->toBe('orang_tua');
});

test('all enum cases have labels', function () {
    $all = [
        ...UserRole::cases(),
        ...SantriStatus::cases(),
        ...HalaqahStatus::cases(),
        ...HalaqahMemberStatus::cases(),
        ...TargetHafalanStatus::cases(),
        ...MutabaahJenis::cases(),
        ...MutabaahStatus::cases(),
        ...SantriJenis::cases(),
        ...MutabaahKategori::cases(),
    ];

    expect($all)->not->toBeEmpty();

    foreach ($all as $case) {
        expect($case->label())->toBeString()->not->toBeEmpty();
    }
});
