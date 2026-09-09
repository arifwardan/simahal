<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * @var list<string>
     */
    private array $tables = [
        'users',
        'santris',
        'muhafidzs',
        'orang_tuas',
        'halaqahs',
        'mutabaahs',
        'mutabaah_bulanans',
        'target_hafalans',
        'setoran_details',
        'mutabaah_settings',
    ];

    public function up(): void
    {
        foreach ($this->tables as $table) {
            Schema::table($table, function (Blueprint $table): void {
                $table->foreignId('pondok_id')->nullable()->constrained('pondoks')->restrictOnDelete();
            });
        }

        Schema::table('users', function (Blueprint $table): void {
            $table->string('status', 20)->default('active');
        });

        $pondokId = DB::table('pondoks')->insertGetId([
            'nama_yayasan' => 'PondokIT',
            'slug' => 'pondokit',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        foreach ($this->tables as $table) {
            DB::table($table)->whereNull('pondok_id')->update(['pondok_id' => $pondokId]);
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn('status');
        });

        foreach ($this->tables as $table) {
            Schema::table($table, function (Blueprint $table): void {
                $table->dropConstrainedForeignId('pondok_id');
            });
        }
    }
};
