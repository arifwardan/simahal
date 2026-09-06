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

        $progressHalaman = $santri->mutabaahs()
            ->where('status', MutabaahStatus::Lulus)
            ->where('jenis', MutabaahJenis::Setoran)
            ->get()
            ->sum(function ($m) {
                if ($m->halaman !== null && $m->halaman > 0) {
                    return (int) $m->halaman;
                }

                return max(0, $m->ayat_selesai - $m->ayat_mulai + 1);
            });

        // target disimpan Juz, progress disimpan halaman
        $targetHalaman = $target->target * 20;
        $target->update(['progress' => min($progressHalaman, $targetHalaman)]);
    }
}
