<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('halaqah_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('halaqah_id')->constrained()->cascadeOnDelete();
            $table->foreignId('santri_id')->constrained()->cascadeOnDelete();
            $table->date('joined_at')->nullable();
            $table->string('status')->default('aktif');
            $table->unique(['halaqah_id', 'santri_id']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('halaqah_members');
    }
};
