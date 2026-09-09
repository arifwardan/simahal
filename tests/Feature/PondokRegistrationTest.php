<?php

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Pondok;
use App\Models\User;

it('registers a pondok with admin and auto-login', function (): void {
    $this->post(route('register-pondok.store'), [
        'nama_yayasan' => 'Pondok Baru',
        'slug' => 'pondok-baru',
        'name' => 'Admin Baru',
        'email' => 'admin@baru.test',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ])->assertRedirect(route('dashboard'));

    $pondok = Pondok::where('slug', 'pondok-baru')->first();
    expect($pondok->nama_yayasan)->toBe('Pondok Baru');
    $admin = User::where('email', 'admin@baru.test')->first();
    expect($admin->role)->toBe(UserRole::Admin)
        ->and($admin->status)->toBe(UserStatus::Active)
        ->and($admin->pondok_id)->toBe($pondok->id);
    $this->assertAuthenticatedAs($admin);
});

it('join creates pending account that cannot access dashboard', function (): void {
    $pondok = Pondok::factory()->create();

    $this->post(route('join-pondok.store'), [
        'pondok_id' => $pondok->id,
        'role' => 'santri',
        'name' => 'Santri Baru',
        'email' => 'santri@baru.test',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ])->assertRedirect(route('login'));

    $user = User::where('email', 'santri@baru.test')->first();
    expect($user->status)->toBe(UserStatus::Pending);

    $this->actingAs($user)->get(route('dashboard'))->assertRedirect(route('login'));
});

it('rejects duplicate slug and duplicate email', function (): void {
    Pondok::factory()->create(['slug' => 'ada']);
    User::factory()->create(['email' => 'dup@test.test']);

    $this->post(route('register-pondok.store'), [
        'nama_yayasan' => 'X', 'slug' => 'ada', 'name' => 'A',
        'email' => 'baru@test.test', 'password' => 'password123', 'password_confirmation' => 'password123',
    ])->assertSessionHasErrors('slug');

    $this->post(route('join-pondok.store'), [
        'pondok_id' => Pondok::factory()->create()->id, 'role' => 'muhafidz',
        'name' => 'B', 'email' => 'dup@test.test',
        'password' => 'password123', 'password_confirmation' => 'password123',
    ])->assertSessionHasErrors('email');
});
