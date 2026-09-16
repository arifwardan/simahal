<?php

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

it('renders the register page for guests', function (): void {
    $response = $this->get(route('register'));

    $response->assertOk();
});

it('redirects authenticated users away from register', function (): void {
    $user = User::factory()->create(['role' => UserRole::Admin, 'status' => UserStatus::Active]);

    $this->actingAs($user)->get(route('register'))
        ->assertRedirect(route('dashboard'));
});

it('creates a pending admin user without auto-login', function (): void {
    $response = $this->post(route('register.store'), [
        'name' => 'New Admin',
        'email' => 'newadmin@simahal.test',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $user = User::where('email', 'newadmin@simahal.test')->first();

    expect($user)
        ->not->toBeNull()
        ->and($user->role)->toBe(UserRole::Admin)
        ->and($user->status)->toBe(UserStatus::Pending)
        ->and($user->email_verified_at)->toBeNull()
        ->and(Hash::check('password', $user->password))->toBeTrue();

    $this->assertGuest();

    $response->assertRedirect(route('login'));
});

it('flashes a status message after registration', function (): void {
    $response = $this->post(route('register.store'), [
        'name' => 'New Admin',
        'email' => 'newadmin@simahal.test',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertSessionHas('status');
    $this->assertGuest();
});

it('validates registration input', function (): void {
    $response = $this->post(route('register.store'), [
        'name' => '',
        'email' => 'not-an-email',
        'password' => 'short',
    ]);

    $response->assertSessionHasErrors(['name', 'email', 'password']);

    $this->assertGuest();
    expect(User::count())->toBe(0);
});
