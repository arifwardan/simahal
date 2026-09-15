<?php

namespace App\Http\Controllers\OrangTua;

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
        $orangTua = $request->user()->orangTua;
        abort_unless($orangTua !== null, 403);

        $setting = MutabaahSetting::setting();
        $calculator = app(MutabaahBulananCalculator::class);

        // Ranking global dihitung sekali (bukan per-anak) + cache 5 menit
        $allProgress = Cache::remember('prestasi-ranking', 300, fn () => Santri::query()
            ->select('id')
            ->with('targetHafalans:id,santri_id,progress,target,status')
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'percent' => $s->targetHafalans->sortByDesc('id')->first()?->progressPercent() ?? 0,
            ])->sortByDesc('percent')->values());

        $children = $orangTua->santris()->orderBy('nama')->get()->map(function ($santri) use ($calculator, $setting, $allProgress) {
            $target = $santri->targetHafalans()->orderByDesc('id')->first();
            $progress = $target ? ['target' => $target->target, 'progress' => $target->progress, 'percent' => $target->progressPercent(), 'status' => $target->status->value, 'label' => $target->status->label(), 'periode' => $target->periode] : null;

            $recentBulanan = MutabaahBulanan::where('santri_id', $santri->id)->orderByDesc('tahun')->orderByDesc('bulan')->first();
            $historyBulanan = MutabaahBulanan::where('santri_id', $santri->id)->orderByDesc('tahun')->orderByDesc('bulan')->limit(6)->get();

            $bulananPrestasi = null;
            if ($recentBulanan) {
                $bulananPrestasi = [
                    'tahun' => $recentBulanan->tahun,
                    'bulan' => $recentBulanan->bulan,
                    'halaman_kumulatif' => $recentBulanan->halaman_kumulatif,
                    'halaman_awal' => $recentBulanan->halaman_awal_bulan,
                    'tambah_halaman' => $calculator->tambahHalaman($recentBulanan),
                    'tambah_juz' => $calculator->tambahJuz($recentBulanan, $setting->konversi_juz_halaman),
                    'total_juz' => $calculator->totalJuz($recentBulanan, $setting->konversi_juz_halaman),
                    'kategori' => $calculator->kategori($recentBulanan, $setting->konversi_juz_halaman)?->label(),
                    'keterangan' => $calculator->keterangan($recentBulanan, $setting->konversi_juz_halaman, $setting->ambang_hadiah_juz),
                    'rata_tasmi' => $calculator->rataTasmi($recentBulanan),
                    'rata_ujian' => $calculator->rataUjian($recentBulanan),
                ];
            }

            $halaqahs = $santri->halaqahs()->get(['halaqahs.id', 'halaqahs.nama']);

            // ranking global vs semua santri by progress percent (dari cache di atas)
            $rank = $allProgress->search(fn ($r) => $r['id'] === $santri->id);
            $rank = $rank !== false ? $rank + 1 : null;

            return [
                'id' => $santri->id,
                'nama' => $santri->nama,
                'nis' => $santri->nis,
                'progress' => $progress,
                'halaqahs' => $halaqahs,
                'recentBulanan' => $bulananPrestasi,
                'historyBulanan' => $historyBulanan,
                'rank' => $rank,
                'totalSantri' => $allProgress->count(),
            ];
        });

        return Inertia::render('orang-tua/prestasi', [
            'children' => $children,
            'setting' => $setting->only(['konversi_juz_halaman', 'ambang_hadiah_juz', 'tahun_aktif']),
        ]);
    }
}
