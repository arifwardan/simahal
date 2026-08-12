<?php

use App\Enums\MutabaahJenis;
use App\Enums\MutabaahStatus;
use App\Enums\UserRole;
use App\Models\Halaqah;
use App\Models\Mutabaah;
use App\Models\Santri;
use App\Models\TargetHafalan;
use App\Models\User;
use App\Models\Ustadz;
use Tests\TestCase;

function makeActingUstadz(TestCase $test): Ustadz
{
    $user = User::factory()->create(['role' => UserRole::Ustadz]);
    $ustadz = Ustadz::factory()->create(['user_id' => $user->id]);
    $test->actingAs($user);

    return $ustadz;
}

test('santri list page shows only halaqah members of the ustadz', function () {
    $ustadz = makeActingUstadz($this);
    $halaqah = Halaqah::factory()->create(['ustadz_id' => $ustadz->id]);
    $member = Santri::factory()->create();
    $halaqah->santris()->attach($member->id);
    $stranger = Santri::factory()->create();

    $this->get(route('ustadz.halaqahs.santris.show', $halaqah))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('santris.data', 1));

    $this->assertTrue($stranger->halaqahs()->where('halaqah_id', $halaqah->id)->doesntExist());
});

test('ustadz cannot open another ustadz halaqah', function () {
    $ustadz = makeActingUstadz($this);
    $other = Ustadz::factory()->create();
    $halaqah = Halaqah::factory()->create(['ustadz_id' => $other->id]);

    $this->get(route('ustadz.halaqahs.santris.show', $halaqah))->assertForbidden();
});

test('ustadz can record a mutabaah for a member santri of their halaqah', function () {
    $ustadz = makeActingUstadz($this);
    $halaqah = Halaqah::factory()->create(['ustadz_id' => $ustadz->id]);
    $santri = Santri::factory()->create();
    $halaqah->santris()->attach($santri->id);
    TargetHafalan::factory()->create(['santri_id' => $santri->id, 'target' => 30]);

    $this->post(route('ustadz.mutabaahs.store'), [
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
        'ustadz_id' => $ustadz->id,
        'surah' => 'Al-Fatihah',
        'status' => MutabaahStatus::Lulus->value,
        'halaman' => 3,
    ]);

    expect($santri->targetHafalans()->first()->progress)->toBe(7);
});

test('ustadz cannot set ustadz_id for a mutabaah they do not own', function () {
    $ustadz = makeActingUstadz($this);
    $other = Ustadz::factory()->create();
    $halaqah = Halaqah::factory()->create(['ustadz_id' => $ustadz->id]);
    $santri = Santri::factory()->create();
    $halaqah->santris()->attach($santri->id);

    $this->post(route('ustadz.mutabaahs.store'), [
        'santri_id' => $santri->id,
        'ustadz_id' => $other->id,
        'tanggal' => now()->toDateString(),
        'jenis' => MutabaahJenis::Murajaah->value,
        'surah' => 'Al-Fatihah',
        'ayat_mulai' => 1,
        'ayat_selesai' => 7,
        'nilai' => 90,
        'status' => MutabaahStatus::Lulus->value,
        'halaman' => 3,
    ])->assertRedirect();

    expect(Mutabaah::latest()->first()->ustadz_id)->toBe($ustadz->id);
});

test('non-ustadz cannot access ustadz pages', function () {
    $santriUser = User::factory()->create(['role' => UserRole::Santri]);
    $halaqah = Halaqah::factory()->create(['ustadz_id' => Ustadz::factory()->create()->id]);

    $this->actingAs($santriUser)->get(route('ustadz.halaqahs.santris.show', $halaqah))->assertForbidden();
});

test('halaqah santri page exposes mutabaah modal data', function () {
    $ustadz = makeActingUstadz($this);
    $halaqah = Halaqah::factory()->create(['ustadz_id' => $ustadz->id]);
    $santri = Santri::factory()->create();
    $halaqah->santris()->attach($santri->id);

    $this->get(route('ustadz.halaqahs.santris.show', $halaqah))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('ustadz/halaqahs/santris')
            ->has('jenisOptions')
            ->has('statusOptions')
            ->has('settings')
            ->has('bulanan', 1));
});

test('halaman is required to store a mutabaah', function () {
    $ustadz = makeActingUstadz($this);
    $halaqah = Halaqah::factory()->create(['ustadz_id' => $ustadz->id]);
    $santri = Santri::factory()->create();
    $halaqah->santris()->attach($santri->id);

    $this->post(route('ustadz.mutabaahs.store'), [
        'santri_id' => $santri->id,
        'tanggal' => now()->toDateString(),
        'jenis' => MutabaahJenis::Setoran->value,
        'surah' => 'Al-Fatihah',
        'ayat_mulai' => 1,
        'ayat_selesai' => 7,
        'status' => MutabaahStatus::Lulus->value,
    ])->assertSessionHasErrors('halaman');
});
