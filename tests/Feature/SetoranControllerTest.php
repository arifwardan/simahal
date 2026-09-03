<?php

use App\Models\Halaqah;
use App\Models\HalaqahMember;
use App\Models\Muhafidz;
use App\Models\Mutabaah;
use App\Models\MutabaahBulanan;
use App\Models\Santri;
use Carbon\Carbon;

beforeEach(function (): void {
    $this->withoutVite();
});

it('muhafidz can view setoran 5 panels and total 25', function (): void {
    $muhafidz = Muhafidz::factory()->create();
    $user = $muhafidz->user;
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create();
    HalaqahMember::factory()->create(['halaqah_id' => $halaqah->id, 'santri_id' => $santri->id]);

    // Seed 5 mutabaahs Mon-Fri 5 halaman each => total 25
    $monday = Carbon::parse('2024-05-13'); // Monday
    foreach (range(0, 4) as $offset) {
        $date = $monday->copy()->addDays($offset)->toDateString();
        Mutabaah::factory()->create([
            'santri_id' => $santri->id,
            'muhafidz_id' => $muhafidz->id,
            'tanggal' => $date,
            'halaman' => 5,
        ]);
    }

    $this->actingAs($user)
        ->get(route('muhafidz.setoran.index', [$halaqah, 'minggu' => '2024-05-13', 'santri_id' => $santri->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('muhafidz/setoran/index')
            ->where('totalSepekan', 25)
            ->has('harian')
            ->has('minggu')
            ->has('halaqah')
        );
});

it('returns 403 if not own halaqah', function (): void {
    $muhafidz = Muhafidz::factory()->create();
    $user = $muhafidz->user;
    $other = Muhafidz::factory()->create();
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $other->id]);
    $santri = Santri::factory()->create();
    HalaqahMember::factory()->create(['halaqah_id' => $halaqah->id, 'santri_id' => $santri->id]);

    $this->actingAs($user)
        ->get(route('muhafidz.setoran.index', [$halaqah, 'minggu' => '2024-05-13', 'santri_id' => $santri->id]))
        ->assertForbidden();
});

it('stores upsert and tasmi grade', function (): void {
    $muhafidz = Muhafidz::factory()->create();
    $user = $muhafidz->user;
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create();
    HalaqahMember::factory()->create(['halaqah_id' => $halaqah->id, 'santri_id' => $santri->id]);

    $payload = [
        'halaqah_id' => $halaqah->id,
        'santri_id' => $santri->id,
        'minggu' => '2024-05-13',
        'harian' => [
            'senin' => 4,
            'selasa' => 4,
            'rabu' => 4,
            'kamis' => 4,
            'jumat' => 4,
            'sabtu' => null,
            'ahad' => null,
        ],
        'tasmi_pekan' => 85,
        'ujian_bulanan' => 90,
        'catatan_tasmi' => 'bagus',
        'catatan_ujian' => 'mumtaz',
    ];

    $this->actingAs($user)
        ->post(route('muhafidz.setoran.store'), $payload)
        ->assertRedirect();

    // Verify 5 mutabaahs upserted (senin-jumat)
    expect(Mutabaah::where('santri_id', $santri->id)->count())->toBe(5);
    $first = Mutabaah::where('santri_id', $santri->id)->whereDate('tanggal', '2024-05-13')->first();
    expect($first?->halaman)->toBe(4);

    // Re-post with updated senin to test upsert not duplicate
    $payload['harian']['senin'] = 7;
    $this->actingAs($user)->post(route('muhafidz.setoran.store'), $payload)->assertRedirect();
    expect(Mutabaah::where('santri_id', $santri->id)->count())->toBe(5);
    expect(Mutabaah::where('santri_id', $santri->id)->whereDate('tanggal', '2024-05-13')->first()->halaman)->toBe(7);

    // Verify MutabaahBulanan tasmi pekan N and ujian
    $bulanan = MutabaahBulanan::where('santri_id', $santri->id)->where('tahun', 2024)->where('bulan', 5)->first();
    expect($bulanan)->not->toBeNull();
    // pekan number for 2024-05-13 is intdiv(13-1,7)+1 = 2
    expect($bulanan->tasmi_pekan_2)->toBe(85);
    expect($bulanan->ujian_bulanan)->toBe(90);
    expect($bulanan->catatan_tasmi)->toBe('bagus');
    expect($bulanan->catatan_ujian)->toBe('mumtaz');
});
