<?php

namespace App\Http\Controllers\Muhafidz;

use App\Enums\MutabaahJenis;
use App\Enums\MutabaahStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Muhafidz\StoreSetoranHarianRequest;
use App\Models\Mutabaah;
use App\Models\Santri;
use App\Models\Surah;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SetoranHarianController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $halaqahIds = $user->muhafidz->halaqahs()->pluck('halaqahs.id');
        $santris = Santri::whereIn('id', function ($q) use ($halaqahIds): void {
            $q->select('santri_id')->from('halaqah_members')->whereIn('halaqah_id', $halaqahIds);
        })->orderBy('nama')->get(['id', 'nama', 'nis']);

        $santriId = $request->query('santri_id', $santris->first()?->id);
        $tanggal = $request->query('tanggal', now()->toDateString());

        $details = [];
        $existing = $santriId !== null
            ? Mutabaah::with('details.surah')->where('santri_id', $santriId)->whereDate('tanggal', $tanggal)->first()
            : null;

        if ($existing !== null) {
            $details = $existing->details->map(fn ($d) => ['surah_id' => $d->surah_id, 'baris' => $d->baris])->all();
        }

        return Inertia::render('muhafidz/setoran-harian/index', [
            'santris' => $santris,
            'santriId' => $santriId !== null ? (int) $santriId : null,
            'tanggal' => $tanggal,
            'details' => $details,
            'totalBaris' => collect($details)->sum('baris'),
            'surahs' => Surah::orderBy('nomor')->get(['id', 'nomor', 'nama_latin', 'nama_arab', 'jumlah_ayat', 'juz']),
            'targetHarian' => 3,
        ]);
    }

    public function store(StoreSetoranHarianRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $muhafidzId = $request->user()->muhafidz->id;

        DB::transaction(function () use ($validated, $muhafidzId): void {
            if ($validated['details'] === []) {
                Mutabaah::where('santri_id', $validated['santri_id'])
                    ->whereDate('tanggal', $validated['tanggal'])
                    ->delete();

                return;
            }

            $mutabaah = Mutabaah::updateOrCreate(
                ['santri_id' => $validated['santri_id'], 'tanggal' => Carbon::parse($validated['tanggal'])],
                ['muhafidz_id' => $muhafidzId, 'jenis' => MutabaahJenis::Setoran, 'status' => MutabaahStatus::Lulus, 'surah' => '-', 'ayat_mulai' => 1, 'ayat_selesai' => 1]
            );

            $ids = collect($validated['details'])->pluck('surah_id')->all();
            $mutabaah->details()->whereNotIn('surah_id', $ids)->delete();

            foreach ($validated['details'] as $row) {
                $mutabaah->details()->updateOrCreate(
                    ['surah_id' => $row['surah_id']],
                    ['baris' => (int) $row['baris']]
                );
            }

            $mutabaah->refresh();
            $mutabaah->update([
                'halaman' => (int) $mutabaah->details()->sum('baris'),
                'surah' => $mutabaah->buildSurahSummary(),
            ]);
        });

        return redirect()->route('muhafidz.setoran-harian.index', ['santri_id' => $validated['santri_id'], 'tanggal' => $validated['tanggal']])
            ->with('success', 'Setoran harian disimpan.');
    }
}
