<?php

use App\Enums\UserRole;
use App\Models\Halaqah;
use App\Models\Mutabaah;
use App\Models\Santri;
use App\Models\User;
use App\Models\Ustadz;
use Tests\TestCase;

function actingUstadz(TestCase $test): Ustadz
{
    $user = User::factory()->create(['role' => UserRole::Ustadz]);
    $ustadz = Ustadz::factory()->create(['user_id' => $user->id]);
    $test->actingAs($user);

    return $ustadz;
}

test('ustadz can batch upsert mutabaah bulanan for halaqah santri', function () {
    $ustadz = actingUstadz($this);
    $halaqah = Halaqah::factory()->create(['ustadz_id' => $ustadz->id]);
    $santri = Santri::factory()->create();
    $halaqah->santris()->attach($santri->id);

    $this->post(route('ustadz.mutabaah-bulanan.update', 1), [
        'records' => [[
            'santri_id' => $santri->id,
            'halaman_kumulatif' => 25,
            'tasmi_pekan_1' => 80,
            'ujian_soal_1' => 90,
        ]],
    ])->assertRedirect();

    $this->assertDatabaseHas('mutabaah_bulanans', [
        'santri_id' => $santri->id,
        'tahun' => 2026,
        'bulan' => 1,
        'halaman_kumulatif' => 25,
    ]);

    // upsert: post lagi dengan nilai baru
    $this->post(route('ustadz.mutabaah-bulanan.update', 1), [
        'records' => [[
            'santri_id' => $santri->id,
            'halaman_kumulatif' => 30,
        ]],
    ])->assertRedirect();

    $this->assertDatabaseCount('mutabaah_bulanans', 1);
    $this->assertDatabaseHas('mutabaah_bulanans', ['santri_id' => $santri->id, 'halaman_kumulatif' => 30]);
});

test('ustadz cannot submit a santri outside their halaqah', function () {
    $ustadz = actingUstadz($this);
    $halaqah = Halaqah::factory()->create(['ustadz_id' => $ustadz->id]);
    $member = Santri::factory()->create();
    $halaqah->santris()->attach($member->id);
    $stranger = Santri::factory()->create();

    $this->post(route('ustadz.mutabaah-bulanan.update', 1), [
        'records' => [
            ['santri_id' => $member->id, 'halaman_kumulatif' => 10],
            ['santri_id' => $stranger->id, 'halaman_kumulatif' => 20],
        ],
    ])->assertForbidden();
});

test('bulan must be between 1 and 12', function () {
    $ustadz = actingUstadz($this);
    $halaqah = Halaqah::factory()->create(['ustadz_id' => $ustadz->id]);
    $santri = Santri::factory()->create();
    $halaqah->santris()->attach($santri->id);

    $this->post(route('ustadz.mutabaah-bulanan.update', 13), [
        'records' => [['santri_id' => $santri->id, 'halaman_kumulatif' => 10]],
    ])->assertStatus(422);
});

test('halaman kumulatif cannot be below halaman awal bulan', function () {
    $ustadz = actingUstadz($this);
    $halaqah = Halaqah::factory()->create(['ustadz_id' => $ustadz->id]);
    $santri = Santri::factory()->create(['halaman_awal' => 10]);
    $halaqah->santris()->attach($santri->id);

    $this->post(route('ustadz.mutabaah-bulanan.update', 1), [
        'records' => [['santri_id' => $santri->id, 'halaman_kumulatif' => 9]],
    ])->assertStatus(422);
});

test('halaqah santri page exposes prefill for given month', function () {
    $ustadz = actingUstadz($this);
    $halaqah = Halaqah::factory()->create(['ustadz_id' => $ustadz->id]);
    $santri = Santri::factory()->create(['halaman_awal' => 5]);
    $halaqah->santris()->attach($santri->id);

    Mutabaah::factory()->create([
        'santri_id' => $santri->id,
        'tanggal' => '2026-01-03',
        'halaman' => 7,
    ]);

    $this->get(route('ustadz.halaqahs.santris.show', ['halaqah' => $halaqah, 'bulan' => 1]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('ustadz/halaqahs/santris')
            ->where('bulan', 1)
            ->has('bulanan.0', fn ($row) => $row
                ->where('santri_id', $santri->id)
                ->where('halaman_awal_bulan', 5)
                ->where('prefill_kumulatif', 12)
                ->etc()));
});
