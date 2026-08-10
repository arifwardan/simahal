<?php

use App\Enums\SantriStatus;
use App\Enums\UserRole;
use App\Models\OrangTua;
use App\Models\Santri;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => UserRole::Admin]);
    $this->actingAs($this->admin);
});

test('admin can list santri with their user account', function () {
    Santri::factory()->count(3)->create();

    $this->get(route('admin.santris.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/santris/index'));
});

test('admin can create a santri with a new user account', function () {
    $orangTua = OrangTua::factory()->create();

    $this->post(route('admin.santris.store'), [
        'name' => 'Santri Cinta',
        'email' => 'cinta@simahal.test',
        'password' => 'password',
        'nis' => '2024009',
        'tanggal_lahir' => '2012-03-10',
        'status' => SantriStatus::Aktif->value,
        'orang_tua_id' => $orangTua->id,
    ])->assertRedirect(route('admin.santris.index'));

    $this->assertDatabaseHas('users', [
        'email' => 'cinta@simahal.test',
        'role' => UserRole::Santri->value,
    ]);

    $this->assertDatabaseHas('santris', [
        'nis' => '2024009',
        'nama' => 'Santri Cinta',
        'orang_tua_id' => $orangTua->id,
        'status' => SantriStatus::Aktif->value,
    ]);
});

test('admin can update a santri and its user account', function () {
    $santri = Santri::factory()->create();

    $this->patch(route('admin.santris.update', $santri), [
        'name' => 'Santri Update',
        'email' => $santri->user->email,
        'nis' => $santri->nis,
        'status' => SantriStatus::Aktif->value,
    ])->assertRedirect(route('admin.santris.index'));

    expect($santri->fresh()->nama)->toBe('Santri Update')
        ->and($santri->fresh()->user->name)->toBe('Santri Update');
});

test('admin can delete a santri and its user account', function () {
    $santri = Santri::factory()->create();

    $this->delete(route('admin.santris.destroy', $santri))
        ->assertRedirect(route('admin.santris.index'));

    expect($santri->fresh())->toBeNull()
        ->and(User::find($santri->user_id))->toBeNull();
});

test('non-admin cannot access santri management', function () {
    $ustadz = User::factory()->create(['role' => UserRole::Ustadz]);
    $this->actingAs($ustadz);

    $this->get(route('admin.santris.index'))->assertForbidden();
});
