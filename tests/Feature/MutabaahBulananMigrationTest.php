<?php

use App\Models\MutabaahBulanan;
use Illuminate\Support\Facades\Schema;

it('has ujian_bulanan and catatan columns', function (): void {
    expect(Schema::hasColumn('mutabaah_bulanans', 'ujian_bulanan'))->toBeTrue();
    expect(Schema::hasColumn('mutabaah_bulanans', 'catatan_tasmi'))->toBeTrue();
    expect(Schema::hasColumn('mutabaah_bulanans', 'catatan_ujian'))->toBeTrue();
});

it('has boolean ujian_soal columns (benar/salah per soal, 20 poin)', function (): void {
    foreach (['ujian_soal_1', 'ujian_soal_2', 'ujian_soal_3', 'ujian_soal_4', 'ujian_soal_5'] as $col) {
        expect(Schema::hasColumn('mutabaah_bulanans', $col))->toBeTrue();
    }

    $model = new MutabaahBulanan;

    foreach (['ujian_soal_1', 'ujian_soal_2', 'ujian_soal_3', 'ujian_soal_4', 'ujian_soal_5'] as $col) {
        expect($model->getFillable())->toContain($col);
        expect($model->getCasts())->toHaveKey($col);
    }
});

it('allows fillable ujian_bulanan and catatan fields', function (): void {
    $model = new MutabaahBulanan;
    expect($model->getFillable())->toContain('ujian_bulanan');
    expect($model->getFillable())->toContain('catatan_tasmi');
    expect($model->getFillable())->toContain('catatan_ujian');
});
