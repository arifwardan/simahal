<?php

use App\Enums\TargetHafalanStatus;
use App\Enums\UserRole;
use App\Models\Halaqah;
use App\Models\Santri;
use App\Models\TargetHafalan;
use App\Models\User;
use App\Models\Ustadz;
use Tests\TestCase;

function creatingUstadz(TestCase $test): Ustadz
{
    $user = User::factory()->create(['role' => UserRole::Ustadz]);
    $ustadz = Ustadz::factory()->create(['user_id' => $user->id]);
    $test->actingAs($user);

    return $ustadz;
}

test('ustadz sees target hafalan of member santri with progress percent', function () {
    $ustadz = creatingUstadz($this);
    $halaqah = Halaqah::factory()->create(['ustadz_id' => $ustadz->id]);
    $santri = Santri::factory()->create();
    $halaqah->santris()->attach($santri->id);
    TargetHafalan::factory()->create(['santri_id' => $santri->id, 'target' => 100, 'progress' => 25]);

    $this->get(route('ustadz.targets.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('ustadz/targets/index')
            ->has('santris', 1));
});

test('ustadz can create a target for a member santri', function () {
    $ustadz = creatingUstadz($this);
    $halaqah = Halaqah::factory()->create(['ustadz_id' => $ustadz->id]);
    $santri = Santri::factory()->create();
    $halaqah->santris()->attach($santri->id);

    $this->post(route('ustadz.targets.store'), [
        'santri_id' => $santri->id,
        'periode' => '2027-2028',
        'target' => 600,
        'status' => TargetHafalanStatus::Berlangsung->value,
    ])->assertRedirect(route('ustadz.targets.index'));

    $this->assertDatabaseHas('target_hafalans', [
        'santri_id' => $santri->id,
        'periode' => '2027-2028',
        'target' => 600,
        'status' => TargetHafalanStatus::Berlangsung->value,
    ]);
});

test('ustadz cannot create a target for a stranger santri', function () {
    $ustadz = creatingUstadz($this);
    $stranger = Santri::factory()->create();

    $this->post(route('ustadz.targets.store'), [
        'santri_id' => $stranger->id,
        'periode' => '2027-2028',
        'target' => 600,
        'status' => TargetHafalanStatus::Berlangsung->value,
    ])->assertForbidden();

    expect(TargetHafalan::count())->toBe(0);
});

test('ustadz can mark a target complete and delete one', function () {
    $ustadz = creatingUstadz($this);
    $halaqah = Halaqah::factory()->create(['ustadz_id' => $ustadz->id]);
    $santri = Santri::factory()->create();
    $halaqah->santris()->attach($santri->id);
    $target = TargetHafalan::factory()->create(['santri_id' => $santri->id]);

    $this->patch(route('ustadz.targets.update', $target), [
        'periode' => $target->periode,
        'target' => $target->target,
        'status' => TargetHafalanStatus::Selesai->value,
    ])->assertRedirect(route('ustadz.targets.index'));

    expect($target->fresh()->status)->toBe(TargetHafalanStatus::Selesai);

    $this->delete(route('ustadz.targets.destroy', $target))
        ->assertRedirect(route('ustadz.targets.index'));

    expect($target->fresh())->toBeNull();
});
