<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Halaqah;
use App\Models\Mutabaah;
use App\Models\OrangTua;
use App\Models\Santri;
use App\Models\User;
use App\Models\Ustadz;
use Illuminate\Http\Request;
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

        return Inertia::render('dashboard/ustadz', [
            'halaqahs' => $halaqahs,
            'recentMutabaahs' => $recentMutabaahs,
            'totalMutabaahs' => $ustadz->mutabaahs()->count(),
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
        ]);
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
