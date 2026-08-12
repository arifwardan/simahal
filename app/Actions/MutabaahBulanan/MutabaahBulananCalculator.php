<?php

namespace App\Actions\MutabaahBulanan;

use App\Enums\MutabaahKategori;
use App\Models\MutabaahBulanan;
use App\Models\Santri;

class MutabaahBulananCalculator
{
    public function tambahHalaman(MutabaahBulanan $mb): int
    {
        return $mb->halaman_kumulatif - $mb->halaman_awal_bulan;
    }

    public function tambahJuz(MutabaahBulanan $mb, int $konversiJuz): float
    {
        return round($this->tambahHalaman($mb) / $konversiJuz, 2);
    }

    public function totalJuz(MutabaahBulanan $mb, int $konversiJuz): float
    {
        return round($mb->halaman_kumulatif / $konversiJuz, 2);
    }

    public function kategori(MutabaahBulanan $mb, int $konversiJuz): ?MutabaahKategori
    {
        if ($mb->halaman_kumulatif === null) {
            return null;
        }

        return MutabaahKategori::forTotalJuz($this->totalJuz($mb, $konversiJuz));
    }

    public function keterangan(MutabaahBulanan $mb, int $konversiJuz, float $ambangHadiah): string
    {
        if ($mb->halaman_kumulatif === null) {
            return 'Belum Diisi';
        }

        $tambahJuz = $this->tambahJuz($mb, $konversiJuz);

        if ($tambahJuz >= $ambangHadiah) {
            return 'Berprestasi (Hadiah)';
        }

        if ($tambahJuz < 0.25) {
            return 'Di Bawah Target';
        }

        return 'Sesuai Target';
    }

    public function rataTasmi(MutabaahBulanan $mb): ?float
    {
        return $this->rataNilai([
            $mb->tasmi_pekan_1, $mb->tasmi_pekan_2, $mb->tasmi_pekan_3, $mb->tasmi_pekan_4, $mb->tasmi_pekan_5,
        ]);
    }

    public function rataUjian(MutabaahBulanan $mb): ?float
    {
        return $this->rataNilai([
            $mb->ujian_soal_1, $mb->ujian_soal_2, $mb->ujian_soal_3, $mb->ujian_soal_4, $mb->ujian_soal_5,
        ]);
    }

    /**
     * @param  array<int, int|null>  $values
     */
    private function rataNilai(array $values): ?float
    {
        $values = array_values(array_filter($values, fn ($value) => $value !== null));

        if ($values === []) {
            return null;
        }

        return round(array_sum($values) / count($values), 2);
    }

    public function halamanAwalBulan(Santri $santri, int $bulan, int $tahun): ?int
    {
        if ($bulan === 1) {
            return $santri->halaman_awal;
        }

        $previous = MutabaahBulanan::query()
            ->where('santri_id', $santri->id)
            ->where('tahun', $tahun)
            ->where('bulan', $bulan - 1)
            ->first();

        return $previous?->halaman_kumulatif ?? $santri->halaman_awal;
    }

    public function prefillKumulatif(Santri $santri, int $bulan, int $tahun): ?int
    {
        $halamanAwal = $this->halamanAwalBulan($santri, $bulan, $tahun) ?? 0;

        $sumHalaman = $santri->mutabaahs()
            ->whereYear('tanggal', $tahun)
            ->whereMonth('tanggal', $bulan)
            ->whereNotNull('halaman')
            ->sum('halaman');

        if ($sumHalaman <= 0) {
            return null;
        }

        return $halamanAwal + $sumHalaman;
    }
}
