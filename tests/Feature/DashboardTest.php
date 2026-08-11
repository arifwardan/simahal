<?php

use App\Enums\UserRole;
use App\Models\Halaqah;
use App\Models\Mutabaah;
use App\Models\OrangTua;
use App\Models\Santri;
use App\Models\TargetHafalan;
use App\Models\User;
use App\Models\Ustadz;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    Santri::factory()->create(['user_id' => $user->id]);
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

test('santri without a profile gets a clean 403', function () {
    $user = User::factory()->create(['role' => UserRole::Santri]);

    $this->actingAs($user)->get(route('dashboard'))->assertForbidden();
});

test('ustadz without a profile gets a clean 403', function () {
    $user = User::factory()->create(['role' => UserRole::Ustadz]);

    $this->actingAs($user)->get(route('dashboard'))->assertForbidden();
});

test('orang tua without a profile gets a clean 403', function () {
    $user = User::factory()->create(['role' => UserRole::OrangTua]);

    $this->actingAs($user)->get(route('dashboard'))->assertForbidden();
});

test('admin dashboard renders the admin component', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);

    $this->actingAs($admin)->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('dashboard/admin'));
});

test('ustadz dashboard renders the ustadz component with their halaqah', function () {
    $user = User::factory()->create(['role' => UserRole::Ustadz]);
    $ustadz = Ustadz::factory()->create(['user_id' => $user->id]);
    Halaqah::factory()->count(2)->create(['ustadz_id' => $ustadz->id]);
    $own = Mutabaah::factory()->count(3)->create(['ustadz_id' => $ustadz->id]);
    $other = Ustadz::factory()->create();
    Mutabaah::factory()->count(2)->create(['ustadz_id' => $other->id]);

    $this->actingAs($user)->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard/ustadz')
            ->has('halaqahs', 2)
            ->has('recentMutabaahs', 3)
            ->where('totalMutabaahs', 3));
});

test('santri dashboard renders the santri component with progress', function () {
    $user = User::factory()->create(['role' => UserRole::Santri]);
    $santri = Santri::factory()->create(['user_id' => $user->id]);
    TargetHafalan::factory()->create(['santri_id' => $santri->id, 'target' => 40, 'progress' => 10]);
    Mutabaah::factory()->count(2)->create(['santri_id' => $santri->id]);

    $this->actingAs($user)->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard/santri')
            ->where('progress.target', 40)
            ->where('progress.progress', 10)
            ->where('progress.percent', 25)
            ->has('riwayat', 2));
});

test('orang tua dashboard renders only their own children', function () {
    $user = User::factory()->create(['role' => UserRole::OrangTua]);
    $orangTua = OrangTua::factory()->create(['user_id' => $user->id]);
    $ownChild = Santri::factory()->create(['orang_tua_id' => $orangTua->id, 'nama' => 'Anak Saya']);
    $otherParent = OrangTua::factory()->create();
    Santri::factory()->create(['orang_tua_id' => $otherParent->id, 'nama' => 'Anak Orang Lain']);

    $this->actingAs($user)->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard/orang-tua')
            ->has('children', 1)
            ->where('children.0.nama', 'Anak Saya'));
});

test('admin dashboard shows global counts', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    Santri::factory()->count(4)->create();
    $ustadzs = Ustadz::factory()->count(2)->create();
    OrangTua::factory()->count(1)->create();
    Halaqah::factory()->count(3)->create(['ustadz_id' => $ustadzs->first()->id]);

    $this->actingAs($admin)->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('counts.santris', 4)
            ->where('counts.ustadzs', 2)
            ->where('counts.halaqahs', 3));
});
