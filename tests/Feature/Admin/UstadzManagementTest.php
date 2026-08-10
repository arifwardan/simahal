<?php

use App\Enums\UserRole;
use App\Models\User;
use App\Models\Ustadz;

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => UserRole::Admin]);
    $this->actingAs($this->admin);
});

test('admin can list ustadz', function () {
    Ustadz::factory()->count(3)->create();

    $this->get(route('admin.ustadzs.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/ustadzs/index'));
});

test('admin can create an ustadz with a new user account', function () {
    $this->post(route('admin.ustadzs.store'), [
        'name' => 'Ustadz Fajar',
        'email' => 'fajar@simahal.test',
        'password' => 'password',
        'kontak' => '08122334455',
    ])->assertRedirect(route('admin.ustadzs.index'));

    $this->assertDatabaseHas('users', [
        'email' => 'fajar@simahal.test',
        'role' => UserRole::Ustadz->value,
    ]);

    $this->assertDatabaseHas('ustadzs', [
        'nama' => 'Ustadz Fajar',
        'kontak' => '08122334455',
    ]);
});

test('admin can update an ustadz', function () {
    $ustadz = Ustadz::factory()->create();

    $this->patch(route('admin.ustadzs.update', $ustadz), [
        'name' => 'Ustadz Update',
        'email' => $ustadz->user->email,
        'kontak' => '08199988877',
    ])->assertRedirect(route('admin.ustadzs.index'));

    expect($ustadz->fresh()->nama)->toBe('Ustadz Update');
});

test('admin can delete an ustadz and its user account', function () {
    $ustadz = Ustadz::factory()->create();

    $this->delete(route('admin.ustadzs.destroy', $ustadz))
        ->assertRedirect(route('admin.ustadzs.index'));

    expect($ustadz->fresh())->toBeNull()
        ->and(User::find($ustadz->user_id))->toBeNull();
});
