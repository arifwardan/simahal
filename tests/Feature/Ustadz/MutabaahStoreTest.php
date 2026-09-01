<?php

use App\Enums\MutabaahJenis;
use App\Enums\MutabaahStatus;
use App\Enums\UserRole;
use App\Models\Halaqah;
use App\Models\Muhafidz;
use App\Models\Mutabaah;
use App\Models\Santri;
use App\Models\TargetHafalan;
use App\Models\User;
use Tests\TestCase;

function makeActingMuhafidz(TestCase $test): Muhafidz
{
    $user = User::factory()->create(['role' => UserRole::Muhafidz]);
    $muhafidz = Muhafidz::factory()->create(['user_id' => $user->id]);
    $test->actingAs($user);

    return $muhafidz;
}

test('santri list page shows only halaqah members of the muhafidz', function () {
    $muhafidz = makeActingMuhafidz($this);
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $member = Santri::factory()->create();
    $halaqah->santris()->attach($member->id);
    $stranger = Santri::factory()->create();

    $this->get(route('muhafidz.halaqahs.santris.show', $halaqah))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('santris.data', 1));

    $this->assertTrue($stranger->halaqahs()->where('halaqah_id', $halaqah->id)->doesntExist());
});

test('muhafidz cannot open another muhafidz halaqah', function () {
    $muhafidz = makeActingMuhafidz($this);
    $other = Muhafidz::factory()->create();
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $other->id]);

    $this->get(route('muhafidz.halaqahs.santris.show', $halaqah))->assertForbidden();
});

test('muhafidz can record a mutabaah for a member santri of their halaqah', function () {
    $muhafidz = makeActingMuhafidz($this);
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create();
    $halaqah->santris()->attach($santri->id);
    TargetHafalan::factory()->create(['santri_id' => $santri->id, 'target' => 30]);

    $this->post(route('muhafidz.mutabaahs.store'), [
        'santri_id' => $santri->id,
        'tanggal' => now()->toDateString(),
        'jenis' => MutabaahJenis::Setoran->value,
        'surah' => 'Al-Fatihah',
        'ayat_mulai' => 1,
        'ayat_selesai' => 7,
        'nilai' => 90,
        'status' => MutabaahStatus::Lulus->value,
        'catatan' => 'Lancar.',
        'halaman' => 3,
    ])->assertRedirect();

    $this->assertDatabaseHas('mutabaahs', [
        'santri_id' => $santri->id,
        'muhafidz_id' => $muhafidz->id,
        'surah' => 'Al-Fatihah',
        'status' => MutabaahStatus::Lulus->value,
        'halaman' => 3,
    ]);

    expect($santri->targetHafalans()->first()->progress)->toBe(7);
});

test('muhafidz cannot set muhafidz_id for a mutabaah they do not own', function () {
    $muhafidz = makeActingMuhafidz($this);
    $other = Muhafidz::factory()->create();
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create();
    $halaqah->santris()->attach($santri->id);

    $this->post(route('muhafidz.mutabaahs.store'), [
        'santri_id' => $santri->id,
        'muhafidz_id' => $other->id,
        'tanggal' => now()->toDateString(),
        'jenis' => MutabaahJenis::Murajaah->value,
        'surah' => 'Al-Fatihah',
        'ayat_mulai' => 1,
        'ayat_selesai' => 7,
        'nilai' => 90,
        'status' => MutabaahStatus::Lulus->value,
        'halaman' => 3,
    ])->assertRedirect();

    expect(Mutabaah::latest()->first()->muhafidz_id)->toBe($muhafidz->id);
});

test('non-muhafidz cannot access muhafidz pages', function () {
    $santriUser = User::factory()->create(['role' => UserRole::Santri]);
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => Muhafidz::factory()->create()->id]);

    $this->actingAs($santriUser)->get(route('muhafidz.halaqahs.santris.show', $halaqah))->assertForbidden();
});

test('halaqah santri page exposes mutabaah modal data', function () {
    $muhafidz = makeActingMuhafidz($this);
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create();
    $halaqah->santris()->attach($santri->id);

    $this->get(route('muhafidz.halaqahs.santris.show', $halaqah))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('muhafidz/halaqahs/santris')
            ->has('jenisOptions')
            ->has('statusOptions')
            ->has('settings')
            ->has('bulanan', 1));
});

test('halaman is required to store a mutabaah', function () {
    $muhafidz = makeActingMuhafidz($this);
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create();
    $halaqah->santris()->attach($santri->id);

    $this->post(route('muhafidz.mutabaahs.store'), [
        'santri_id' => $santri->id,
        'tanggal' => now()->toDateString(),
        'jenis' => MutabaahJenis::Setoran->value,
        'surah' => 'Al-Fatihah',
        'ayat_mulai' => 1,
        'ayat_selesai' => 7,
        'status' => MutabaahStatus::Lulus->value,
    ])->assertSessionHasErrors('halaman');
});

test('santri shows mutabaah_hari_ini null when no record today', function () {
    $muhafidz = makeActingMuhafidz($this);
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create();
    $halaqah->santris()->attach($santri->id);

    $this->get(route('muhafidz.halaqahs.santris.show', $halaqah))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('muhafidz/halaqahs/santris')
            ->has('santris.data.0.mutabaah_hari_ini')
            ->where('santris.data.0.mutabaah_hari_ini', null));
});

test('santri shows latest mutabaah_hari_ini when recorded today', function () {
    $muhafidz = makeActingMuhafidz($this);
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create();
    $halaqah->santris()->attach($santri->id);

    Mutabaah::factory()->create([
        'santri_id' => $santri->id,
        'tanggal' => now()->toDateString(),
        'surah' => 'Al-Fatihah',
        'ayat_mulai' => 1,
        'ayat_selesai' => 7,
        'status' => 'lulus',
    ]);

    $this->get(route('muhafidz.halaqahs.santris.show', $halaqah))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('muhafidz/halaqahs/santris')
            ->has('santris.data.0.mutabaah_hari_ini', fn ($m) => $m
                ->where('surah', 'Al-Fatihah')
                ->where('status', 'lulus')
                ->etc()));
});
