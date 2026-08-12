<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('santris', function (Blueprint $table) {
            $table->integer('halaman_awal')->nullable()->after('status');
            $table->string('jenis')->nullable()->after('halaman_awal'); // ikhwan|akhwat|null
        });
    }

    public function down(): void
    {
        Schema::table('santris', function (Blueprint $table) {
            $table->dropColumn(['halaman_awal', 'jenis']);
        });
    }
};
