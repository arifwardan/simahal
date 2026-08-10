<?php

use App\Enums\HalaqahStatus;
use App\Enums\UserRole;
use App\Models\Halaqah;
use App\Models\HalaqahMember;
use App\Models\Santri;
use App\Models\User;
use App\Models\Ustadz;

beforeEach(function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    $this->actingAs($admin);
});

test('admin can list halaqah', function () {
    Halaqah::factory()->count(2)->create();

    $this->get(route('admin.halaqahs.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/halaqahs/index'));
});

test('admin can create a halaqah with members', function () {
    $ustadz = Ustadz::factory()->create();
    $santris = Santri::factory()->count(2)->create();

    $this->post(route('admin.halaqahs.store'), [
        'nama' => 'Halaqah Tahfidz 1',
        'ustadz_id' => $ustadz->id,
        'jadwal' => 'Setiap pagi',
        'status' => HalaqahStatus::Aktif->value,
        'santri_ids' => $santris->pluck('id')->all(),
    ])->assertRedirect(route('admin.halaqahs.index'));

    $halaqah = Halaqah::where('nama', 'Halaqah Tahfidz 1')->first();

    expect($halaqah->santris)->toHaveCount(2);
});

test('admin can update a halaqah and sync members', function () {
    $halaqah = Halaqah::factory()->create();
    $current = Santri::factory()->create();
    $incoming = Santri::factory()->create();
    $halaqah->santris()->attach($current->id);

    $this->patch(route('admin.halaqahs.update', $halaqah), [
        'nama' => $halaqah->nama,
        'ustadz_id' => $halaqah->ustadz_id,
        'jadwal' => 'Setiap sore',
        'status' => HalaqahStatus::Aktif->value,
        'santri_ids' => [$incoming->id],
    ])->assertRedirect(route('admin.halaqahs.index'));

    expect($halaqah->fresh()->santris)->toHaveCount(1)
        ->and($halaqah->fresh()->santris->first()->id)->toBe($incoming->id);
});

test('admin can delete a halaqah and its memberships', function () {
    $halaqah = Halaqah::factory()->create();
    $santri = Santri::factory()->create();
    $halaqah->santris()->attach($santri->id);

    $this->delete(route('admin.halaqahs.destroy', $halaqah))
        ->assertRedirect(route('admin.halaqahs.index'));

    expect($halaqah->fresh())->toBeNull()
        ->and(HalaqahMember::count())->toBe(0);
});

test('non-admin cannot access halaqah management', function () {
    $ustadz = User::factory()->create(['role' => UserRole::Ustadz]);
    $this->actingAs($ustadz);

    $this->get(route('admin.halaqahs.index'))->assertForbidden();
});
