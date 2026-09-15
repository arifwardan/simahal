<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('mutabaahs', function (Blueprint $table) {
            $table->index('santri_id');
            $table->index('muhafidz_id');
            $table->index('tanggal');
            $table->index(['santri_id', 'tanggal']);
        });

        Schema::table('mutabaah_bulanans', function (Blueprint $table) {
            $table->index('santri_id');
            $table->index(['tahun', 'bulan']);
            $table->index(['santri_id', 'tahun', 'bulan']);
        });

        Schema::table('target_hafalans', function (Blueprint $table) {
            $table->index('santri_id');
        });

        Schema::table('halaqah_members', function (Blueprint $table) {
            $table->index(['halaqah_id', 'santri_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('mutabaahs', function (Blueprint $table) {
            $table->dropIndex(['santri_id']);
            $table->dropIndex(['muhafidz_id']);
            $table->dropIndex(['tanggal']);
            $table->dropIndex(['santri_id', 'tanggal']);
        });

        Schema::table('mutabaah_bulanans', function (Blueprint $table) {
            $table->dropIndex(['santri_id']);
            $table->dropIndex(['tahun', 'bulan']);
            $table->dropIndex(['santri_id', 'tahun', 'bulan']);
        });

        Schema::table('target_hafalans', function (Blueprint $table) {
            $table->dropIndex(['santri_id']);
        });

        Schema::table('halaqah_members', function (Blueprint $table) {
            $table->dropIndex(['halaqah_id', 'santri_id']);
        });
    }
};
