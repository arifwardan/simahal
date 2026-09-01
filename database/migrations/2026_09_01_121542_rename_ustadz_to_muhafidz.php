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
        if (Schema::hasTable('ustadzs')) {
            Schema::rename('ustadzs', 'muhafidzs');
        }

        // halaqahs.muhafidz_id
        if (Schema::hasTable('halaqahs') && Schema::hasColumn('halaqahs', 'ustadz_id')) {
            try {
                Schema::table('halaqahs', function (Blueprint $table): void {
                    $table->renameColumn('ustadz_id', 'muhafidz_id');
                });
            } catch (Throwable $e) {
                // SQLite fallback without doctrine/dbal
                DB::statement('ALTER TABLE halaqahs RENAME COLUMN ustadz_id TO muhafidz_id');
            }
        }

        // mutabaahs.muhafidz_id
        if (Schema::hasTable('mutabaahs') && Schema::hasColumn('mutabaahs', 'ustadz_id')) {
            try {
                Schema::table('mutabaahs', function (Blueprint $table): void {
                    $table->renameColumn('ustadz_id', 'muhafidz_id');
                });
            } catch (Throwable $e) {
                DB::statement('ALTER TABLE mutabaahs RENAME COLUMN ustadz_id TO muhafidz_id');
            }
        }

        DB::table('users')->where('role', 'ustadz')->update(['role' => 'muhafidz']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('muhafidzs')) {
            Schema::rename('muhafidzs', 'ustadzs');
        }
        if (Schema::hasTable('halaqahs') && Schema::hasColumn('halaqahs', 'muhafidz_id')) {
            try {
                Schema::table('halaqahs', function (Blueprint $table): void {
                    $table->renameColumn('muhafidz_id', 'ustadz_id');
                });
            } catch (Throwable $e) {
                DB::statement('ALTER TABLE halaqahs RENAME COLUMN muhafidz_id TO ustadz_id');
            }
        }
        if (Schema::hasTable('mutabaahs') && Schema::hasColumn('mutabaahs', 'muhafidz_id')) {
            try {
                Schema::table('mutabaahs', function (Blueprint $table): void {
                    $table->renameColumn('muhafidz_id', 'ustadz_id');
                });
            } catch (Throwable $e) {
                DB::statement('ALTER TABLE mutabaahs RENAME COLUMN muhafidz_id TO ustadz_id');
            }
        }
    }
};
