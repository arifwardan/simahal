<?php

use Illuminate\Support\Facades\Schema;

test('all SIMAHAL domain tables exist', function () {
    $tables = ['ustadzs', 'orang_tuas', 'santris', 'halaqahs', 'halaqah_members', 'target_hafalans', 'mutabaahs', 'mutabaah_bulanans', 'mutabaah_settings'];

    foreach ($tables as $table) {
        expect(Schema::hasTable($table))->toBeTrue("table {$table} should exist");
    }
});
