<?php

use App\Enums\UserRole;
use App\Models\User;

test('user defaults to santri role', function () {
    $user = User::factory()->create();

    expect($user->role)->toBe(UserRole::Santri);
});

test('hasRole matches the assigned role', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);

    expect($admin->hasRole(UserRole::Admin))->toBeTrue()
        ->and($admin->hasRole(UserRole::Ustadz))->toBeFalse()
        ->and($admin->roleLabel())->toBe('Admin');
});
