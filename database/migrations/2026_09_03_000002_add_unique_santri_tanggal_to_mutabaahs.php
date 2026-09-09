<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Remove duplicates before adding unique index (keep latest)
        $duplicates = DB::table('mutabaahs')
            ->select('santri_id', 'tanggal', DB::raw('COUNT(*) as cnt'))
            ->groupBy('santri_id', 'tanggal')
            ->having(DB::raw('COUNT(*)'), '>', 1)
            ->get();

        foreach ($duplicates as $dup) {
            $ids = DB::table('mutabaahs')
                ->where('santri_id', $dup->santri_id)
                ->where('tanggal', $dup->tanggal)
                ->orderByDesc('id')
                ->pluck('id');
            $ids->shift();
            DB::table('mutabaahs')->whereIn('id', $ids)->delete();
        }

        Schema::table('mutabaahs', function (Blueprint $table): void {
            $table->unique(['santri_id', 'tanggal'], 'mutabaahs_santri_tanggal_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('mutabaahs', function (Blueprint $table): void {
            $table->dropUnique('mutabaahs_santri_tanggal_unique');
        });
    }
};
