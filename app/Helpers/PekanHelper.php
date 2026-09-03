<?php

namespace App\Helpers;

use Carbon\Carbon;

class PekanHelper
{
    public static function pekanNumberInMonth(Carbon $senin): int
    {
        return intdiv($senin->day - 1, 7) + 1;
    }

    public static function pekanCountInMonth(int $tahun, int $bulan): int
    {
        $count = 0;
        $daysInMonth = Carbon::create($tahun, $bulan, 1)->daysInMonth;

        for ($day = 1; $day <= $daysInMonth; $day++) {
            if (Carbon::create($tahun, $bulan, $day)->isMonday()) {
                $count++;
            }
        }

        return $count;
    }

    /**
     * @return array{senin: Carbon, ahad: Carbon}
     */
    public static function weekRange(Carbon $minggu): array
    {
        $senin = $minggu->copy()->startOfWeek(Carbon::MONDAY);
        $ahad = $senin->copy()->addDays(6);

        return ['senin' => $senin, 'ahad' => $ahad];
    }

    public static function gradeLabel(?int $nilai): string
    {
        if ($nilai === null) {
            return '-';
        }

        if ($nilai >= 90) {
            return 'A';
        }

        if ($nilai >= 80) {
            return 'B';
        }

        if ($nilai >= 70) {
            return 'C';
        }

        if ($nilai >= 60) {
            return 'D';
        }

        return 'E';
    }
}
