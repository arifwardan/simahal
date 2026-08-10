<?php

namespace App\Actions\Mutabaah;

use App\Enums\MutabaahJenis;
use App\Enums\MutabaahStatus;
use App\Enums\TargetHafalanStatus;
use App\Models\Santri;

class RecalculateTargetProgress
{
    /**
     * Recalculate and store the ayat progress for the santri's active target.
     */
    public static function run(Santri $santri): void
    {
        $target = $santri->targetHafalans()
            ->where('status', TargetHafalanStatus::Berlangsung)
            ->latest('updated_at')
            ->latest('id')
            ->first();

        if ($target === null) {
            return;
        }

        $progress = $santri->mutabaahs()
            ->get()
            ->filter(fn ($mutabaah) => $mutabaah->jenis === MutabaahJenis::Setoran
                && $mutabaah->status === MutabaahStatus::Lulus)
            ->sum(fn ($mutabaah) => max(0, $mutabaah->ayat_selesai - $mutabaah->ayat_mulai + 1));

        $target->update(['progress' => min($progress, $target->target)]);
    }
}
