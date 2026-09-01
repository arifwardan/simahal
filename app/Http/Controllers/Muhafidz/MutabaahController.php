<?php

namespace App\Http\Controllers\Muhafidz;

use App\Actions\Mutabaah\RecalculateTargetProgress;
use App\Http\Controllers\Controller;
use App\Http\Requests\Muhafidz\StoreMutabaahRequest;
use App\Models\Mutabaah;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MutabaahController extends Controller
{
    public function store(StoreMutabaahRequest $request, RecalculateTargetProgress $recalculate): RedirectResponse
    {
        $validated = $request->validated();
        $muhafidz = $request->user()->muhafidz;

        abort_unless($muhafidz !== null, 403, __('You do not have a muhafidz profile.'));

        $memberSantri = $muhafidz->halaqahs()
            ->whereHas('santris', fn ($q) => $q->whereKey($validated['santri_id']))
            ->exists();

        abort_unless($memberSantri, 403, __('This santri is not in any of your halaqah.'));

        DB::transaction(function () use ($validated, $muhafidz, $recalculate): void {
            $mutabaah = Mutabaah::create([
                'santri_id' => $validated['santri_id'],
                'muhafidz_id' => $muhafidz->id,
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
