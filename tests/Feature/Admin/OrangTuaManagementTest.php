<?php

use App\Enums\UserRole;
use App\Models\OrangTua;
use App\Models\Santri;
use App\Models\User;

beforeEach(function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    $this->actingAs($admin);
});

test('admin can list orang tua with child counts', function () {
    $orangTua = OrangTua::factory()->create();
    Santri::factory()->count(2)->create(['orang_tua_id' => $orangTua->id]);

    $this->get(route('admin.orang-tuas.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/orang-tuas/index'));
});

test('admin can create an orang tua with a user account', function () {
    $this->post(route('admin.orang-tuas.store'), [
        'name' => 'Ibu Siti',
        'email' => 'siti@simahal.test',
        'password' => 'password',
        'kontak' => '081111222333',
    ])->assertRedirect(route('admin.orang-tuas.index'));

    $this->assertDatabaseHas('users', [
        'email' => 'siti@simahal.test',
        'role' => UserRole::OrangTua->value,
    ]);

    $this->assertDatabaseHas('orang_tuas', [
        'nama' => 'Ibu Siti',
        'kontak' => '081111222333',
    ]);
});

test('admin can update an orang tua', function () {
    $orangTua = OrangTua::factory()->create();

    $this->patch(route('admin.orang-tuas.update', $orangTua), [
        'name' => 'Ibu Update',
        'email' => $orangTua->user->email,
        'kontak' => '08100000000',
    ])->assertRedirect(route('admin.orang-tuas.index'));

    expect($orangTua->fresh()->nama)->toBe('Ibu Update');
});

test('admin can delete an orang tua and its user account', function () {
    $orangTua = OrangTua::factory()->create();

    $this->delete(route('admin.orang-tuas.destroy', $orangTua))
        ->assertRedirect(route('admin.orang-tuas.index'));

    expect($orangTua->fresh())->toBeNull()
        ->and(User::find($orangTua->user_id))->toBeNull();
});
