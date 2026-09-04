<?php

namespace App\Http\Controllers\Muhafidz;

use App\Actions\MutabaahBulanan\MutabaahBulananCalculator;
use App\Enums\MutabaahJenis;
use App\Enums\MutabaahStatus;
use App\Enums\HalaqahMemberStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Muhafidz\StoreHalaqahSantriRequest;
use App\Models\Halaqah;
use App\Models\HalaqahMember;
use App\Models\Mutabaah;
use App\Models\MutabaahBulanan;
use App\Models\MutabaahSetting;
use App\Models\Santri;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HalaqahController extends Controller
{
    public function index(Request $request): Response
    {
        $muhafidz = $request->user()->muhafidz;

        abort_unless($muhafidz !== null, 403, __('You do not have a muhafidz profile.'));

        $halaqahs = $muhafidz->halaqahs()
            ->withCount('santris as santri_count')
            ->orderBy('nama')
            ->paginate(15);

        return Inertia::render('muhafidz/halaqahs/index', [
            'halaqahs' => $halaqahs,
        ]);
    }

    public function santris(Request $request, Halaqah $halaqah): Response
    {
        $muhafidz = $request->user()->muhafidz;

        abort_unless($muhafidz?->id === $halaqah->muhafidz_id, 403, __('You do not manage this halaqah.'));

        $santriIds = $halaqah->santris()->pluck('santris.id');

        $todayMutabaahs = Mutabaah::query()
            ->whereIn('santri_id', $santriIds)
            ->whereDate('tanggal', now()->toDateString())
            ->get()
            ->groupBy('santri_id');

        $santris = $halaqah->santris()
            ->orderBy('nama')
            ->paginate(15)
            ->through(function (Santri $santri) use ($todayMutabaahs) {
                $latest = $todayMutabaahs->get($santri->id)?->last();

                return [
                    'id' => $santri->id,
                    'nama' => $santri->nama,
                    'nis' => $santri->nis,
                    'mutabaah_hari_ini' => $latest ? [
                        'id' => $latest->id,
                        'tanggal' => $latest->tanggal?->toDateString(),
                        'jenis' => $latest->jenis->value,
                        'surah' => $latest->surah,
                        'ayat_mulai' => $latest->ayat_mulai,
                        'ayat_selesai' => $latest->ayat_selesai,
                        'status' => $latest->status->value,
                    ] : null,
                ];
            });

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

        $availableSantris = Santri::query()
            ->whereNotIn('id', $santriIds)
            ->orderBy('nama')
            ->limit(50)
            ->get(['id', 'nama', 'nis']);

        return Inertia::render('muhafidz/halaqahs/santris', [
            'halaqah' => $halaqah,
            'santris' => $santris,
            'jenisOptions' => collect(MutabaahJenis::cases())->map(fn ($jenis) => ['value' => $jenis->value, 'label' => $jenis->label()]),
            'statusOptions' => collect(MutabaahStatus::cases())->map(fn ($status) => ['value' => $status->value, 'label' => $status->label()]),
            'settings' => $settings->only(['konversi_juz_halaman', 'ambang_hadiah_juz', 'tahun_aktif']),
            'bulan' => $bulan,
            'tahun' => $tahun,
            'bulanan' => $bulanan,
            'availableSantris' => $availableSantris,
        ]);
    }

    public function storeSantri(StoreHalaqahSantriRequest $request, Halaqah $halaqah): RedirectResponse
    {
        $santriId = (int) $request->validated()['santri_id'];

        $exists = HalaqahMember::where('halaqah_id', $halaqah->id)->where('santri_id', $santriId)->exists();

        if ($exists) {
            return to_route('muhafidz.halaqahs.santris.show', $halaqah)->with('error', 'Santri sudah di halaqah ini.');
        }

        HalaqahMember::create([
            'halaqah_id' => $halaqah->id,
            'santri_id' => $santriId,
            'joined_at' => now()->toDateString(),
            'status' => HalaqahMemberStatus::Aktif,
        ]);

        return to_route('muhafidz.halaqahs.santris.show', $halaqah)->with('success', 'Santri ditambahkan ke halaqah.');
    }

    public function destroySantri(Request $request, Halaqah $halaqah, Santri $santri): RedirectResponse
    {
        abort_unless($request->user()?->muhafidz?->id === $halaqah->muhafidz_id, 403);

        HalaqahMember::where('halaqah_id', $halaqah->id)->where('santri_id', $santri->id)->delete();

        return to_route('muhafidz.halaqahs.santris.show', $halaqah)->with('success', 'Santri dikeluarkan dari halaqah.');
    }
}
