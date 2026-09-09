<?php

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\OrangTua;
use App\Models\Pondok;
use App\Models\Santri;
use App\Models\User;

it('join as orang tua creates pending that cannot access dashboard', function (): void {
    $pondok = Pondok::factory()->create();

    $this->post(route('join-pondok.store'), [
        'pondok_id' => $pondok->id,
        'role' => 'orang_tua',
        'name' => 'Orang Tua Baru',
        'email' => 'ortu@baru.test',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ])->assertRedirect(route('login'));

    $user = User::where('email', 'ortu@baru.test')->first();
    expect($user->role)->toBe(UserRole::OrangTua)
        ->and($user->status)->toBe(UserStatus::Pending);

    $this->actingAs($user)->get(route('dashboard'))->assertRedirect(route('login'));
});

it('approves orang tua with two santri ids and links them', function (): void {
    $pondok = Pondok::factory()->create();
    $admin = User::factory()->create(['pondok_id' => $pondok->id, 'role' => UserRole::Admin]);
    $pending = User::factory()->create([
        'pondok_id' => $pondok->id, 'role' => UserRole::OrangTua, 'status' => UserStatus::Pending,
    ]);
    $a = Santri::factory()->create(['pondok_id' => $pondok->id]);
    $b = Santri::factory()->create(['pondok_id' => $pondok->id]);

    $this->actingAs($admin)
        ->post(route('admin.approvals.approve', $pending), ['santri_ids' => [$a->id, $b->id]])
        ->assertRedirect();

    expect($pending->fresh()->status)->toBe(UserStatus::Active);
    $orangTua = OrangTua::where('user_id', $pending->id)->first();
    expect($orangTua)->not->toBeNull()
        ->and($orangTua->pondok_id)->toBe($pondok->id);
    expect($a->fresh()->orang_tua_id)->toBe($orangTua->id)
        ->and($b->fresh()->orang_tua_id)->toBe($orangTua->id);
});

it('rejects orang tua approval with santri from another pondok', function (): void {
    $a = Pondok::factory()->create();
    $b = Pondok::factory()->create();
    $admin = User::factory()->create(['pondok_id' => $a->id, 'role' => UserRole::Admin]);
    $pending = User::factory()->create([
        'pondok_id' => $a->id, 'role' => UserRole::OrangTua, 'status' => UserStatus::Pending,
    ]);
    $foreign = Santri::factory()->create(['pondok_id' => $b->id]);

    $this->actingAs($admin)
        ->post(route('admin.approvals.approve', $pending), ['santri_ids' => [$foreign->id]])
        ->assertForbidden();

    expect($pending->fresh()->status)->toBe(UserStatus::Pending);
    expect(OrangTua::where('user_id', $pending->id)->exists())->toBeFalse();
});

it('rejects join roles besides the three allowed', function (): void {
    $pondok = Pondok::factory()->create();

    $this->post(route('join-pondok.store'), [
        'pondok_id' => $pondok->id,
        'role' => 'admin',
        'name' => 'X',
        'email' => 'x@baru.test',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ])->assertSessionHasErrors('role');
});
