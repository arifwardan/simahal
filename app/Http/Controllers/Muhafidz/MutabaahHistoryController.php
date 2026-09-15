<?php

namespace App\Http\Controllers\Muhafidz;

use App\Http\Controllers\Controller;
use App\Models\MutabaahBulanan;
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
        $muhafidz = $request->user()->muhafidz;

        abort_unless($muhafidz !== null, 403, __('You do not have a muhafidz profile.'));

        $santriOptions = $muhafidz->halaqahs()
            ->with('santris:id,nama')
            ->get()
            ->flatMap->santris
            ->unique('id')
            ->values()
            ->map(fn (Santri $santri) => ['id' => $santri->id, 'nama' => $santri->nama]);

        $santriFilter = $request->integer('santri') ?: null;

        // Harian: mutabaahs harian
        $mutabaahs = $muhafidz->mutabaahs()
            ->with('santri')
            ->when($santriFilter, fn ($q) => $q->where('santri_id', $santriFilter))
            ->orderBy('tanggal', 'desc')
            ->paginate(6, ['*'], 'page_harian')
            ->withQueryString();

        // Mingguan: agregasi per pekan (batasi 1 tahun + 5000 baris agar tidak full-scan)
        $allForWeekly = $muhafidz->mutabaahs()
            ->select('id', 'santri_id', 'tanggal', 'jenis', 'status')
            ->with('santri:id,nama')
            ->when($santriFilter, fn ($q) => $q->where('santri_id', $santriFilter))
            ->whereDate('tanggal', '>=', now()->subYear()->toDateString())
            ->orderBy('tanggal', 'desc')
            ->limit(5000)
            ->get();

        $grouped = $allForWeekly->groupBy(function ($m) {
            $d = Carbon::parse($m->tanggal);

            return $d->copy()->startOfWeek()->toDateString();
        });

        $weeklyRows = $grouped->map(function ($items, $weekStart) {
            $start = Carbon::parse($weekStart);
            $end = $start->copy()->endOfWeek();
            $bySantri = $items->groupBy('santri_id')->map(fn ($g) => [
                'santri' => $g->first()->santri?->nama ?? '-',
                'count' => $g->count(),
            ])->values()->all();

            return [
                'week_start' => $start->toDateString(),
                'week_end' => $end->toDateString(),
                'label' => $start->format('d M Y').' - '.$end->format('d M Y'),
                'total' => $items->count(),
                'unique_santri' => $items->pluck('santri_id')->unique()->count(),
                'by_santri' => $bySantri,
                'items' => $items->take(3)->map(fn ($m) => [
                    'id' => $m->id,
                    'tanggal' => $m->tanggal,
                    'santri' => $m->santri?->only(['id', 'nama']),
                    'jenis' => $m->jenis->value,
                    'status' => $m->status->value,
                ])->all(),
            ];
        })->sortByDesc('week_start')->values();

        $pageMingguan = max(1, (int) $request->integer('page_mingguan', 1));
        $perPageMingguan = 6;
        $mingguan = new LengthAwarePaginator(
            $weeklyRows->forPage($pageMingguan, $perPageMingguan)->values(),
            $weeklyRows->count(),
            $perPageMingguan,
            $pageMingguan,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        // Bulanan: mutabaah_bulanans
        $santriIds = $santriOptions->pluck('id')->all();
        $bulananQuery = MutabaahBulanan::query()
            ->whereIn('santri_id', $santriIds)
            ->when($santriFilter, fn ($q) => $q->where('santri_id', $santriFilter))
            ->with('santri:id,nama,nis')
            ->orderByDesc('tahun')
            ->orderByDesc('bulan');

        $bulanan = $bulananQuery->paginate(6, ['*'], 'page_bulanan')->withQueryString();

        return Inertia::render('muhafidz/mutabaahs/history', [
            'mutabaahs' => $mutabaahs,
            'mingguan' => $mingguan,
            'bulanan' => $bulanan,
            'santriOptions' => $santriOptions,
            'filters' => [
                'santri' => $santriFilter,
            ],
        ]);
    }
}
