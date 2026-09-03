<?php

use App\Models\MutabaahBulanan;
use Illuminate\Support\Facades\Schema;

it('has ujian_bulanan and catatan columns', function (): void {
    expect(Schema::hasColumn('mutabaah_bulanans', 'ujian_bulanan'))->toBeTrue();
    expect(Schema::hasColumn('mutabaah_bulanans', 'catatan_tasmi'))->toBeTrue();
    expect(Schema::hasColumn('mutabaah_bulanans', 'catatan_ujian'))->toBeTrue();
});

it('drops legacy ujian_soal columns', function (): void {
    expect(Schema::hasColumn('mutabaah_bulanans', 'ujian_soal_1'))->toBeFalse();
    expect(Schema::hasColumn('mutabaah_bulanans', 'ujian_soal_2'))->toBeFalse();
    expect(Schema::hasColumn('mutabaah_bulanans', 'ujian_soal_3'))->toBeFalse();
    expect(Schema::hasColumn('mutabaah_bulanans', 'ujian_soal_4'))->toBeFalse();
    expect(Schema::hasColumn('mutabaah_bulanans', 'ujian_soal_5'))->toBeFalse();
});

it('allows fillable ujian_bulanan and catatan fields', function (): void {
    $model = new MutabaahBulanan;
    expect($model->getFillable())->toContain('ujian_bulanan');
    expect($model->getFillable())->toContain('catatan_tasmi');
    expect($model->getFillable())->toContain('catatan_ujian');
});
