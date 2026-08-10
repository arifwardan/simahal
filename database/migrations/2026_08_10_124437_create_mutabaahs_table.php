<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mutabaahs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('santri_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ustadz_id')->constrained()->cascadeOnDelete();
            $table->date('tanggal');
            $table->string('jenis')->default('setoran');
            $table->string('surah');
            $table->integer('ayat_mulai');
            $table->integer('ayat_selesai');
            $table->integer('nilai')->nullable();
            $table->string('status')->default('lulus');
            $table->text('catatan')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mutabaahs');
    }
};
