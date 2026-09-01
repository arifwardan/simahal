<?php

use App\Enums\UserRole;
use App\Models\User;

test('admin can view mutabaah settings page', function () {
    $this->actingAs(User::factory()->create(['role' => UserRole::Admin]));

    $this->get(route('admin.mutabaah-settings.edit'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/mutabaah-settings'));
});

test('admin can update mutabaah settings', function () {
    $this->actingAs(User::factory()->create(['role' => UserRole::Admin]));

    $this->put(route('admin.mutabaah-settings.update'), [
        'konversi_juz_halaman' => 25,
        'ambang_hadiah_juz' => 2.0,
        'tahun_aktif' => 2027,
    ])->assertRedirect();

    $this->assertDatabaseHas('mutabaah_settings', [
        'konversi_juz_halaman' => 25,
        'ambang_hadiah_juz' => 2.0,
        'tahun_aktif' => 2027,
    ]);
});

test('non-admin cannot update mutabaah settings', function () {
    $this->actingAs(User::factory()->create(['role' => UserRole::Muhafidz]));

    $this->put(route('admin.mutabaah-settings.update'), [
        'konversi_juz_halaman' => 25,
        'ambang_hadiah_juz' => 2.0,
        'tahun_aktif' => 2027,
    ])->assertForbidden();
});
