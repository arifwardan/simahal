<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mutabaah_bulanans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('santri_id')->constrained()->cascadeOnDelete();
            $table->integer('tahun');
            $table->integer('bulan'); // 1..12
            $table->integer('halaman_awal_bulan')->nullable();
            $table->integer('halaman_kumulatif')->nullable();
            $table->string('juz_dihafal')->nullable();
            $table->integer('tasmi_pekan_1')->nullable();
            $table->integer('tasmi_pekan_2')->nullable();
            $table->integer('tasmi_pekan_3')->nullable();
            $table->integer('tasmi_pekan_4')->nullable();
            $table->integer('tasmi_pekan_5')->nullable();
            $table->integer('ujian_soal_1')->nullable();
            $table->integer('ujian_soal_2')->nullable();
            $table->integer('ujian_soal_3')->nullable();
            $table->integer('ujian_soal_4')->nullable();
            $table->integer('ujian_soal_5')->nullable();
            $table->timestamps();

            $table->unique(['santri_id', 'tahun', 'bulan']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mutabaah_bulanans');
    }
};
