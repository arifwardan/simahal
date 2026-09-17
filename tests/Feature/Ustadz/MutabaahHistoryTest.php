<?php

use App\Enums\UserRole;
use App\Models\Halaqah;
use App\Models\Muhafidz;
use App\Models\Mutabaah;
use App\Models\MutabaahBulanan;
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
    Mutabaah::factory()->count(3)->sequence(
        ['tanggal' => '2026-08-01'],
        ['tanggal' => '2026-08-02'],
        ['tanggal' => '2026-08-03'],
    )->create(['muhafidz_id' => $muhafidz->id, 'santri_id' => $santri->id]);
    $other = Muhafidz::factory()->create();
    Mutabaah::factory()->create(['muhafidz_id' => $other->id, 'santri_id' => $santri->id, 'tanggal' => '2026-08-04']);

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

test('bulanan history can be filtered by month and year', function () {
    $muhafidz = makingMuhafidz($this);
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create();
    $halaqah->santris()->attach($santri->id);
    MutabaahBulanan::factory()->create(['santri_id' => $santri->id, 'tahun' => 2026, 'bulan' => 9]);
    MutabaahBulanan::factory()->create(['santri_id' => $santri->id, 'tahun' => 2026, 'bulan' => 8]);

    $this->get(route('muhafidz.mutabaahs.history', ['bulan' => 9, 'tahun' => 2026]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('bulanan.data', 1)
            ->where('bulanan.data.0.bulan', 9)
            ->where('bulanan.data.0.tahun', 2026)
            ->where('filters.bulan', 9)
            ->where('filters.tahun', 2026)
            ->where('ringkasanBulanan.total', 1));
});

test('bulanan rows carry the average tasmi score and summary aggregates it', function () {
    $muhafidz = makingMuhafidz($this);
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create();
    $halaqah->santris()->attach($santri->id);
    MutabaahBulanan::factory()->create([
        'santri_id' => $santri->id,
        'tahun' => 2026,
        'bulan' => 9,
        'tasmi_pekan_1' => 80,
        'tasmi_pekan_2' => 90,
        'tasmi_pekan_3' => null,
        'tasmi_pekan_4' => null,
        'tasmi_pekan_5' => null,
        'ujian_bulanan' => 85,
    ]);

    $this->get(route('muhafidz.mutabaahs.history', ['bulan' => 9, 'tahun' => 2026]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('bulanan.data.0.rata_tasmi', 85)
            ->where('bulanan.data.0.tasmi_terisi', 2)
            ->where('ringkasanBulanan.rata_tasmi', 85)
            ->where('ringkasanBulanan.rata_ujian', 85));
});

test('out-of-range month and year filters are ignored', function () {
    $muhafidz = makingMuhafidz($this);
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create();
    $halaqah->santris()->attach($santri->id);
    MutabaahBulanan::factory()->create(['santri_id' => $santri->id, 'tahun' => 2026, 'bulan' => 9]);

    $this->get(route('muhafidz.mutabaahs.history', ['bulan' => 13, 'tahun' => 1999]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('bulanan.data', 1)
            ->where('filters.bulan', null)
            ->where('filters.tahun', null));
});
