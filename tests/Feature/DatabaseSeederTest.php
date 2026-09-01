<?php

use App\Enums\UserRole;
use App\Models\Halaqah;
use App\Models\Muhafidz;
use App\Models\Mutabaah;
use App\Models\OrangTua;
use App\Models\Santri;
use App\Models\User;

test('seeder creates one account of each role', function () {
    $this->seed();

    expect(UserRole::cases())->each(fn ($role) => expect(
        User::where('role', $role->value)->count()
    )->toBeGreaterThanOrEqual(1));
});

test('seeder creates interconnected demo data', function () {
    $this->seed();

    expect(Muhafidz::count())->toBeGreaterThanOrEqual(1)
        ->and(Santri::count())->toBeGreaterThanOrEqual(1)
        ->and(OrangTua::count())->toBeGreaterThanOrEqual(1)
        ->and(Halaqah::count())->toBeGreaterThanOrEqual(1)
        ->and(Mutabaah::count())->toBeGreaterThanOrEqual(1);
});
