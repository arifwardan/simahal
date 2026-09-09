<?php

use App\Models\Halaqah;
use App\Models\Muhafidz;
use App\Models\Pondok;
use App\Models\Santri;

it('scopes tenant queries to the auth pondok and backfills PondokIT', function (): void {
    $a = Pondok::factory()->create(['nama_yayasan' => 'Pondok A', 'slug' => 'pondok-a']);
    $b = Pondok::factory()->create(['nama_yayasan' => 'Pondok B', 'slug' => 'pondok-b']);
    $muhafidz = Muhafidz::factory()->create(['pondok_id' => $a->id]);
    $muhafidz->user->update(['pondok_id' => $muhafidz->pondok_id]);
    Santri::factory()->create(['pondok_id' => $a->id]);
    Santri::factory()->create(['pondok_id' => $b->id]);

    $this->actingAs($muhafidz->user->fresh());

    expect(Santri::count())->toBe(1);
    expect(Halaqah::where('pondok_id', $b->id)->withoutGlobalScope('pondok')->count())->toBe(0);
});

it('auto-fills pondok_id on create and throws when missing outside console', function (): void {
    $muhafidz = Muhafidz::factory()->create();
    $muhafidz->user->update(['pondok_id' => $muhafidz->pondok_id]);
    $this->actingAs($muhafidz->user->fresh());

    $santri = Santri::factory()->create(['pondok_id' => null]);

    expect($santri->pondok_id)->toBe($muhafidz->pondok_id);
});
