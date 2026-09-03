<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mutabaah_bulanans', function (Blueprint $table): void {
            if (! Schema::hasColumn('mutabaah_bulanans', 'ujian_bulanan')) {
                $table->integer('ujian_bulanan')->nullable()->after('tasmi_pekan_5');
            }
            if (! Schema::hasColumn('mutabaah_bulanans', 'catatan_tasmi')) {
                $table->text('catatan_tasmi')->nullable()->after('ujian_bulanan');
            }
            if (! Schema::hasColumn('mutabaah_bulanans', 'catatan_ujian')) {
                $table->text('catatan_ujian')->nullable()->after('catatan_tasmi');
            }
        });

        // Backfill ujian_bulanan from avg of ujian_soal_1..5 if those columns still exist.
        $hasUjianSoal = Schema::hasColumn('mutabaah_bulanans', 'ujian_soal_1')
            || Schema::hasColumn('mutabaah_bulanans', 'ujian_soal_2')
            || Schema::hasColumn('mutabaah_bulanans', 'ujian_soal_3')
            || Schema::hasColumn('mutabaah_bulanans', 'ujian_soal_4')
            || Schema::hasColumn('mutabaah_bulanans', 'ujian_soal_5');

        if ($hasUjianSoal) {
            $rows = DB::table('mutabaah_bulanans')->get();

            foreach ($rows as $row) {
                $values = array_filter([
                    $row->ujian_soal_1 ?? null,
                    $row->ujian_soal_2 ?? null,
                    $row->ujian_soal_3 ?? null,
                    $row->ujian_soal_4 ?? null,
                    $row->ujian_soal_5 ?? null,
                ], fn ($v) => $v !== null);

                if ($values !== []) {
                    $avg = (int) round(array_sum($values) / count($values));

                    DB::table('mutabaah_bulanans')
                        ->where('id', $row->id)
                        ->update(['ujian_bulanan' => $avg]);
                }
            }

            Schema::table('mutabaah_bulanans', function (Blueprint $table): void {
                foreach (['ujian_soal_1', 'ujian_soal_2', 'ujian_soal_3', 'ujian_soal_4', 'ujian_soal_5'] as $col) {
                    if (Schema::hasColumn('mutabaah_bulanans', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }
    }

    public function down(): void
    {
        Schema::table('mutabaah_bulanans', function (Blueprint $table): void {
            foreach (['ujian_soal_1', 'ujian_soal_2', 'ujian_soal_3', 'ujian_soal_4', 'ujian_soal_5'] as $col) {
                if (! Schema::hasColumn('mutabaah_bulanans', $col)) {
                    $table->integer($col)->nullable();
                }
            }
        });

        // Restore ujian_soal values from ujian_bulanan where possible (best effort).
        if (Schema::hasColumn('mutabaah_bulanans', 'ujian_bulanan')) {
            $rows = DB::table('mutabaah_bulanans')->whereNotNull('ujian_bulanan')->get();

            foreach ($rows as $row) {
                DB::table('mutabaah_bulanans')
                    ->where('id', $row->id)
                    ->update([
                        'ujian_soal_1' => $row->ujian_bulanan,
                        'ujian_soal_2' => $row->ujian_bulanan,
                        'ujian_soal_3' => $row->ujian_bulanan,
                        'ujian_soal_4' => $row->ujian_bulanan,
                        'ujian_soal_5' => $row->ujian_bulanan,
                    ]);
            }
        }

        Schema::table('mutabaah_bulanans', function (Blueprint $table): void {
            foreach (['ujian_bulanan', 'catatan_tasmi', 'catatan_ujian'] as $col) {
                if (Schema::hasColumn('mutabaah_bulanans', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
