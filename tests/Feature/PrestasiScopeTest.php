<?php

use App\Enums\UserRole;
use App\Models\OrangTua;
use App\Models\Santri;
use App\Models\User;

test('santri can view own prestasi', function () {
    $user = User::factory()->create(['role' => UserRole::Santri]);
    $santri = Santri::factory()->create(['user_id' => $user->id, 'nama' => 'Santri A']);

    $this->actingAs($user)
        ->get(route('santri.prestasi.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('santri/prestasi')
            ->where('santri.id', $santri->id)
            ->where('santri.nama', 'Santri A'));
});

test('santri prestasi is scoped to own record only', function () {
    $userA = User::factory()->create(['role' => UserRole::Santri]);
    $santriA = Santri::factory()->create(['user_id' => $userA->id, 'nama' => 'Santri A']);
    $userB = User::factory()->create(['role' => UserRole::Santri]);
    $santriB = Santri::factory()->create(['user_id' => $userB->id, 'nama' => 'Santri B']);

    $this->actingAs($userA)
        ->get(route('santri.prestasi.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('santri.id', $santriA->id)
            ->where('santri.nama', 'Santri A'));
});

test('orang tua can view own children prestasi only', function () {
    $user = User::factory()->create(['role' => UserRole::OrangTua]);
    $orangTua = OrangTua::factory()->create(['user_id' => $user->id]);
    $ownChild = Santri::factory()->create(['orang_tua_id' => $orangTua->id, 'nama' => 'Anak Saya']);

    $otherParent = OrangTua::factory()->create();
    Santri::factory()->create(['orang_tua_id' => $otherParent->id, 'nama' => 'Anak Orang Lain']);

    $this->actingAs($user)
        ->get(route('orang-tua.prestasi.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('orang-tua/prestasi')
            ->has('children', 1)
            ->where('children.0.nama', 'Anak Saya')
            ->where('children.0.id', $ownChild->id));
});

test('other parent cannot view another parents child prestasi', function () {
    $parentA = OrangTua::factory()->create();
    $userA = $parentA->user;
    // ensure role correct
    $userA->update(['role' => UserRole::OrangTua]);
    $childA = Santri::factory()->create(['orang_tua_id' => $parentA->id, 'nama' => 'Anak A']);

    $parentB = OrangTua::factory()->create();
    $userB = $parentB->user;
    $userB->update(['role' => UserRole::OrangTua]);
    $childB = Santri::factory()->create(['orang_tua_id' => $parentB->id, 'nama' => 'Anak B']);

    // Parent A should only see Anak A
    $this->actingAs($userA)
        ->get(route('orang-tua.prestasi.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('children', 1)
            ->where('children.0.nama', 'Anak A'));

    // Parent B should only see Anak B
    $this->actingAs($userB)
        ->get(route('orang-tua.prestasi.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('children', 1)
            ->where('children.0.nama', 'Anak B'));
});

test('santri without profile gets 403 on prestasi', function () {
    $user = User::factory()->create(['role' => UserRole::Santri]);

    $this->actingAs($user)
        ->get(route('santri.prestasi.index'))
        ->assertForbidden();
});

test('orang tua without profile gets 403 on prestasi', function () {
    $user = User::factory()->create(['role' => UserRole::OrangTua]);

    $this->actingAs($user)
        ->get(route('orang-tua.prestasi.index'))
        ->assertForbidden();
});

test('santri cannot access orang tua prestasi route', function () {
    $user = User::factory()->create(['role' => UserRole::Santri]);
    Santri::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->get(route('orang-tua.prestasi.index'))
        ->assertForbidden();
});

test('orang tua cannot access santri prestasi route', function () {
    $user = User::factory()->create(['role' => UserRole::OrangTua]);
    OrangTua::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->get(route('santri.prestasi.index'))
        ->assertForbidden();
});

test('guest is redirected from prestasi routes', function () {
    $this->get(route('santri.prestasi.index'))->assertRedirect(route('login'));
    $this->get(route('orang-tua.prestasi.index'))->assertRedirect(route('login'));
});
