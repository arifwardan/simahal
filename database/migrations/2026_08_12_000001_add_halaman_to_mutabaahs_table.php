<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mutabaahs', function (Blueprint $table) {
            $table->integer('halaman')->nullable()->after('ayat_selesai');
        });
    }

    public function down(): void
    {
        Schema::table('mutabaahs', function (Blueprint $table) {
            $table->dropColumn('halaman');
        });
    }
};
