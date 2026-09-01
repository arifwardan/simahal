<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('halaqah_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('halaqah_id')->constrained()->cascadeOnDelete();
            $table->string('hari');
            $table->time('jam_mulai');
            $table->time('jam_selesai');
            $table->timestamps();

            $table->unique(['halaqah_id', 'hari']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('halaqah_schedules');
    }
};
