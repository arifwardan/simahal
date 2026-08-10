<?php

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Support\Facades\Route;

beforeEach(function () {
    Route::middleware(['auth', 'role:admin'])->get('/_admin-only', fn () => 'ok');
});

test('admin can access admin-only route', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);

    $this->actingAs($admin)->get('/_admin-only')
        ->assertOk()
        ->assertSee('ok');
});

test('non-admin is forbidden from admin-only route', function () {
    $ustadz = User::factory()->create(['role' => UserRole::Ustadz]);

    $this->actingAs($ustadz)->get('/_admin-only')
        ->assertForbidden();
});

test('guest is redirected to login on protected route', function () {
    $this->get('/_admin-only')
        ->assertRedirect(route('login'));
});
