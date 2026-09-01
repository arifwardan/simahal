<?php

use App\Enums\UserRole;
use App\Models\User;

test('only admins can access the user list', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    $this->actingAs($admin)->get(route('admin.users.index'))->assertOk();
});

test('non-admin cannot access the user list', function () {
    $muhafidz = User::factory()->create(['role' => UserRole::Muhafidz]);
    $this->actingAs($muhafidz)->get(route('admin.users.index'))->assertForbidden();
});

test('admin can create a user with a role', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);

    $this->actingAs($admin)->post(route('admin.users.store'), [
        'name' => 'New User',
        'email' => 'new@simahal.test',
        'password' => 'password',
        'role' => UserRole::Muhafidz->value,
    ])->assertRedirect(route('admin.users.index'));

    $this->assertDatabaseHas('users', [
        'email' => 'new@simahal.test',
        'role' => UserRole::Muhafidz->value,
    ]);
});

test('admin can update a user role', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    $user = User::factory()->create(['role' => UserRole::Santri]);

    $this->actingAs($admin)->patch(route('admin.users.update', $user), [
        'name' => $user->name,
        'email' => $user->email,
        'role' => UserRole::OrangTua->value,
    ])->assertRedirect(route('admin.users.index'));

    expect($user->fresh()->role)->toBe(UserRole::OrangTua);
});

test('admin cannot delete themselves', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);

    $this->actingAs($admin)->delete(route('admin.users.destroy', $admin))
        ->assertForbidden();

    expect($admin->fresh())->not->toBeNull();
});

test('admin can delete another user', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    $other = User::factory()->create(['role' => UserRole::Santri]);

    $this->actingAs($admin)->delete(route('admin.users.destroy', $other))
        ->assertRedirect(route('admin.users.index'));

    expect($other->fresh())->toBeNull();
});
