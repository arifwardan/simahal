<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mutabaah_settings', function (Blueprint $table) {
            $table->id();
            $table->integer('konversi_juz_halaman')->default(20); // 1 juz = 20 halaman
            $table->float('ambang_hadiah_juz')->default(1.5);
            $table->integer('tahun_aktif')->default(2026);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mutabaah_settings');
    }
};
