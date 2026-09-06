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

        // Spec verbatim: sum halaman only; null halaman rows are ignored (backfilled via migration if needed).
        $progressHalaman = (int) $santri->mutabaahs()
            ->where('status', MutabaahStatus::Lulus)
            ->where('jenis', MutabaahJenis::Setoran)
            ->sum('halaman');

        // target disimpan Juz, progress disimpan halaman
        $targetHalaman = $target->target * 20;
        $target->update(['progress' => min($progressHalaman, $targetHalaman)]);
    }
}
