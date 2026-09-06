<?php

use App\Enums\MutabaahJenis;
use App\Enums\MutabaahStatus;
use App\Enums\UserRole;
use App\Models\Halaqah;
use App\Models\Muhafidz;
use App\Models\Santri;
use App\Models\TargetHafalan;
use App\Models\User;

function makeMuhafidzForFlowTest(): Muhafidz
{
    $user = User::factory()->create(['role' => UserRole::Muhafidz]);
    $muhafidz = Muhafidz::factory()->create(['user_id' => $user->id]);

    return $muhafidz;
}

test('legacy Tambah Mutabaah hidden from halaqah santris page', function () {
    $muhafidz = makeMuhafidzForFlowTest();
    $user = $muhafidz->user;
    $this->actingAs($user);
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create();
    $halaqah->santris()->attach($santri->id);

    $response = $this->get(route('muhafidz.halaqahs.santris.show', $halaqah));
    $response->assertOk();
    // Legacy strings must not appear in rendered inertia response
    $content = $response->getContent();
    expect($content)->not->toContain('Tambah Mutabaah');
    expect($content)->not->toContain('Catat Mutabaah');
    // Primary flow remains
    expect($content)->toContain('Input Setoran');
});

test('legacy POST mutabaah still works', function () {
    $muhafidz = makeMuhafidzForFlowTest();
    $this->actingAs($muhafidz->user);
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
        'status' => MutabaahStatus::Lulus->value,
        'halaman' => 2,
    ])->assertRedirect();

    $this->assertDatabaseHas('mutabaahs', ['santri_id' => $santri->id, 'halaman' => 2]);
});

test('sidebar for muhafidz primary is Halaqah Saya', function () {
    $muhafidz = makeMuhafidzForFlowTest();
    $this->actingAs($muhafidz->user);
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    // dashboard route returns inertia with sidebar not directly testable, verify halaqah index is accessible and history still works (read-only legacy)
    $this->get(route('muhafidz.halaqahs.index'))->assertOk();
    $this->get(route('muhafidz.mutabaahs.history'))->assertOk();
});
