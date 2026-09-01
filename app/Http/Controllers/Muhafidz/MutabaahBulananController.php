<?php

namespace App\Http\Controllers\Muhafidz;

use App\Actions\MutabaahBulanan\MutabaahBulananCalculator;
use App\Http\Controllers\Controller;
use App\Http\Requests\Muhafidz\StoreMutabaahBulananRequest;
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

        $validated = $request->validated();
        $muhafidz = $request->user()->muhafidz;
        $settings = MutabaahSetting::setting();
        $tahun = $settings->tahun_aktif;
        $calculator = app(MutabaahBulananCalculator::class);

        $ownedSantri = $muhafidz->halaqahs()
            ->whereHas('santris', fn ($q) => $q->whereKey($validated['santri_id']))
            ->exists();

        abort_unless($ownedSantri, 403, __('This santri is not in any of your halaqah.'));

        $santri = Santri::query()->findOrFail($validated['santri_id']);
        $halamanAwalBulan = $calculator->halamanAwalBulan($santri, $bulan, $tahun);

        // Bypass: muhafidz bebas isi sesuai kemampuan santri (tidak wajib >= halaman_awal_bulan)
        // Jika perlu validasi ringan, cukup pastikan >=0 (sudah divalidasi di FormRequest).

        DB::transaction(function () use ($validated, $halamanAwalBulan, $tahun, $bulan): void {
            MutabaahBulanan::updateOrCreate(
                ['santri_id' => $validated['santri_id'], 'tahun' => $tahun, 'bulan' => $bulan],
                [
                    'halaman_awal_bulan' => $halamanAwalBulan,
                    'halaman_kumulatif' => $validated['halaman_kumulatif'],
                    'juz_dihafal' => $validated['juz_dihafal'] ?? null,
                    'tasmi_pekan_1' => $validated['tasmi_pekan_1'] ?? null,
                    'tasmi_pekan_2' => $validated['tasmi_pekan_2'] ?? null,
                    'tasmi_pekan_3' => $validated['tasmi_pekan_3'] ?? null,
                    'tasmi_pekan_4' => $validated['tasmi_pekan_4'] ?? null,
                    'tasmi_pekan_5' => $validated['tasmi_pekan_5'] ?? null,
                    'ujian_soal_1' => $validated['ujian_soal_1'] ?? null,
                    'ujian_soal_2' => $validated['ujian_soal_2'] ?? null,
                    'ujian_soal_3' => $validated['ujian_soal_3'] ?? null,
                    'ujian_soal_4' => $validated['ujian_soal_4'] ?? null,
                    'ujian_soal_5' => $validated['ujian_soal_5'] ?? null,
                ],
            );
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Mutabaah bulanan berhasil disimpan.')]);

        return back();
    }
}
