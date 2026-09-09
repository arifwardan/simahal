<?php

namespace App\Http\Controllers;

use App\Enums\MutabaahStatus;
use App\Enums\SantriJenis;
use App\Enums\TargetHafalanStatus;
use App\Enums\UserRole;
use App\Models\Halaqah;
use App\Models\Muhafidz;
use App\Models\Mutabaah;
use App\Models\MutabaahBulanan;
use App\Models\OrangTua;
use App\Models\Santri;
use App\Models\TargetHafalan;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        return match ($user->role) {
            UserRole::Admin => $this->admin(),
            UserRole::Muhafidz => $this->muhafidz($user),
            UserRole::Santri => $this->santri($user->santri),
            UserRole::OrangTua => $this->orangTua($user->orangTua),
        };
    }

    private function admin(): Response
    {
        $now = now();

        // Halaqah terpadat & perhatian
        $topHalaqahs = Halaqah::query()
            ->with(['muhafidz:id,nama'])
            ->withCount('santris')
            ->orderByDesc('santris_count')
            ->limit(3)
            ->get()
            ->map(fn (Halaqah $h) => [
                'id' => $h->id,
                'nama' => $h->nama,
                'santris_count' => $h->santris_count,
                'muhafidz' => $h->muhafidz?->nama,
                'jam' => $h->jam_mulai && $h->jam_selesai ? substr($h->jam_mulai, 0, 5).' - '.substr($h->jam_selesai, 0, 5) : null,
            ]);

        $santriTanpaHalaqah = Santri::query()->whereDoesntHave('halaqahs')->count();
        $targetTertunda = TargetHafalan::query()
            ->where('status', TargetHafalanStatus::Berlangsung)
            ->whereColumn('progress', '<', 'target')
            ->count();

        // Mutabaah hari ini global
        $mutabaahHariIni = Mutabaah::query()->whereDate('tanggal', $now->toDateString())->count();
        $mutabaahKemarin = Mutabaah::query()->whereDate('tanggal', $now->copy()->subDay()->toDateString())->count();

        // Harian / Mingguan / Bulanan global
        $mutabaahsThisWeek = $this->mutabaahCountInWeek(Mutabaah::query(), $now);
        $mutabaahsLastWeek = $this->mutabaahCountInWeek(Mutabaah::query(), $now->copy()->subWeek());
        $weeklyTrend = collect(range(3, 0))->map(function (int $offset) use ($now) {
            $date = $now->copy()->subWeeks($offset);

            return [
                'label' => $date->copy()->startOfWeek()->format('d/m').' - '.$date->copy()->endOfWeek()->format('d/m'),
                'week_start' => $date->copy()->startOfWeek()->toDateString(),
                'week_end' => $date->copy()->endOfWeek()->toDateString(),
                'count' => $this->mutabaahCountInWeek(Mutabaah::query(), $date),
            ];
        })->all();

        $bulananTotal = MutabaahBulanan::query()->count();
        $bulananBulanIni = MutabaahBulanan::query()->where('tahun', (int) $now->year)->where('bulan', (int) $now->month)->count();
        $bulananBulanLaluDate = $now->copy()->subMonth();
        $bulananBulanLalu = MutabaahBulanan::query()->where('tahun', (int) $bulananBulanLaluDate->year)->where('bulan', (int) $bulananBulanLaluDate->month)->count();
        $recentBulanan = MutabaahBulanan::query()->with('santri:id,nama')->orderByDesc('tahun')->orderByDesc('bulan')->limit(5)->get();

        return Inertia::render('dashboard/admin', [
            'counts' => [
                'santris' => Santri::count(),
                'muhafidzs' => Muhafidz::count(),
                'orangTuas' => OrangTua::count(),
                'halaqahs' => Halaqah::count(),
                'mutabaahs' => Mutabaah::count(),
            ],
            'recentMutabaahs' => Mutabaah::query()
                ->with('santri')
                ->orderBy('tanggal', 'desc')
                ->limit(5)
                ->get(),
            'mutabaahByStatus' => $this->mutabaahStatusDistribution(Mutabaah::query()),
            'santriByJenis' => $this->santriJenisDistribution(),
            'mutabaahsThisMonth' => $this->mutabaahCountInMonth(Mutabaah::query(), $now),
            'mutabaahsLastMonth' => $this->mutabaahCountInMonth(Mutabaah::query(), $now->copy()->subMonth()),
            'mutabaahsThisWeek' => $mutabaahsThisWeek,
            'mutabaahsLastWeek' => $mutabaahsLastWeek,
            'weeklyTrend' => $weeklyTrend,
            'bulanan' => [
                'total' => $bulananTotal,
                'bulanIni' => $bulananBulanIni,
                'bulanLalu' => $bulananBulanLalu,
                'tahun' => (int) $now->year,
                'bulan' => (int) $now->month,
                'recent' => $recentBulanan,
            ],
            'santrisThisMonth' => Santri::query()
                ->whereYear('created_at', $now->year)
                ->whereMonth('created_at', $now->month)
                ->count(),
            'topSantris' => $this->topSantris(null, 5),
            'topHalaqahs' => $topHalaqahs,
            'perhatian' => [
                'santriTanpaHalaqah' => $santriTanpaHalaqah,
                'targetTertunda' => $targetTertunda,
            ],
            'hariIni' => [
                'mutabaahHariIni' => $mutabaahHariIni,
                'mutabaahKemarin' => $mutabaahKemarin,
            ],
        ]);
    }

    private function muhafidz(User $user): Response
    {
        $muhafidz = $user->muhafidz;

        abort_unless($muhafidz !== null, 403, __('You do not have a muhafidz profile.'));

        $halaqahs = $muhafidz->halaqahs()
            ->withCount('santris')
            ->orderBy('nama')
            ->get();

        $recentMutabaahs = $muhafidz->mutabaahs()
            ->with('santri')
            ->orderBy('tanggal', 'desc')
            ->limit(5)
            ->get();

        $now = now();

        $santriIds = $muhafidz->halaqahs()
            ->with('santris:id,nama')
            ->get()
            ->flatMap(fn (Halaqah $h) => $h->santris->pluck('id'))
            ->unique()
            ->values()
            ->all();

        // Ringkasan harian / mingguan / bulanan (mutabaah harian)
        $weekStart = $now->copy()->startOfWeek();
        $weekEnd = $now->copy()->endOfWeek();
        $lastWeekStart = $now->copy()->subWeek()->startOfWeek();
        $lastWeekEnd = $now->copy()->subWeek()->endOfWeek();

        $mutabaahsThisWeek = $this->mutabaahCountInWeek($muhafidz->mutabaahs(), $now);
        $mutabaahsLastWeek = $this->mutabaahCountInWeek($muhafidz->mutabaahs(), $now->copy()->subWeek());

        // 4 minggu terakhir untuk sparkline
        $weeklyTrend = collect(range(3, 0))->map(function (int $offset) use ($muhafidz, $now) {
            $date = $now->copy()->subWeeks($offset);
            $start = $date->copy()->startOfWeek()->toDateString();
            $end = $date->copy()->endOfWeek()->toDateString();

            return [
                'label' => $date->copy()->startOfWeek()->format('d/m').' - '.$date->copy()->endOfWeek()->format('d/m'),
                'week_start' => $start,
                'week_end' => $end,
                'count' => $this->mutabaahCountInWeek($muhafidz->mutabaahs(), $date),
            ];
        })->all();

        // Mutabaah bulanan (tabel mutabaah_bulanans)
        $currentTahun = (int) $now->year;
        $currentBulan = (int) $now->month;
        $bulananQuery = MutabaahBulanan::query()->whereIn('santri_id', $santriIds);
        $totalBulanan = (clone $bulananQuery)->count();
        $bulananBulanIni = (clone $bulananQuery)->where('tahun', $currentTahun)->where('bulan', $currentBulan)->count();
        $bulananBulanLaluDate = $now->copy()->subMonth();
        $bulananBulanLalu = (clone $bulananQuery)->where('tahun', (int) $bulananBulanLaluDate->year)->where('bulan', (int) $bulananBulanLaluDate->month)->count();
        $recentBulanan = MutabaahBulanan::query()
            ->whereIn('santri_id', $santriIds)
            ->with('santri:id,nama')
            ->orderByDesc('tahun')
            ->orderByDesc('bulan')
            ->limit(5)
            ->get();

        // Hari ini
        $today = $now->toDateString();
        $sudahHariIniIds = $muhafidz->mutabaahs()->whereDate('tanggal', $today)->pluck('santri_id')->unique()->all();
        $belumHariIni = Santri::query()->whereIn('id', $santriIds)->whereNotIn('id', $sudahHariIniIds)->limit(5)->get(['id', 'nama']);
        $hariIni = [
            'tanggal' => $today,
            'sudah' => count($sudahHariIniIds),
            'total' => count($santriIds),
            'percent' => count($santriIds) > 0 ? (int) round(count($sudahHariIniIds) / count($santriIds) * 100) : 0,
            'belum' => $belumHariIni->map(fn (Santri $s) => ['id' => $s->id, 'nama' => $s->nama])->all(),
        ];

        // Perlu perhatian: progress <30% atau status mengulang/perlu
        $perhatian = Santri::query()
            ->whereIn('id', $santriIds)
            ->with(['targetHafalans', 'mutabaahs' => fn ($q) => $q->latest('tanggal')->limit(1)])
            ->get()
            ->filter(function (Santri $s) {
                $p = $this->progressData($s);
                $lastStatus = $s->mutabaahs->first()?->status?->value;

                return $p['percent'] < 30 || in_array($lastStatus, ['mengulang', 'perlu_murajaah'], true);
            })
            ->take(5)
            ->map(fn (Santri $s) => [
                'id' => $s->id,
                'nama' => $s->nama,
                'nis' => $s->nis,
                'percent' => $this->progressData($s)['percent'],
                'lastStatus' => $s->mutabaahs->first()?->status?->label() ?? '-',
            ])
            ->values()
            ->all();

        // Halaqah performance: avg progress per halaqah
        $halaqahPerf = $halaqahs->map(function (Halaqah $h) {
            $ids = $h->santris->pluck('id')->all();
            $avg = 0;
            if (count($ids) > 0) {
                $total = 0;
                $count = 0;
                foreach (Santri::whereIn('id', $ids)->get() as $s) {
                    $total += $this->progressData($s)['percent'];
                    $count++;
                }
                $avg = $count > 0 ? (int) round($total / $count) : 0;
            }

            return [
                'id' => $h->id,
                'nama' => $h->nama,
                'santris_count' => $h->santris_count,
                'avgPercent' => $avg,
            ];
        })->sortByDesc('avgPercent')->values()->all();

        return Inertia::render('dashboard/muhafidz', [
            'halaqahs' => $halaqahs,
            'recentMutabaahs' => $recentMutabaahs,
            'totalMutabaahs' => $muhafidz->mutabaahs()->count(),
            'mutabaahByStatus' => $this->mutabaahStatusDistribution($muhafidz->mutabaahs()),
            'mutabaahsThisMonth' => $this->mutabaahCountInMonth($muhafidz->mutabaahs(), $now),
            'mutabaahsLastMonth' => $this->mutabaahCountInMonth($muhafidz->mutabaahs(), $now->copy()->subMonth()),
            'mutabaahsThisWeek' => $mutabaahsThisWeek,
            'mutabaahsLastWeek' => $mutabaahsLastWeek,
            'weeklyTrend' => $weeklyTrend,
            'bulanan' => [
                'total' => $totalBulanan,
                'bulanIni' => $bulananBulanIni,
                'bulanLalu' => $bulananBulanLalu,
                'tahun' => $currentTahun,
                'bulan' => $currentBulan,
                'recent' => $recentBulanan,
            ],
            'topSantris' => $this->topSantris($santriIds, 5),
            'hariIni' => $hariIni,
            'perhatian' => $perhatian,
            'halaqahPerf' => $halaqahPerf,
        ]);
    }

    private function santri(?Santri $santri): Response
    {
        abort_unless($santri !== null, 403, __('You do not have a santri profile.'));

        return Inertia::render('dashboard/santri', [
            'santri' => $santri->only(['id', 'nama', 'nis']),
            'progress' => $this->progressData($santri),
            'riwayat' => $santri->mutabaahs()->orderBy('tanggal', 'desc')->limit(6)->get(),
            'halaqahs' => $santri->halaqahs()->get(['halaqahs.id', 'halaqahs.nama']),
            'mutabaahByStatus' => $this->mutabaahStatusDistribution($santri->mutabaahs()),
        ]);
    }

    private function orangTua(?OrangTua $orangTua): Response
    {
        abort_unless($orangTua !== null, 403, __('You do not have an orang tua profile.'));

        $children = $orangTua->santris()
            ->orderBy('nama')
            ->get()
            ->map(function (Santri $santri) {
                $progress = $this->progressData($santri);
                $halqahs = $santri->halaqahs()->get(['halaqahs.id', 'halaqahs.nama', 'halaqahs.jam_mulai', 'halaqahs.jam_selesai']);
                $riwayat = $santri->mutabaahs()->orderBy('tanggal', 'desc')->limit(6)->get(['id', 'tanggal', 'jenis', 'surah', 'ayat_mulai', 'ayat_selesai', 'status', 'nilai']);
                $mutabaahByStatus = $this->mutabaahStatusDistribution($santri->mutabaahs());
                $recentBulanan = MutabaahBulanan::query()->where('santri_id', $santri->id)->orderByDesc('tahun')->orderByDesc('bulan')->limit(3)->get();
                $totalMutabaah = $santri->mutabaahs()->count();

                return [
                    'id' => $santri->id,
                    'nama' => $santri->nama,
                    'nis' => $santri->nis,
                    'progress' => $progress,
                    'halaqahs' => $halqahs,
                    'riwayat' => $riwayat,
                    'mutabaahByStatus' => $mutabaahByStatus,
                    'recentBulanan' => $recentBulanan,
                    'totalMutabaah' => $totalMutabaah,
                ];
            });

        $avgPercent = $children->count() > 0 ? (int) round($children->avg(fn ($c) => $c['progress']['percent'] ?? 0)) : 0;
        $bestChild = $children->sortByDesc(fn ($c) => $c['progress']['percent'] ?? 0)->first();
        $totalMutabaahAll = $children->sum(fn ($c) => $c['totalMutabaah'] ?? 0);

        return Inertia::render('dashboard/orang-tua', [
            'children' => $children,
            'childrenProgress' => $this->childrenProgressDistribution($children),
            'stats' => [
                'total' => $children->count(),
                'avgPercent' => $avgPercent,
                'bestChild' => $bestChild ? ['nama' => $bestChild['nama'], 'percent' => $bestChild['progress']['percent']] : null,
                'totalMutabaah' => $totalMutabaahAll,
            ],
        ]);
    }

    /**
     * @param  Builder<mixed>|Relation  $query
     * @return list<array{key: string, label: string, count: int}>
     */
    private function mutabaahStatusDistribution(Builder|Relation $query): array
    {
        return $query->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->orderByDesc('total')
            ->pluck('total', 'status')
            ->map(fn (int $count, string $status) => [
                'key' => $status,
                'label' => MutabaahStatus::tryFrom($status)?->label() ?? $status,
                'count' => $count,
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<array{key: string, label: string, count: int}>
     */
    private function santriJenisDistribution(): array
    {
        return Santri::query()
            ->whereNotNull('jenis')
            ->selectRaw('jenis, count(*) as total')
            ->groupBy('jenis')
            ->orderByDesc('total')
            ->pluck('total', 'jenis')
            ->map(fn (int $count, string $jenis) => [
                'key' => $jenis,
                'label' => SantriJenis::tryFrom($jenis)?->label() ?? $jenis,
                'count' => $count,
            ])
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, array{progress: array{status: string}}>  $children
     * @return list<array{key: string, label: string, count: int}>
     */
    private function childrenProgressDistribution(Collection $children): array
    {
        return $children
            ->map(fn (array $child) => $child['progress']['status'] ?? '')
            ->filter()
            ->countBy()
            ->sortKeys()
            ->map(fn (int $count, string $status) => [
                'key' => $status,
                'label' => TargetHafalanStatus::tryFrom($status)?->label() ?? $status,
                'count' => $count,
            ])
            ->values()
            ->all();
    }

    /**
     * @param  Builder<mixed>|Relation  $query
     */
    private function mutabaahCountInMonth(Builder|Relation $query, CarbonInterface $month): int
    {
        return (clone $query)
            ->whereYear('tanggal', $month->year)
            ->whereMonth('tanggal', $month->month)
            ->count();
    }

    /**
     * @param  Builder<mixed>|Relation  $query
     */
    private function mutabaahCountInWeek(Builder|Relation $query, CarbonInterface $date): int
    {
        $start = $date->copy()->startOfWeek()->toDateString();
        $end = $date->copy()->endOfWeek()->toDateString();

        return (clone $query)
            ->whereDate('tanggal', '>=', $start)
            ->whereDate('tanggal', '<=', $end)
            ->count();
    }

    /**
     * Santri berprestasi: ranking by target progress (percent) desc, fallback halaman_kumulatif.
     *
     * @param  int[]|null  $santriIds  null = keseluruhan, array = filter halaqah muhafidz
     * @return list<array{id:int,nama:string,nis:string|null,progress:int,target:int,percent:int,halaman_kumulatif:int|null,halaqah:string|null}>
     */
    private function topSantris(?array $santriIds, int $limit = 5): array
    {
        $query = Santri::query()
            ->with(['targetHafalans', 'halaqahs:id,nama'])
            ->when($santriIds !== null, fn (Builder $q) => $q->whereIn('id', $santriIds));

        $santris = $query->get();

        return $santris
            ->map(function (Santri $s) {
                $progressData = $this->progressData($s);
                $mb = MutabaahBulanan::query()
                    ->where('santri_id', $s->id)
                    ->orderByDesc('tahun')
                    ->orderByDesc('bulan')
                    ->first();

                return [
                    'id' => $s->id,
                    'nama' => $s->nama,
                    'nis' => $s->nis,
                    'progress' => $progressData['progress'],
                    'target' => $progressData['target'],
                    'percent' => $progressData['percent'],
                    'halaman_kumulatif' => $mb?->halaman_kumulatif,
                    'halaqah' => $s->halaqahs->first()?->nama,
                ];
            })
            ->sortByDesc(fn (array $row) => $row['percent'] * 10000 + $row['progress'])
            ->take($limit)
            ->values()
            ->all();
    }

    /**
     * @return array{
     *     target: int,
     *     progress: int,
     *     percent: int,
     *     status: string,
     *     status_label: string,
     *     periode: string|null
     * }
     */
    private function progressData(Santri $santri): array
    {
        $target = $santri->targetHafalans()
            ->orderBy('id', 'desc')
            ->first();

        if ($target === null) {
            return ['target' => 0, 'progress' => 0, 'percent' => 0, 'status' => '', 'status_label' => '', 'periode' => null];
        }

        return [
            'target' => $target->target,
            'progress' => $target->progress,
            'percent' => $target->progressPercent(),
            'status' => $target->status->value,
            'status_label' => $target->status->label(),
            'periode' => $target->periode,
        ];
    }
}
