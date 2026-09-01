<?php

use App\Enums\UserRole;
use App\Models\Muhafidz;
use App\Models\Mutabaah;
use App\Models\Santri;
use App\Models\User;
use Tests\TestCase;

function makingMuhafidz(TestCase $test): Muhafidz
{
    $user = User::factory()->create(['role' => UserRole::Muhafidz]);
    $muhafidz = Muhafidz::factory()->create(['user_id' => $user->id]);
    $test->actingAs($user);

    return $muhafidz;
}

test('muhafidz sees mutabaah history for mutabaah they recorded', function () {
    $muhafidz = makingMuhafidz($this);
    $santri = Santri::factory()->create();
    Mutabaah::factory()->count(3)->create(['muhafidz_id' => $muhafidz->id, 'santri_id' => $santri->id]);
    $other = Muhafidz::factory()->create();
    Mutabaah::factory()->create(['muhafidz_id' => $other->id, 'santri_id' => $santri->id]);

    $this->get(route('muhafidz.mutabaahs.history'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('mutabaahs.data', 3));
});

test('history can be filtered by a member santri', function () {
    $muhafidz = makingMuhafidz($this);
    $santriA = Santri::factory()->create();
    $santriB = Santri::factory()->create();
    Mutabaah::factory()->create(['muhafidz_id' => $muhafidz->id, 'santri_id' => $santriA->id]);
    Mutabaah::factory()->create(['muhafidz_id' => $muhafidz->id, 'santri_id' => $santriB->id]);

    $this->get(route('muhafidz.mutabaahs.history', ['santri' => $santriA->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('mutabaahs.data', 1));
});

test('non-muhafidz cannot access history', function () {
    $santri = User::factory()->create(['role' => UserRole::Santri]);

    $this->actingAs($santri)->get(route('muhafidz.mutabaahs.history'))->assertForbidden();
});
