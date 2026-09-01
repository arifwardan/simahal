<?php

use App\Enums\UserRole;
use App\Models\Muhafidz;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => UserRole::Admin]);
    $this->actingAs($this->admin);
});

test('admin can list muhafidz', function () {
    Muhafidz::factory()->count(3)->create();

    $this->get(route('admin.muhafidzs.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/muhafidzs/index'));
});

test('admin can create an muhafidz with a new user account', function () {
    $this->post(route('admin.muhafidzs.store'), [
        'name' => 'Muhafidz Fajar',
        'email' => 'fajar@simahal.test',
        'password' => 'password',
        'kontak' => '08122334455',
    ])->assertRedirect(route('admin.muhafidzs.index'));

    $this->assertDatabaseHas('users', [
        'email' => 'fajar@simahal.test',
        'role' => UserRole::Muhafidz->value,
    ]);

    $this->assertDatabaseHas('muhafidzs', [
        'nama' => 'Muhafidz Fajar',
        'kontak' => '08122334455',
    ]);
});

test('admin can update an muhafidz', function () {
    $muhafidz = Muhafidz::factory()->create();

    $this->patch(route('admin.muhafidzs.update', $muhafidz), [
        'name' => 'Muhafidz Update',
        'email' => $muhafidz->user->email,
        'kontak' => '08199988877',
    ])->assertRedirect(route('admin.muhafidzs.index'));

    expect($muhafidz->fresh()->nama)->toBe('Muhafidz Update');
});

test('admin can delete an muhafidz and its user account', function () {
    $muhafidz = Muhafidz::factory()->create();

    $this->delete(route('admin.muhafidzs.destroy', $muhafidz))
        ->assertRedirect(route('admin.muhafidzs.index'));

    expect($muhafidz->fresh())->toBeNull()
        ->and(User::find($muhafidz->user_id))->toBeNull();
});
