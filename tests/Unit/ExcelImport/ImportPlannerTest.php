<?php

use App\Enums\UserRole;
use App\Models\Halaqah;
use App\Models\Santri;
use App\Models\User;
use App\Models\Ustadz;
use App\Services\ExcelImport\ExcelReader;
use App\Services\ExcelImport\ImportPlan;
use App\Services\ExcelImport\ImportPlanner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\ExcelFixtures;
use Tests\TestCase;

uses(RefreshDatabase::class, TestCase::class);

function planDariWorkbook(array $rows): ImportPlan
{
    $path = ExcelFixtures::dataKelompokXlsx($rows);
    $wb = app(ExcelReader::class)->readDataKelompok($path);

    return app(ImportPlanner::class)->plan($wb);
}

test('planner mengklasifikasikan create, placeholder, dan error', function () {
    $plan = planDariWorkbook([
        ['jenis' => 'Ikhwan', 'kelompok' => 'Kelompok 1', 'muhafidz' => 'Hammam', 'nama' => 'Yahya', 'halamanAwal' => 0],
        ['jenis' => 'Ikhwan', 'kelompok' => 'Kelompok 1', 'muhafidz' => 'Hammam', 'nama' => 'Nama 2', 'halamanAwal' => 0],
        ['jenis' => 'Lainnya', 'kelompok' => 'Kelompok 1', 'muhafidz' => 'Hammam', 'nama' => 'Budi', 'halamanAwal' => 0],
    ]);

    $santri = collect($plan->items)->where('type', 'santri');
    expect($santri->where('action', 'create')->first()->nama)->toBe('Yahya');
    expect($santri->where('action', 'placeholder')->first()->reason)->toBeString();
    expect($santri->where('action', 'error')->first()->reason)->toBeString();
});

test('planner membuat email unik berdasar nama, in-file dan terhadap user existing', function () {
    User::factory()->create(['role' => UserRole::Santri, 'email' => 'yahya@simahal.test']);

    $plan = planDariWorkbook([
        ['jenis' => 'Ikhwan', 'kelompok' => 'Kelompok 1', 'muhafidz' => 'Hammam', 'nama' => 'Yahya', 'halamanAwal' => 0],
        ['jenis' => 'Ikhwan', 'kelompok' => 'Kelompok 2', 'muhafidz' => 'Rizkiansya Alfin', 'nama' => 'Yahya', 'halamanAwal' => 0],
        ['jenis' => 'Akhwat', 'kelompok' => 'Kelompok 1', 'muhafidz' => 'Asma Alhikmah', 'nama' => 'Yahya', 'halamanAwal' => 0],
    ]);

    $emails = collect($plan->items)->where('action', 'create')->where('type', 'santri')->pluck('email')->all();
    expect($emails)->toBe(['yahya-2@simahal.test', 'yahya-3@simahal.test', 'yahya-4@simahal.test']);
});

test('planner memetakan santri existing dengan jenis sama sebagai update', function () {
    $santri = Santri::factory()->create(['nama' => 'Yahya', 'jenis' => 'ikhwan', 'halaman_awal' => 1]);

    $plan = planDariWorkbook([
        ['jenis' => 'Ikhwan', 'kelompok' => 'Kelompok 1', 'muhafidz' => 'Hammam', 'nama' => 'Yahya', 'halamanAwal' => 4],
    ]);

    $item = collect($plan->items)->first(fn ($i) => $i->type === 'santri');
    expect($item->action->value)->toBe('update');
    expect($item->existingId)->toBe($santri->id);
});

test('planner menghasilkan nis urut dan grup dengan muhafidz placeholder diabaikan', function () {
    Santri::factory()->create(['nis' => 'SIM-2026-0007']);

    $plan = planDariWorkbook([
        ['jenis' => 'Ikhwan', 'kelompok' => 'Kelompok 1', 'muhafidz' => 'Hammam', 'nama' => 'Yahya', 'halamanAwal' => 0],
        ['jenis' => 'Ikhwan', 'kelompok' => 'Kelompok 1', 'muhafidz' => 'Hammam', 'nama' => 'Zuhdan Sahl Hunaif', 'halamanAwal' => 0],
        ['jenis' => 'Ikhwan', 'kelompok' => 'Kelompok 5', 'muhafidz' => 'Muhafidz Ikhwan 5', 'nama' => 'Nama 2', 'halamanAwal' => 0],
    ]);

    $nis = collect($plan->items)->where('type', 'santri')->where('action', 'create')->pluck('nis')->all();
    expect($nis)->toBe(['SIM-2026-0008', 'SIM-2026-0009']);

    expect($plan->items->where('type', 'halaqah')->pluck('nama'))->not->toContain('Kelompok 5 Ikhwan');
});

test('planner mencocokkan ustadz dan halaqah existing', function () {
    $ustadz = Ustadz::create(['user_id' => User::factory()->role(UserRole::Ustadz)->create()->id, 'nama' => 'Hammam']);
    $halaqah = Halaqah::create(['nama' => 'Kelompok 1 Ikhwan', 'ustadz_id' => $ustadz->id, 'status' => 'aktif']);

    $plan = planDariWorkbook([
        ['jenis' => 'Ikhwan', 'kelompok' => 'Kelompok 1', 'muhafidz' => 'Hammam', 'nama' => 'Yahya', 'halamanAwal' => 0],
    ]);

    $ustadzItem = $plan->items->first(fn ($i) => $i->type === 'ustadz');
    $halaqahItem = $plan->items->first(fn ($i) => $i->type === 'halaqah');
    expect($ustadzItem->action->value)->toBe('update');
    expect($ustadzItem->existingId)->toBe($ustadz->id);
    expect($halaqahItem->action->value)->toBe('update');
    expect($halaqahItem->existingId)->toBe($halaqah->id);
});
