<?php

namespace App\Http\Controllers\Admin;

use App\Actions\MutabaahBulanan\MutabaahBulananCalculator;
use App\Enums\MutabaahKategori;
use App\Enums\SantriJenis;
use App\Http\Controllers\Controller;
use App\Models\Halaqah;
use App\Models\Mutabaah;
use App\Models\MutabaahBulanan;
use App\Models\MutabaahSetting;
use App\Models\Santri;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;
use Inertia\Response;

class MutabaahHistoryController extends Controller
{
    public function index(Request $request): Response
    {
        $santriFilter = $request->integer('santri') ?: null;
        $halaqahFilter = $request->integer('halaqah') ?: null;

        $santriOptions = Santri::query()->orderBy('nama')->get(['id', 'nama', 'nis']);
        $halaqahOptions = Halaqah::query()->with('muhafidz:id,nama')->orderBy('nama')->get(['id', 'nama', 'muhafidz_id']);

        // Harian: semua mutabaah
        $harianQuery = Mutabaah::query()
            ->with(['santri:id,nama,nis', 'muhafidz:id,nama'])
            ->when($santriFilter, fn ($q) => $q->where('santri_id', $santriFilter))
            ->when($halaqahFilter, function ($q) use ($halaqahFilter) {
                $ids = Halaqah::find($halaqahFilter)?->santris()->pluck('santris.id')->all() ?? [];
                $q->whereIn('santri_id', $ids);
            })
            ->orderBy('tanggal', 'desc');

        $mutabaahs = $harianQuery->paginate(8, ['*'], 'page_harian')->withQueryString();

        // Mingguan: agregasi per pekan dari mutabaah harian
        $allForWeekly = (clone $harianQuery)->get();
        $grouped = $allForWeekly->groupBy(fn ($m) => Carbon::parse($m->tanggal)->copy()->startOfWeek()->toDateString());

        $weeklyRows = $grouped->map(function ($items, $weekStart) {
            $start = Carbon::parse($weekStart);
            $end = $start->copy()->endOfWeek();
            $bySantri = $items->groupBy('santri_id')->map(fn ($g) => [
                'santri' => $g->first()->santri?->nama ?? '-',
                'count' => $g->count(),
            ])->values()->all();

            $byHalaqah = $items->groupBy(fn ($m) => $m->santri?->halaqahs->first()?->nama ?? '-')
                ->map(fn ($g, $name) => ['halaqah' => $name, 'count' => $g->count()])
                ->values()->all();

            return [
                'week_start' => $start->toDateString(),
                'week_end' => $end->toDateString(),
                'label' => $start->format('d M Y').' - '.$end->format('d M Y'),
                'total' => $items->count(),
                'unique_santri' => $items->pluck('santri_id')->unique()->count(),
                'by_santri' => $bySantri,
                'by_halaqah' => $byHalaqah,
                'items' => $items->take(3)->map(fn ($m) => [
                    'id' => $m->id,
                    'tanggal' => $m->tanggal,
                    'santri' => $m->santri?->only(['id', 'nama']),
                    'muhafidz' => $m->muhafidz?->only(['id', 'nama']),
                    'jenis' => $m->jenis->value,
                    'status' => $m->status->value,
                ])->all(),
            ];
        })->sortByDesc('week_start')->values();

        $pageMingguan = max(1, (int) $request->integer('page_mingguan', 1));
        $perPage = 6;
        $mingguan = new LengthAwarePaginator(
            $weeklyRows->forPage($pageMingguan, $perPage)->values(),
            $weeklyRows->count(),
            $perPage,
            $pageMingguan,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        // Bulanan: mutabaah_bulanans
        $bulananQuery = MutabaahBulanan::query()
            ->with(['santri:id,nama,nis'])
            ->when($santriFilter, fn ($q) => $q->where('santri_id', $santriFilter))
            ->when($halaqahFilter, function ($q) use ($halaqahFilter) {
                $ids = Halaqah::find($halaqahFilter)?->santris()->pluck('santris.id')->all() ?? [];
                $q->whereIn('santri_id', $ids);
            })
            ->orderByDesc('tahun')
            ->orderByDesc('bulan');

        $bulanan = $bulananQuery->paginate(8, ['*'], 'page_bulanan')->withQueryString();

        // Rekap bulanan per halaqah (gabungan dari dashboard lama)
        $settings = MutabaahSetting::setting();
        $rekapTahun = $settings->tahun_aktif;
        $rekapBulan = $request->integer('rekap_bulan', (int) now()->month);
        $rekapBulan = max(1, min(12, $rekapBulan));
        $calculator = app(MutabaahBulananCalculator::class);
        $rekapBulanans = MutabaahBulanan::query()->with(['santri.halaqahs.muhafidz'])->where('tahun', $rekapTahun)->where('bulan', $rekapBulan)->get();
        $rekapHalaqahs = Halaqah::query()->with(['muhafidz:id,nama', 'santris:id,jenis'])->withCount('santris')->orderBy('nama')->get();
        $rekapRows = $rekapHalaqahs->map(function (Halaqah $halaqah) use ($calculator, $settings, $rekapBulanans): array {
            $ids = $halaqah->santris->pluck('id');
            $owned = $rekapBulanans->filter(fn (MutabaahBulanan $mb) => $ids->contains($mb->santri_id));
            $berprestasi = $owned->filter(fn (MutabaahBulanan $mb) => $calculator->keterangan($mb, $settings->konversi_juz_halaman, $settings->ambang_hadiah_juz) === 'Berprestasi (Hadiah)')->count();

            return [
                'jenis' => $halaqah->santris->first()?->jenis?->label() ?? '-',
                'kelompok' => $halaqah->nama,
                'muhafidz' => $halaqah->muhafidz?->nama,
                'jumlah_santri' => $halaqah->santris_count,
                'terisi' => $owned->count(),
                'rata_halaman_kumulatif' => $this->avg($owned->pluck('halaman_kumulatif')),
                'rata_tambah_juz' => $this->avg($owned->filter(fn ($mb) => $mb->halaman_kumulatif !== null)->map(fn ($mb) => $calculator->tambahJuz($mb, $settings->konversi_juz_halaman))),
                'rata_tasmi' => $this->avg($owned->map(fn ($mb) => $calculator->rataTasmi($mb))),
                'rata_ujian' => $this->avg($owned->map(fn ($mb) => $calculator->rataUjian($mb))),
                'berprestasi' => $berprestasi,
            ];
        })->values()->all();
        $rekapDistribusi = collect(MutabaahKategori::cases())->map(function (MutabaahKategori $kategori) use ($rekapBulanans, $settings, $calculator): array {
            $ikhwan = 0;
            $akhwat = 0;
            foreach ($rekapBulanans as $mb) {
                if ($calculator->kategori($mb, $settings->konversi_juz_halaman) !== $kategori) {
                    continue;
                }
                if ($mb->santri?->jenis === SantriJenis::Ikhwan) {
                    $ikhwan++;
                } elseif ($mb->santri?->jenis === SantriJenis::Akhwat) {
                    $akhwat++;
                }
            }

            return ['kategori' => $kategori->label(), 'ikhwan' => $ikhwan, 'akhwat' => $akhwat, 'total' => $ikhwan + $akhwat];
        })->values()->all();

        return Inertia::render('admin/mutabaahs/history', [
            'mutabaahs' => $mutabaahs,
            'mingguan' => $mingguan,
            'bulanan' => $bulanan,
            'rekap' => [
                'rows' => $rekapRows,
                'distribusi' => $rekapDistribusi,
                'bulan' => $rekapBulan,
                'tahun' => $rekapTahun,
                'settings' => $settings->only(['konversi_juz_halaman', 'ambang_hadiah_juz', 'tahun_aktif']),
            ],
            'santriOptions' => $santriOptions->map(fn ($s) => ['id' => $s->id, 'nama' => $s->nama]),
            'halaqahOptions' => $halaqahOptions->map(fn ($h) => ['id' => $h->id, 'nama' => $h->nama, 'muhafidz' => $h->muhafidz?->nama]),
            'filters' => [
                'santri' => $santriFilter,
                'halaqah' => $halaqahFilter,
                'rekap_bulan' => $rekapBulan,
            ],
        ]);
    }

    /** @param iterable<int, int|float|null> $values */
    private function avg(iterable $values): ?float
    {
        $filtered = array_values(array_filter(iterator_to_array($values), fn ($v) => $v !== null));
        if ($filtered === []) {
            return null;
        }

        return round(array_sum($filtered) / count($filtered), 2);
    }
}
