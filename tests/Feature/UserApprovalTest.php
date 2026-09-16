<?php

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;

it('lets admin approve a pending user', function (): void {
    $admin = User::factory()->role(UserRole::Admin)->create(['status' => UserStatus::Active]);
    $pending = User::factory()->create([
        'role' => UserRole::Admin,
        'status' => UserStatus::Pending,
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.users.approve', $pending))
        ->assertRedirect(route('admin.users.index'));

    expect($pending->fresh()->status)->toBe(UserStatus::Active);
});

it('approved user is no longer blocked by EnsureActiveUser', function (): void {
    $admin = User::factory()->role(UserRole::Admin)->create(['status' => UserStatus::Active]);
    $pending = User::factory()->create([
        'role' => UserRole::Admin,
        'status' => UserStatus::Pending,
    ]);

    $this->actingAs($admin)->patch(route('admin.users.approve', $pending));

    $this->actingAs($pending->fresh())->get(route('dashboard'))->assertOk();
});

it('rejects approving an already active user', function (): void {
    $admin = User::factory()->role(UserRole::Admin)->create(['status' => UserStatus::Active]);
    $active = User::factory()->create([
        'role' => UserRole::Santri,
        'status' => UserStatus::Active,
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.users.approve', $active))
        ->assertForbidden();
});

it('rejects approving your own account', function (): void {
    $admin = User::factory()->role(UserRole::Admin)->create(['status' => UserStatus::Active]);

    $this->actingAs($admin)
        ->patch(route('admin.users.approve', $admin))
        ->assertForbidden();

    expect($admin->fresh()->status)->toBe(UserStatus::Active);
});

it('blocks guests and non-admins from approving', function (): void {
    $pending = User::factory()->create([
        'role' => UserRole::Admin,
        'status' => UserStatus::Pending,
    ]);
    $muhafidz = User::factory()->role(UserRole::Muhafidz)->create(['status' => UserStatus::Active]);

    $this->patch(route('admin.users.approve', $pending))->assertRedirect(route('login'));

    $this->actingAs($muhafidz)
        ->patch(route('admin.users.approve', $pending))
        ->assertForbidden();

    expect($pending->fresh()->status)->toBe(UserStatus::Pending);
});

it('lets admin reject a pending user by deleting', function (): void {
    $admin = User::factory()->role(UserRole::Admin)->create(['status' => UserStatus::Active]);
    $pending = User::factory()->create([
        'role' => UserRole::Admin,
        'status' => UserStatus::Pending,
    ]);

    $this->actingAs($admin)
        ->delete(route('admin.users.destroy', $pending))
        ->assertRedirect(route('admin.users.index'));

    expect(User::find($pending->id))->toBeNull();
});
