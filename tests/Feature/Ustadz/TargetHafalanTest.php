<?php

use App\Enums\TargetHafalanStatus;
use App\Enums\UserRole;
use App\Models\Halaqah;
use App\Models\Muhafidz;
use App\Models\Santri;
use App\Models\TargetHafalan;
use App\Models\User;
use Tests\TestCase;

function creatingMuhafidz(TestCase $test): Muhafidz
{
    $user = User::factory()->create(['role' => UserRole::Muhafidz]);
    $muhafidz = Muhafidz::factory()->create(['user_id' => $user->id]);
    $test->actingAs($user);

    return $muhafidz;
}

test('muhafidz sees target hafalan of member santri with progress percent', function () {
    $muhafidz = creatingMuhafidz($this);
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create();
    $halaqah->santris()->attach($santri->id);
    TargetHafalan::factory()->create(['santri_id' => $santri->id, 'target' => 6, 'progress' => 25]);

    $this->get(route('muhafidz.targets.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('muhafidz/targets/index')
            ->has('santris', 1));
});

test('muhafidz can create a target for a member santri', function () {
    $muhafidz = creatingMuhafidz($this);
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create();
    $halaqah->santris()->attach($santri->id);

    $this->post(route('muhafidz.targets.store'), [
        'santri_id' => $santri->id,
        'periode' => '2027-2028',
        'target' => 6,
        'status' => TargetHafalanStatus::Berlangsung->value,
    ])->assertRedirect(route('muhafidz.targets.index'));

    $this->assertDatabaseHas('target_hafalans', [
        'santri_id' => $santri->id,
        'periode' => '2027-2028',
        'target' => 6,
        'status' => TargetHafalanStatus::Berlangsung->value,
    ]);
});

test('muhafidz cannot create a target for a stranger santri', function () {
    $muhafidz = creatingMuhafidz($this);
    $stranger = Santri::factory()->create();

    $this->post(route('muhafidz.targets.store'), [
        'santri_id' => $stranger->id,
        'periode' => '2027-2028',
        'target' => 6,
        'status' => TargetHafalanStatus::Berlangsung->value,
    ])->assertForbidden();

    expect(TargetHafalan::count())->toBe(0);
});

test('muhafidz can mark a target complete and delete one', function () {
    $muhafidz = creatingMuhafidz($this);
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create();
    $halaqah->santris()->attach($santri->id);
    $target = TargetHafalan::factory()->create(['santri_id' => $santri->id]);

    $this->patch(route('muhafidz.targets.update', $target), [
        'periode' => $target->periode,
        'target' => $target->target,
        'status' => TargetHafalanStatus::Selesai->value,
    ])->assertRedirect(route('muhafidz.targets.index'));

    expect($target->fresh()->status)->toBe(TargetHafalanStatus::Selesai);

    $this->delete(route('muhafidz.targets.destroy', $target))
        ->assertRedirect(route('muhafidz.targets.index'));

    expect($target->fresh())->toBeNull();
});
