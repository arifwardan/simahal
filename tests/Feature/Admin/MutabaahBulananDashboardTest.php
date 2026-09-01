<?php

use App\Enums\SantriJenis;
use App\Enums\UserRole;
use App\Models\Halaqah;
use App\Models\MutabaahBulanan;
use App\Models\Santri;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => UserRole::Admin]);
    $this->actingAs($this->admin);
});

test('admin can view mutabaah bulanan dashboard', function () {
    $halaqah = Halaqah::factory()->create();
    $santri = Santri::factory()->create(['jenis' => SantriJenis::Ikhwan]);
    $halaqah->santris()->attach($santri->id);
    MutabaahBulanan::factory()->create([
        'santri_id' => $santri->id,
        'tahun' => 2026,
        'bulan' => 1,
        'halaman_kumulatif' => 40,
    ]);

    $this->get(route('admin.mutabaah-bulanan.index', ['bulan' => 1]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/mutabaah-bulanan/index')
            ->where('bulan', 1)
            ->has('rows', 1)
            ->has('distribusi', 22));
});

test('non-admin cannot access mutabaah bulanan dashboard', function () {
    $muhafidz = User::factory()->create(['role' => UserRole::Muhafidz]);
    $this->actingAs($muhafidz);

    $this->get(route('admin.mutabaah-bulanan.index'))->assertForbidden();
});
