<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('surahs', function (Blueprint $table): void {
            $table->id();
            $table->unsignedTinyInteger('nomor')->unique();
            $table->string('nama_latin', 50);
            $table->string('nama_arab', 50);
            $table->unsignedSmallInteger('jumlah_ayat');
            $table->unsignedTinyInteger('juz');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('surahs');
    }
};
