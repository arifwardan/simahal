<?php

namespace App\Http\Controllers\Ustadz;

use App\Actions\Mutabaah\RecalculateTargetProgress;
use App\Http\Controllers\Controller;
use App\Http\Requests\Ustadz\StoreMutabaahRequest;
use App\Models\Mutabaah;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MutabaahController extends Controller
{
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
                'halaman' => $validated['halaman'],
            ]);

            $recalculate->run($mutabaah->santri);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Mutabaah recorded.')]);

        return back();
    }
}
