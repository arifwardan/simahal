<?php

use App\Enums\HalaqahStatus;
use App\Enums\UserRole;
use App\Models\Halaqah;
use App\Models\HalaqahMember;
use App\Models\Muhafidz;
use App\Models\Santri;
use App\Models\User;

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

test('admin can create a halaqah with muhafidz and jam', function () {
    $muhafidz = Muhafidz::factory()->create();

    $this->post(route('admin.halaqahs.store'), [
        'nama' => 'Halaqah Tahfidz 1',
        'muhafidz_id' => $muhafidz->id,
        'jam_mulai' => '07:00',
        'jam_selesai' => '08:00',
        'status' => HalaqahStatus::Aktif->value,
    ])->assertRedirect(route('admin.halaqahs.index'));

    $halaqah = Halaqah::where('nama', 'Halaqah Tahfidz 1')->first();

    expect($halaqah->muhafidz_id)->toBe($muhafidz->id)
        ->and(substr($halaqah->jam_mulai, 0, 5))->toBe('07:00')
        ->and(substr($halaqah->jam_selesai, 0, 5))->toBe('08:00');
});

test('admin can update a halaqah and sync jam for muhafidz', function () {
    $halaqah = Halaqah::factory()->create();
    $newMuhafidz = Muhafidz::factory()->create();

    $this->patch(route('admin.halaqahs.update', $halaqah), [
        'nama' => $halaqah->nama,
        'muhafidz_id' => $newMuhafidz->id,
        'jam_mulai' => '16:00',
        'jam_selesai' => '17:00',
        'status' => HalaqahStatus::Aktif->value,
    ])->assertRedirect(route('admin.halaqahs.index'));

    expect($halaqah->fresh()->muhafidz_id)->toBe($newMuhafidz->id)
        ->and(substr($halaqah->fresh()->jam_mulai, 0, 5))->toBe('16:00');
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
    $muhafidz = User::factory()->create(['role' => UserRole::Muhafidz]);
    $this->actingAs($muhafidz);

    $this->get(route('admin.halaqahs.index'))->assertForbidden();
});

test('admin can create halaqah for multiple muhafidz at once (pilih semua)', function () {
    $muhafidzs = Muhafidz::factory()->count(3)->create();

    $this->post(route('admin.halaqahs.store'), [
        'nama' => 'Halaqah Pagi',
        'muhafidz_ids' => $muhafidzs->pluck('id')->all(),
        'jam_mulai' => '07:00',
        'jam_selesai' => '08:00',
        'status' => HalaqahStatus::Aktif->value,
    ])->assertRedirect(route('admin.halaqahs.index'));

    expect(Halaqah::where('nama', 'Halaqah Pagi')->count())->toBe(3);

    foreach ($muhafidzs as $m) {
        $h = Halaqah::where('muhafidz_id', $m->id)->where('nama', 'Halaqah Pagi')->first();
        expect($h)->not->toBeNull()
            ->and(substr($h->jam_mulai, 0, 5))->toBe('07:00');
    }
});
