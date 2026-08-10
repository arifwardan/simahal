<?php

use App\Enums\UserRole;
use App\Models\Mutabaah;
use App\Models\Santri;
use App\Models\User;
use App\Models\Ustadz;
use Tests\TestCase;

function makingUstadz(TestCase $test): Ustadz
{
    $user = User::factory()->create(['role' => UserRole::Ustadz]);
    $ustadz = Ustadz::factory()->create(['user_id' => $user->id]);
    $test->actingAs($user);

    return $ustadz;
}

test('ustadz sees mutabaah history for mutabaah they recorded', function () {
    $ustadz = makingUstadz($this);
    $santri = Santri::factory()->create();
    Mutabaah::factory()->count(3)->create(['ustadz_id' => $ustadz->id, 'santri_id' => $santri->id]);
    $other = Ustadz::factory()->create();
    Mutabaah::factory()->create(['ustadz_id' => $other->id, 'santri_id' => $santri->id]);

    $this->get(route('ustadz.mutabaahs.history'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('mutabaahs.data', 3));
});

test('history can be filtered by a member santri', function () {
    $ustadz = makingUstadz($this);
    $santriA = Santri::factory()->create();
    $santriB = Santri::factory()->create();
    Mutabaah::factory()->create(['ustadz_id' => $ustadz->id, 'santri_id' => $santriA->id]);
    Mutabaah::factory()->create(['ustadz_id' => $ustadz->id, 'santri_id' => $santriB->id]);

    $this->get(route('ustadz.mutabaahs.history', ['santri' => $santriA->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('mutabaahs.data', 1));
});

test('non-ustadz cannot access history', function () {
    $santri = User::factory()->create(['role' => UserRole::Santri]);

    $this->actingAs($santri)->get(route('ustadz.mutabaahs.history'))->assertForbidden();
});
