<?php

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Pondok;
use App\Models\Santri;
use App\Models\User;

it('rejects pending users from auth pages with a message', function (): void {
    $pondok = Pondok::factory()->create();
    $user = User::factory()->create([
        'pondok_id' => $pondok->id, 'role' => UserRole::Santri, 'status' => UserStatus::Pending,
    ]);

    $this->actingAs($user)->get(route('dashboard'))
        ->assertRedirect(route('login'))
        ->assertSessionHasErrors(['email' => 'Akun menunggu persetujuan admin pondok.']);

    $this->assertGuest();
});

it('lets active users through', function (): void {
    $pondok = Pondok::factory()->create();
    $user = User::factory()->create([
        'pondok_id' => $pondok->id, 'role' => UserRole::Santri, 'status' => UserStatus::Active,
    ]);
    Santri::factory()->create(['user_id' => $user->id, 'pondok_id' => $pondok->id]);

    $this->actingAs($user)->get(route('dashboard'))->assertOk();
});

it('rejects active users without pondok with 403', function (): void {
    $user = User::factory()->create([
        'pondok_id' => null, 'role' => UserRole::Admin, 'status' => UserStatus::Active,
    ]);

    $this->actingAs($user)->get(route('dashboard'))->assertForbidden();
});
