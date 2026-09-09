<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mutabaah_bulanans', function (Blueprint $table): void {
            foreach (['ujian_soal_1', 'ujian_soal_2', 'ujian_soal_3', 'ujian_soal_4', 'ujian_soal_5'] as $col) {
                if (! Schema::hasColumn('mutabaah_bulanans', $col)) {
                    $table->boolean($col)->nullable()->after('tasmi_pekan_5');
                }
            }
        });
    }

    public function down(): void
    {
        Schema::table('mutabaah_bulanans', function (Blueprint $table): void {
            foreach (['ujian_soal_1', 'ujian_soal_2', 'ujian_soal_3', 'ujian_soal_4', 'ujian_soal_5'] as $col) {
                if (Schema::hasColumn('mutabaah_bulanans', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
