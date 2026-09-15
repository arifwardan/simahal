<?php

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Santri;
use App\Models\User;

it('rejects pending users from auth pages with a message', function (): void {
    $user = User::factory()->create([
        'role' => UserRole::Santri, 'status' => UserStatus::Pending,
    ]);

    $this->actingAs($user)->get(route('dashboard'))
        ->assertRedirect(route('login'))
        ->assertSessionHasErrors(['email' => 'Akun nonaktif. Hubungi admin.']);

    $this->assertGuest();
});

it('lets active users through', function (): void {
    $user = User::factory()->create([
        'role' => UserRole::Santri, 'status' => UserStatus::Active,
    ]);
    Santri::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)->get(route('dashboard'))->assertOk();
});
