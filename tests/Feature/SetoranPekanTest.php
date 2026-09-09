<?php

use App\Models\Halaqah;
use App\Models\HalaqahMember;
use App\Models\Muhafidz;
use App\Models\Mutabaah;
use App\Models\MutabaahBulanan;
use App\Models\Santri;

beforeEach(function (): void {
    $this->withoutVite();
});

it('pekan Mon 30 Sep stores tasmi under September bulan 9 not October', function (): void {
    $muhafidz = Muhafidz::factory()->create();
    $user = $muhafidz->user;
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create();
    HalaqahMember::factory()->create(['halaqah_id' => $halaqah->id, 'santri_id' => $santri->id]);

    // Monday 2024-09-30 -> Sunday 2024-10-06 crosses month
    $this->actingAs($user)->post(route('muhafidz.tasmi.store'), [
        'santri_id' => $santri->id,
        'minggu' => '2024-09-30',
        'tasmi_pekan' => 80,
        'catatan_tasmi' => 'pekan lintas bulan',
    ])->assertRedirect();

    // Should be stored under bulan 9 (September), tahun 2024, pekan 5
    $bulananSep = MutabaahBulanan::where('santri_id', $santri->id)->where('tahun', 2024)->where('bulan', 9)->first();
    expect($bulananSep)->not->toBeNull('MutabaahBulanan for September should exist');
    // 2024-09-30 => pekanNumber = intdiv(30-1,7)+1 = 5
    expect($bulananSep->tasmi_pekan_5)->toBe(80);
    expect($bulananSep->catatan_tasmi)->toBe('pekan lintas bulan');

    // Must NOT create October record
    $bulananOct = MutabaahBulanan::where('santri_id', $santri->id)->where('tahun', 2024)->where('bulan', 10)->first();
    expect($bulananOct)->toBeNull('Must not create MutabaahBulanan for October');

    // Tasmi index for that week shows minggu range + stored tasmi
    $this->actingAs($user)
        ->get(route('muhafidz.tasmi.index', ['minggu' => '2024-09-30', 'santri_id' => $santri->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('minggu.senin', '2024-09-30')
            ->where('minggu.ahad', '2024-10-06')
            ->where('minggu.pekan_ke', 5)
            ->where('tasmiPekan', 80)
        );
});

it('totalBulanan sums only the selected month on ujian index', function (): void {
    $muhafidz = Muhafidz::factory()->create();
    $user = $muhafidz->user;
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create();
    HalaqahMember::factory()->create(['halaqah_id' => $halaqah->id, 'santri_id' => $santri->id]);

    // Sep 30: 10 hal, Oct 1: 10 hal (same pekan, different months)
    Mutabaah::factory()->create([
        'santri_id' => $santri->id,
        'muhafidz_id' => $muhafidz->id,
        'tanggal' => '2024-09-30',
        'halaman' => 10,
    ]);
    Mutabaah::factory()->create([
        'santri_id' => $santri->id,
        'muhafidz_id' => $muhafidz->id,
        'tanggal' => '2024-10-01',
        'halaman' => 10,
    ]);

    // Add another mutabaah in October outside that pekan but same month Oct
    Mutabaah::factory()->create([
        'santri_id' => $santri->id,
        'muhafidz_id' => $muhafidz->id,
        'tanggal' => '2024-10-15',
        'halaman' => 7,
    ]);

    // totalBulanan for bulan 9 => only Sep mutabaahs
    $totalSep = (int) Mutabaah::where('santri_id', $santri->id)->whereYear('tanggal', 2024)->whereMonth('tanggal', 9)->sum('halaman');
    expect($totalSep)->toBe(10);

    $this->actingAs($user)
        ->get(route('muhafidz.ujian.index', ['tahun' => 2024, 'bulan' => 9, 'santri_id' => $santri->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('totalBulanan', 10));

    // totalBulanan for October includes Oct mutabaahs (10 from Oct 1 + 7 from Oct 15)
    $this->actingAs($user)
        ->get(route('muhafidz.ujian.index', ['tahun' => 2024, 'bulan' => 10, 'santri_id' => $santri->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('totalBulanan', 17));
});
