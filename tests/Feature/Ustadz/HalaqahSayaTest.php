<?php

use App\Enums\UserRole;
use App\Models\Halaqah;
use App\Models\Muhafidz;
use App\Models\Santri;
use App\Models\User;

test('muhafidz sees only their own halaqah', function () {
    $user = User::factory()->create(['role' => UserRole::Muhafidz]);
    $muhafidz = Muhafidz::factory()->create(['user_id' => $user->id]);
    $own = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id, 'nama' => 'Halaqah Milik Saya']);
    $other = Muhafidz::factory()->create();
    Halaqah::factory()->create(['muhafidz_id' => $other->id, 'nama' => 'Halaqah Bukan Saya']);

    $this->actingAs($user)->get(route('muhafidz.halaqahs.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('muhafidz/halaqahs/index')
            ->has('halaqahs.data', 1)
            ->where('halaqahs.data.0.nama', 'Halaqah Milik Saya'));
});

test('santri count is included per halaqah', function () {
    $user = User::factory()->create(['role' => UserRole::Muhafidz]);
    $muhafidz = Muhafidz::factory()->create(['user_id' => $user->id]);
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $halaqah->santris()->attach(Santri::factory()->create()->id);

    $this->actingAs($user)->get(route('muhafidz.halaqahs.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('halaqahs.data.0.santri_count')
            ->where('halaqahs.data.0.santri_count', 1));
});

test('non-muhafidz cannot access muhafidz halaqah list', function () {
    $santri = User::factory()->create(['role' => UserRole::Santri]);

    $this->actingAs($santri)->get(route('muhafidz.halaqahs.index'))->assertForbidden();
});
