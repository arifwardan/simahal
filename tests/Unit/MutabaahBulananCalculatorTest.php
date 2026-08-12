<?php

use App\Actions\MutabaahBulanan\MutabaahBulananCalculator;
use App\Enums\MutabaahJenis;
use App\Enums\MutabaahKategori;
use App\Enums\MutabaahStatus;
use App\Models\Mutabaah;
use App\Models\MutabaahBulanan;
use App\Models\Santri;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(RefreshDatabase::class, TestCase::class);

function makeBulanan(array $attributes = []): MutabaahBulanan
{
    $defaults = [
        'halaman_awal_bulan' => 10,
        'halaman_kumulatif' => 27,
    ];

    return MutabaahBulanan::factory()->create(array_merge($defaults, $attributes));
}

test('tambah halaman is kumulatif minus awal bulan', function () {
    $mb = makeBulanan(['halaman_awal_bulan' => 10, 'halaman_kumulatif' => 27]);

    expect(app(MutabaahBulananCalculator::class)->tambahHalaman($mb))->toBe(17);
});

test('tambah juz rounds to 2 decimals', function () {
    $mb = makeBulanan(['halaman_awal_bulan' => 10, 'halaman_kumulatif' => 27]);

    expect(app(MutabaahBulananCalculator::class)->tambahJuz($mb, 20))->toBe(0.85);
});

test('total juz uses halaman kumulatif over conversion', function () {
    $mb = makeBulanan(['halaman_kumulatif' => 40]);

    expect(app(MutabaahBulananCalculator::class)->totalJuz($mb, 20))->toBe(2.0);
});

test('kategori matches excel vlookup bins', function () {
    $calc = app(MutabaahBulananCalculator::class);

    expect($calc->kategori(makeBulanan(['halaman_kumulatif' => 17]), 20))
        ->toBe(MutabaahKategori::Setengah);
    expect($calc->kategori(makeBulanan(['halaman_kumulatif' => 40]), 20))
        ->toBe(MutabaahKategori::Dua);
    expect($calc->kategori(makeBulanan(['halaman_kumulatif' => null]), 20))
        ->toBeNull();
});

test('keterangan follows excel conditions', function () {
    $calc = app(MutabaahBulananCalculator::class);

    expect($calc->keterangan(makeBulanan(['halaman_kumulatif' => null]), 20, 1.5))
        ->toBe('Belum Diisi');
    expect($calc->keterangan(makeBulanan(['halaman_awal_bulan' => 10, 'halaman_kumulatif' => 45]), 20, 1.5))
        ->toBe('Berprestasi (Hadiah)'); // tambah 35 halaman = 1.75 juz
    expect($calc->keterangan(makeBulanan(['halaman_awal_bulan' => 10, 'halaman_kumulatif' => 12]), 20, 1.5))
        ->toBe('Di Bawah Target'); // tambah 2 halaman = 0.1 juz
    expect($calc->keterangan(makeBulanan(['halaman_awal_bulan' => 10, 'halaman_kumulatif' => 20]), 20, 1.5))
        ->toBe('Sesuai Target'); // tambah 10 halaman = 0.5 juz
});

test('rata tasmi and rata ujian ignore null values', function () {
    $calc = app(MutabaahBulananCalculator::class);

    $mb = makeBulanan([
        'tasmi_pekan_1' => 80,
        'tasmi_pekan_2' => null,
        'tasmi_pekan_3' => 90,
        'tasmi_pekan_4' => null,
        'tasmi_pekan_5' => 100,
        'ujian_soal_1' => 70,
        'ujian_soal_2' => 80,
        'ujian_soal_3' => null,
        'ujian_soal_4' => null,
        'ujian_soal_5' => null,
    ]);

    expect($calc->rataTasmi($mb))->toBe(90.0);
    expect($calc->rataUjian($mb))->toBe(75.0);
    expect($calc->rataTasmi(makeBulanan()))->toBeNull();
});

test('prefill kumulatif sums daily halaman onto halaman awal', function () {
    $santri = Santri::factory()->create(['halaman_awal' => 5]);

    Mutabaah::factory()->create([
        'santri_id' => $santri->id,
        'tanggal' => '2026-01-05',
        'halaman' => 3,
        'jenis' => MutabaahJenis::Setoran,
        'status' => MutabaahStatus::Lulus,
    ]);
    Mutabaah::factory()->create([
        'santri_id' => $santri->id,
        'tanggal' => '2026-01-12',
        'halaman' => 4,
        'jenis' => MutabaahJenis::Setoran,
        'status' => MutabaahStatus::Lulus,
    ]);

    $calc = app(MutabaahBulananCalculator::class);

    expect($calc->prefillKumulatif($santri, 1, 2026))->toBe(12); // 5 + 3 + 4
    expect($calc->prefillKumulatif($santri, 2, 2026))->toBeNull(); // tidak ada setoran
});

test('halaman awal bulan is santri halaman awal for january', function () {
    $santri = Santri::factory()->create(['halaman_awal' => 8]);
    $calc = app(MutabaahBulananCalculator::class);

    expect($calc->halamanAwalBulan($santri, 1, 2026))->toBe(8);
});

test('halaman awal bulan for february uses january kumulatif', function () {
    $santri = Santri::factory()->create(['halaman_awal' => 8]);
    MutabaahBulanan::factory()->create([
        'santri_id' => $santri->id,
        'tahun' => 2026,
        'bulan' => 1,
        'halaman_kumulatif' => 25,
    ]);
    $calc = app(MutabaahBulananCalculator::class);

    expect($calc->halamanAwalBulan($santri, 2, 2026))->toBe(25);
    expect($calc->halamanAwalBulan($santri, 2, 2027))->toBe(8); // fallback ke halaman_awal
});
