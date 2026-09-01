<?php

use App\Enums\UserRole;
use App\Models\Halaqah;
use App\Models\Muhafidz;
use App\Models\Mutabaah;
use App\Models\Santri;
use App\Models\User;
use Tests\TestCase;

function actingMuhafidz(TestCase $test): Muhafidz
{
    $user = User::factory()->create(['role' => UserRole::Muhafidz]);
    $muhafidz = Muhafidz::factory()->create(['user_id' => $user->id]);
    $test->actingAs($user);

    return $muhafidz;
}

test('muhafidz can upsert mutabaah bulanan for a halaqah santri', function () {
    $muhafidz = actingMuhafidz($this);
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create();
    $halaqah->santris()->attach($santri->id);

    $this->post(route('muhafidz.mutabaah-bulanan.update', 1), [
        'santri_id' => $santri->id,
        'halaman_kumulatif' => 25,
        'tasmi_pekan_1' => 80,
        'ujian_soal_1' => 90,
    ])->assertRedirect();

    $this->assertDatabaseHas('mutabaah_bulanans', [
        'santri_id' => $santri->id,
        'tahun' => 2026,
        'bulan' => 1,
        'halaman_kumulatif' => 25,
    ]);

    // upsert: post lagi dengan nilai baru
    $this->post(route('muhafidz.mutabaah-bulanan.update', 1), [
        'santri_id' => $santri->id,
        'halaman_kumulatif' => 30,
    ])->assertRedirect();

    $this->assertDatabaseCount('mutabaah_bulanans', 1);
    $this->assertDatabaseHas('mutabaah_bulanans', ['santri_id' => $santri->id, 'halaman_kumulatif' => 30]);
});

test('muhafidz cannot submit a santri outside their halaqah', function () {
    $muhafidz = actingMuhafidz($this);
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $member = Santri::factory()->create();
    $halaqah->santris()->attach($member->id);
    $stranger = Santri::factory()->create();

    $this->post(route('muhafidz.mutabaah-bulanan.update', 1), [
        'santri_id' => $stranger->id,
        'halaman_kumulatif' => 20,
    ])->assertForbidden();
});

test('bulan must be between 1 and 12', function () {
    $muhafidz = actingMuhafidz($this);
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create();
    $halaqah->santris()->attach($santri->id);

    $this->post(route('muhafidz.mutabaah-bulanan.update', 13), [
        'santri_id' => $santri->id,
        'halaman_kumulatif' => 10,
    ])->assertStatus(422);
});

test('halaman kumulatif can be below halaman awal bulan (bypass sesuai kemampuan santri)', function () {
    $muhafidz = actingMuhafidz($this);
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create(['halaman_awal' => 10]);
    $halaqah->santris()->attach($santri->id);

    $this->post(route('muhafidz.mutabaah-bulanan.update', 1), [
        'santri_id' => $santri->id,
        'halaman_kumulatif' => 9,
    ])->assertRedirect();

    $this->assertDatabaseHas('mutabaah_bulanans', [
        'santri_id' => $santri->id,
        'halaman_kumulatif' => 9,
    ]);
});

test('halaqah santri page exposes prefill for given month', function () {
    $muhafidz = actingMuhafidz($this);
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create(['halaman_awal' => 5]);
    $halaqah->santris()->attach($santri->id);

    Mutabaah::factory()->create([
        'santri_id' => $santri->id,
        'tanggal' => '2026-01-03',
        'halaman' => 7,
    ]);

    $this->get(route('muhafidz.halaqahs.santris.show', ['halaqah' => $halaqah, 'bulan' => 1]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('muhafidz/halaqahs/santris')
            ->where('bulan', 1)
            ->has('bulanan.0', fn ($row) => $row
                ->where('santri_id', $santri->id)
                ->where('halaman_awal_bulan', 5)
                ->where('prefill_kumulatif', 12)
                ->etc()));
});
