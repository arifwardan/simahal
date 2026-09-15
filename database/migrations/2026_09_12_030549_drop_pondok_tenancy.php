<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
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

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::disableForeignKeyConstraints();

        foreach ($this->tables as $table) {
            if (Schema::hasColumn($table, 'pondok_id')) {
                Schema::table($table, function (Blueprint $table): void {
                    $table->dropForeign(['pondok_id']);
                    $table->dropColumn('pondok_id');
                });
            }
        }

        Schema::dropIfExists('pondoks');

        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
