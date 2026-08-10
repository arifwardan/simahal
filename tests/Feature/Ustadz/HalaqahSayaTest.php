<?php

use App\Enums\UserRole;
use App\Models\Halaqah;
use App\Models\Santri;
use App\Models\User;
use App\Models\Ustadz;

test('ustadz sees only their own halaqah', function () {
    $user = User::factory()->create(['role' => UserRole::Ustadz]);
    $ustadz = Ustadz::factory()->create(['user_id' => $user->id]);
    $own = Halaqah::factory()->create(['ustadz_id' => $ustadz->id, 'nama' => 'Halaqah Milik Saya']);
    $other = Ustadz::factory()->create();
    Halaqah::factory()->create(['ustadz_id' => $other->id, 'nama' => 'Halaqah Bukan Saya']);

    $this->actingAs($user)->get(route('ustadz.halaqahs.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('ustadz/halaqahs/index')
            ->has('halaqahs.data', 1)
            ->where('halaqahs.data.0.nama', 'Halaqah Milik Saya'));
});

test('santri count is included per halaqah', function () {
    $user = User::factory()->create(['role' => UserRole::Ustadz]);
    $ustadz = Ustadz::factory()->create(['user_id' => $user->id]);
    $halaqah = Halaqah::factory()->create(['ustadz_id' => $ustadz->id]);
    $halaqah->santris()->attach(Santri::factory()->create()->id);

    $this->actingAs($user)->get(route('ustadz.halaqahs.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('halaqahs.data.0.santri_count')
            ->where('halaqahs.data.0.santri_count', 1));
});

test('non-ustadz cannot access ustadz halaqah list', function () {
    $santri = User::factory()->create(['role' => UserRole::Santri]);

    $this->actingAs($santri)->get(route('ustadz.halaqahs.index'))->assertForbidden();
});
