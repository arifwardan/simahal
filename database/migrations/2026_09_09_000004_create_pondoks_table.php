<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pondoks', function (Blueprint $table): void {
            $table->id();
            $table->string('nama_yayasan', 150);
            $table->string('slug', 50)->unique();
            $table->string('logo_path', 255)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pondoks');
    }
};
