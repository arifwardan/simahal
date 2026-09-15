<?php

namespace App\Http\Controllers\Santri;

use App\Actions\MutabaahBulanan\MutabaahBulananCalculator;
use App\Http\Controllers\Controller;
use App\Models\MutabaahBulanan;
use App\Models\MutabaahSetting;
use App\Models\Santri;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class PrestasiController extends Controller
{
    public function index(Request $request): Response
    {
        $santri = $request->user()->santri;
        abort_unless($santri !== null, 403);

        $setting = MutabaahSetting::setting();
        $calculator = app(MutabaahBulananCalculator::class);

        $target = $santri->targetHafalans()->orderByDesc('id')->first();
        $progress = $target ? [
            'target' => $target->target,
            'progress' => $target->progress,
            'percent' => $target->progressPercent(),
            'status' => $target->status->value,
            'label' => $target->status->label(),
            'periode' => $target->periode,
        ] : null;

        $recentBulanan = MutabaahBulanan::where('santri_id', $santri->id)->orderByDesc('tahun')->orderByDesc('bulan')->first();
        $historyBulanan = MutabaahBulanan::where('santri_id', $santri->id)->orderByDesc('tahun')->orderByDesc('bulan')->limit(6)->get();

        $bulananPrestasi = null;
        if ($recentBulanan) {
            $bulananPrestasi = [
                'tahun' => $recentBulanan->tahun,
                'bulan' => $recentBulanan->bulan,
                'halaman_kumulatif' => $recentBulanan->halaman_kumulatif,
                'tambah_halaman' => $calculator->tambahHalaman($recentBulanan),
                'tambah_juz' => $calculator->tambahJuz($recentBulanan, $setting->konversi_juz_halaman),
                'total_juz' => $calculator->totalJuz($recentBulanan, $setting->konversi_juz_halaman),
                'kategori' => $calculator->kategori($recentBulanan, $setting->konversi_juz_halaman)?->label(),
                'keterangan' => $calculator->keterangan($recentBulanan, $setting->konversi_juz_halaman, $setting->ambang_hadiah_juz),
                'rata_tasmi' => $calculator->rataTasmi($recentBulanan),
                'rata_ujian' => $calculator->rataUjian($recentBulanan),
            ];
        }

        $all = Cache::remember('prestasi-ranking', 300, fn () => Santri::query()
            ->select('id')
            ->with('targetHafalans:id,santri_id,progress,target,status')
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'percent' => $s->targetHafalans->sortByDesc('id')->first()?->progressPercent() ?? 0,
            ])->sortByDesc('percent')->values());
        $rank = $all->search(fn ($r) => $r['id'] === $santri->id);
        $rank = $rank !== false ? $rank + 1 : null;

        return Inertia::render('santri/prestasi', [
            'santri' => $santri->only(['id', 'nama', 'nis']),
            'progress' => $progress,
            'recentBulanan' => $bulananPrestasi,
            'historyBulanan' => $historyBulanan,
            'rank' => $rank,
            'totalSantri' => $all->count(),
            'halaqahs' => $santri->halaqahs()->get(['halaqahs.id', 'halaqahs.nama']),
        ]);
    }
}
