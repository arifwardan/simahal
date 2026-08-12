<?php

namespace App\Http\Controllers\Ustadz;

use App\Actions\MutabaahBulanan\MutabaahBulananCalculator;
use App\Enums\MutabaahJenis;
use App\Enums\MutabaahStatus;
use App\Http\Controllers\Controller;
use App\Models\Halaqah;
use App\Models\MutabaahBulanan;
use App\Models\MutabaahSetting;
use App\Models\Santri;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HalaqahController extends Controller
{
    public function index(Request $request): Response
    {
        $ustadz = $request->user()->ustadz;

        abort_unless($ustadz !== null, 403, __('You do not have a ustadz profile.'));

        $halaqahs = $ustadz->halaqahs()
            ->withCount('santris as santri_count')
            ->orderBy('nama')
            ->paginate(15);

        return Inertia::render('ustadz/halaqahs/index', [
            'halaqahs' => $halaqahs,
        ]);
    }

    public function santris(Request $request, Halaqah $halaqah): Response
    {
        $ustadz = $request->user()->ustadz;

        abort_unless($ustadz?->id === $halaqah->ustadz_id, 403, __('You do not manage this halaqah.'));

        $santris = $halaqah->santris()
            ->orderBy('nama')
            ->paginate(15);

        $settings = MutabaahSetting::setting();
        $bulan = $request->integer('bulan', now()->month);
        $bulan = max(1, min(12, $bulan));
        $tahun = $settings->tahun_aktif;

        $calculator = app(MutabaahBulananCalculator::class);

        $bulanan = $halaqah->santris()
            ->orderBy('nama')
            ->get()
            ->map(function (Santri $santri) use ($calculator, $bulan, $tahun): array {
                $existing = MutabaahBulanan::query()
                    ->where('santri_id', $santri->id)
                    ->where('tahun', $tahun)
                    ->where('bulan', $bulan)
                    ->first();

                return [
                    'santri_id' => $santri->id,
                    'nama' => $santri->nama,
                    'halaman_awal_bulan' => $calculator->halamanAwalBulan($santri, $bulan, $tahun),
                    'prefill_kumulatif' => $calculator->prefillKumulatif($santri, $bulan, $tahun),
                    'existing' => $existing ? [
                        'halaman_kumulatif' => $existing->halaman_kumulatif,
                        'juz_dihafal' => $existing->juz_dihafal,
                        'tasmi_pekan_1' => $existing->tasmi_pekan_1,
                        'tasmi_pekan_2' => $existing->tasmi_pekan_2,
                        'tasmi_pekan_3' => $existing->tasmi_pekan_3,
                        'tasmi_pekan_4' => $existing->tasmi_pekan_4,
                        'tasmi_pekan_5' => $existing->tasmi_pekan_5,
                        'ujian_soal_1' => $existing->ujian_soal_1,
                        'ujian_soal_2' => $existing->ujian_soal_2,
                        'ujian_soal_3' => $existing->ujian_soal_3,
                        'ujian_soal_4' => $existing->ujian_soal_4,
                        'ujian_soal_5' => $existing->ujian_soal_5,
                    ] : null,
                ];
            });

        return Inertia::render('ustadz/halaqahs/santris', [
            'halaqah' => $halaqah,
            'santris' => $santris,
            'jenisOptions' => collect(MutabaahJenis::cases())->map(fn ($jenis) => ['value' => $jenis->value, 'label' => $jenis->label()]),
            'statusOptions' => collect(MutabaahStatus::cases())->map(fn ($status) => ['value' => $status->value, 'label' => $status->label()]),
            'settings' => $settings->only(['konversi_juz_halaman', 'ambang_hadiah_juz', 'tahun_aktif']),
            'bulan' => $bulan,
            'tahun' => $tahun,
            'bulanan' => $bulanan,
        ]);
    }
}
