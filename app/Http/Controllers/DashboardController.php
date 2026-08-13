<?php

namespace App\Http\Controllers;

use App\Enums\MutabaahStatus;
use App\Enums\SantriJenis;
use App\Enums\TargetHafalanStatus;
use App\Enums\UserRole;
use App\Models\Halaqah;
use App\Models\Mutabaah;
use App\Models\OrangTua;
use App\Models\Santri;
use App\Models\User;
use App\Models\Ustadz;
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
            UserRole::Ustadz => $this->ustadz($user),
            UserRole::Santri => $this->santri($user->santri),
            UserRole::OrangTua => $this->orangTua($user->orangTua),
        };
    }

    private function admin(): Response
    {
        $now = now();

        return Inertia::render('dashboard/admin', [
            'counts' => [
                'santris' => Santri::count(),
                'ustadzs' => Ustadz::count(),
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
            'santrisThisMonth' => Santri::query()
                ->whereYear('created_at', $now->year)
                ->whereMonth('created_at', $now->month)
                ->count(),
        ]);
    }

    private function ustadz(User $user): Response
    {
        $ustadz = $user->ustadz;

        abort_unless($ustadz !== null, 403, __('You do not have a ustadz profile.'));

        $halaqahs = $ustadz->halaqahs()
            ->withCount('santris')
            ->orderBy('nama')
            ->get();

        $recentMutabaahs = $ustadz->mutabaahs()
            ->with('santri')
            ->orderBy('tanggal', 'desc')
            ->limit(5)
            ->get();

        $now = now();

        return Inertia::render('dashboard/ustadz', [
            'halaqahs' => $halaqahs,
            'recentMutabaahs' => $recentMutabaahs,
            'totalMutabaahs' => $ustadz->mutabaahs()->count(),
            'mutabaahByStatus' => $this->mutabaahStatusDistribution($ustadz->mutabaahs()),
            'mutabaahsThisMonth' => $this->mutabaahCountInMonth($ustadz->mutabaahs(), $now),
            'mutabaahsLastMonth' => $this->mutabaahCountInMonth($ustadz->mutabaahs(), $now->copy()->subMonth()),
        ]);
    }

    private function santri(?Santri $santri): Response
    {
        abort_unless($santri !== null, 403, __('You do not have a santri profile.'));

        return Inertia::render('dashboard/santri', [
            'santri' => $santri->only(['id', 'nama', 'nis']),
            'progress' => $this->progressData($santri),
            'riwayat' => $santri->mutabaahs()->orderBy('tanggal', 'desc')->limit(10)->get(),
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
            ->map(fn (Santri $santri) => [
                'id' => $santri->id,
                'nama' => $santri->nama,
                'nis' => $santri->nis,
                'progress' => $this->progressData($santri),
            ]);

        return Inertia::render('dashboard/orang-tua', [
            'children' => $children,
            'childrenProgress' => $this->childrenProgressDistribution($children),
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
