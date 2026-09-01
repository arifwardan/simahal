<?php

namespace App\Http\Controllers\Admin;

use App\Actions\MutabaahBulanan\MutabaahBulananCalculator;
use App\Enums\MutabaahKategori;
use App\Enums\SantriJenis;
use App\Http\Controllers\Controller;
use App\Models\Halaqah;
use App\Models\MutabaahBulanan;
use App\Models\MutabaahSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MutabaahBulananDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $settings = MutabaahSetting::setting();
        $tahun = $settings->tahun_aktif;
        $bulan = $request->integer('bulan', now()->month);
        $bulan = max(1, min(12, $bulan));

        $calculator = app(MutabaahBulananCalculator::class);

        $bulanans = MutabaahBulanan::query()
            ->with(['santri.halaqahs.muhafidz'])
            ->where('tahun', $tahun)
            ->where('bulan', $bulan)
            ->get();

        $halaqahs = Halaqah::query()
            ->with(['muhafidz:id,nama', 'santris:id,jenis'])
            ->withCount('santris')
            ->orderBy('nama')
            ->get();

        $rows = $halaqahs->map(function (Halaqah $halaqah) use ($calculator, $settings, $bulanans): array {
            $santriIds = $halaqah->santris->pluck('id');

            $owned = $bulanans->filter(fn (MutabaahBulanan $mb) => $santriIds->contains($mb->santri_id));

            $berprestasi = $owned->filter(
                fn (MutabaahBulanan $mb) => $calculator->keterangan($mb, $settings->konversi_juz_halaman, $settings->ambang_hadiah_juz) === 'Berprestasi (Hadiah)',
            )->count();

            return [
                'jenis' => $this->jenisLabel($halaqah->santris->first()?->jenis),
                'kelompok' => $halaqah->nama,
                'muhafidz' => $halaqah->muhafidz?->nama,
                'jumlah_santri' => $halaqah->santris_count,
                'terisi' => $owned->count(),
                'rata_halaman_kumulatif' => $this->avg($owned->pluck('halaman_kumulatif')),
                'rata_tambah_juz' => $this->avg(
                    $owned->filter(fn (MutabaahBulanan $mb) => $mb->halaman_kumulatif !== null)
                        ->map(fn (MutabaahBulanan $mb) => $calculator->tambahJuz($mb, $settings->konversi_juz_halaman)),
                ),
                'rata_tasmi' => $this->avg($owned->map(fn (MutabaahBulanan $mb) => $calculator->rataTasmi($mb))),
                'rata_ujian' => $this->avg($owned->map(fn (MutabaahBulanan $mb) => $calculator->rataUjian($mb))),
                'berprestasi' => $berprestasi,
            ];
        });

        $distribusi = collect(MutabaahKategori::cases())->map(function (MutabaahKategori $kategori) use ($bulanans, $settings, $calculator): array {
            $countIkhwan = 0;
            $countAkhwat = 0;

            foreach ($bulanans as $mb) {
                if ($calculator->kategori($mb, $settings->konversi_juz_halaman) !== $kategori) {
                    continue;
                }

                if ($mb->santri?->jenis === SantriJenis::Ikhwan) {
                    $countIkhwan++;
                } elseif ($mb->santri?->jenis === SantriJenis::Akhwat) {
                    $countAkhwat++;
                }
            }

            return [
                'kategori' => $kategori->label(),
                'ikhwan' => $countIkhwan,
                'akhwat' => $countAkhwat,
                'total' => $countIkhwan + $countAkhwat,
            ];
        });

        return Inertia::render('admin/mutabaah-bulanan/index', [
            'rows' => $rows,
            'distribusi' => $distribusi,
            'settings' => $settings->only(['konversi_juz_halaman', 'ambang_hadiah_juz', 'tahun_aktif']),
            'bulan' => $bulan,
            'tahun' => $tahun,
        ]);
    }

    /**
     * @param  iterable<int, int|float|null>  $values
     */
    private function avg(iterable $values): ?float
    {
        $filtered = array_values(array_filter(
            iterator_to_array($values),
            fn ($value) => $value !== null,
        ));

        if ($filtered === []) {
            return null;
        }

        return round(array_sum($filtered) / count($filtered), 2);
    }

    private function jenisLabel(?SantriJenis $jenis): string
    {
        return $jenis?->label() ?? '-';
    }
}
