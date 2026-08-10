<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('target_hafalans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('santri_id')->constrained()->cascadeOnDelete();
            $table->string('periode');
            $table->integer('target');
            $table->integer('progress')->default(0);
            $table->string('status')->default('berlangsung');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('target_hafalans');
    }
};
