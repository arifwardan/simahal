<?php

use App\Models\Halaqah;
use App\Models\HalaqahMember;
use App\Models\Santri;

it('creates a halaqah member via factory', function () {
    $member = HalaqahMember::factory()->create();

    expect($member)
        ->toBeInstanceOf(HalaqahMember::class)
        ->and($member->halaqah_id)->toBeInt()
        ->and($member->santri_id)->toBeInt()
        ->and($member->status->value)->toBe('aktif')
        ->and(Halaqah::find($member->halaqah_id))->not->toBeNull()
        ->and(Santri::find($member->santri_id))->not->toBeNull();
});
