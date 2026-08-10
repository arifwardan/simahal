<?php

namespace App\Http\Controllers\Ustadz;

use App\Actions\Mutabaah\RecalculateTargetProgress;
use App\Enums\MutabaahJenis;
use App\Enums\MutabaahStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Ustadz\StoreMutabaahRequest;
use App\Models\Mutabaah;
use App\Models\Santri;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class MutabaahController extends Controller
{
    public function create(Request $request, Santri $santri): Response
    {
        $ustadz = $request->user()->ustadz;

        abort_unless($ustadz !== null, 403, __('You do not have a ustadz profile.'));

        $owned = $ustadz->halaqahs()->whereHas('santris', fn ($q) => $q->whereKey($santri->id))->count() > 0;

        abort_unless($owned, 403, __('This santri is not in any of your halaqah.'));

        return Inertia::render('ustadz/mutabaahs/create', [
            'santri' => $santri->only(['id', 'nama', 'nis']),
            'jenisOptions' => collect(MutabaahJenis::cases())->map(fn (MutabaahJenis $jenis) => [
                'value' => $jenis->value,
                'label' => $jenis->label(),
            ]),
            'statusOptions' => collect(MutabaahStatus::cases())->map(fn (MutabaahStatus $status) => [
                'value' => $status->value,
                'label' => $status->label(),
            ]),
        ]);
    }

    public function store(StoreMutabaahRequest $request, RecalculateTargetProgress $recalculate): RedirectResponse
    {
        $validated = $request->validated();
        $ustadz = $request->user()->ustadz;

        abort_unless($ustadz !== null, 403, __('You do not have a ustadz profile.'));

        $memberSantri = $ustadz->halaqahs()
            ->whereHas('santris', fn ($q) => $q->whereKey($validated['santri_id']))
            ->exists();

        abort_unless($memberSantri, 403, __('This santri is not in any of your halaqah.'));

        DB::transaction(function () use ($validated, $ustadz, $recalculate): void {
            $mutabaah = Mutabaah::create([
                'santri_id' => $validated['santri_id'],
                'ustadz_id' => $ustadz->id,
                'tanggal' => $validated['tanggal'],
                'jenis' => $validated['jenis'],
                'surah' => $validated['surah'],
                'ayat_mulai' => $validated['ayat_mulai'],
                'ayat_selesai' => $validated['ayat_selesai'],
                'nilai' => $validated['nilai'] ?? null,
                'status' => $validated['status'],
                'catatan' => $validated['catatan'] ?? null,
            ]);

            $recalculate->run($mutabaah->santri);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Mutabaah recorded.')]);

        return to_route('ustadz.mutabaahs.create', $validated['santri_id']);
    }
}
