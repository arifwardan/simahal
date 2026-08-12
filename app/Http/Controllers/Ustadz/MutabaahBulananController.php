<?php

namespace App\Http\Controllers\Ustadz;

use App\Actions\MutabaahBulanan\MutabaahBulananCalculator;
use App\Http\Controllers\Controller;
use App\Http\Requests\Ustadz\StoreMutabaahBulananRequest;
use App\Models\MutabaahBulanan;
use App\Models\MutabaahSetting;
use App\Models\Santri;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MutabaahBulananController extends Controller
{
    public function update(StoreMutabaahBulananRequest $request, int $bulan): RedirectResponse
    {
        abort_unless($bulan >= 1 && $bulan <= 12, 422, __('Bulan tidak valid.'));

        $ustadz = $request->user()->ustadz;
        $settings = MutabaahSetting::setting();
        $tahun = $settings->tahun_aktif;
        $calculator = app(MutabaahBulananCalculator::class);

        $ownedSantriIds = $ustadz->halaqahs()
            ->with('santris:id')
            ->get()
            ->flatMap->santris
            ->pluck('id')
            ->unique()
            ->all();

        $records = $request->validated('records');

        DB::transaction(function () use ($records, $ownedSantriIds, $calculator, $tahun, $bulan): void {
            foreach ($records as $record) {
                abort_unless(
                    in_array($record['santri_id'], $ownedSantriIds, true),
                    403,
                    __('This santri is not in any of your halaqah.'),
                );

                $santri = Santri::query()->findOrFail($record['santri_id']);
                $halamanAwalBulan = $calculator->halamanAwalBulan($santri, $bulan, $tahun);

                if ($halamanAwalBulan !== null && $record['halaman_kumulatif'] < $halamanAwalBulan) {
                    abort(422, __('Halaman kumulatif tidak boleh kurang dari halaman awal bulan.'));
                }

                MutabaahBulanan::updateOrCreate(
                    ['santri_id' => $record['santri_id'], 'tahun' => $tahun, 'bulan' => $bulan],
                    [
                        'halaman_awal_bulan' => $halamanAwalBulan,
                        'halaman_kumulatif' => $record['halaman_kumulatif'],
                        'juz_dihafal' => $record['juz_dihafal'] ?? null,
                        'tasmi_pekan_1' => $record['tasmi_pekan_1'] ?? null,
                        'tasmi_pekan_2' => $record['tasmi_pekan_2'] ?? null,
                        'tasmi_pekan_3' => $record['tasmi_pekan_3'] ?? null,
                        'tasmi_pekan_4' => $record['tasmi_pekan_4'] ?? null,
                        'tasmi_pekan_5' => $record['tasmi_pekan_5'] ?? null,
                        'ujian_soal_1' => $record['ujian_soal_1'] ?? null,
                        'ujian_soal_2' => $record['ujian_soal_2'] ?? null,
                        'ujian_soal_3' => $record['ujian_soal_3'] ?? null,
                        'ujian_soal_4' => $record['ujian_soal_4'] ?? null,
                        'ujian_soal_5' => $record['ujian_soal_5'] ?? null,
                    ],
                );
            }
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Mutabaah bulanan berhasil disimpan.')]);

        return back();
    }
}
