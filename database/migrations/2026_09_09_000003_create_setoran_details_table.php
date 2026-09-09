<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('setoran_details', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('mutabaah_id')->constrained('mutabaahs')->cascadeOnDelete();
            $table->foreignId('surah_id')->constrained('surahs')->restrictOnDelete();
            $table->unsignedTinyInteger('baris');
            $table->timestamps();
            $table->unique(['mutabaah_id', 'surah_id'], 'setoran_details_mutabaah_surah_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('setoran_details');
    }
};
