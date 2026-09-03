<?php

namespace App\Http\Controllers\Muhafidz;

use App\Helpers\PekanHelper;
use App\Http\Controllers\Controller;
use App\Http\Requests\Muhafidz\StoreSetoranRequest;
use App\Models\Halaqah;
use App\Models\Mutabaah;
use App\Models\MutabaahBulanan;
use App\Models\MutabaahSetting;
use App\Models\Santri;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class SetoranController extends Controller
{
    public function index(Halaqah $halaqah, Request $request): Response
    {
        Gate::authorize('view', $halaqah);

        $mingguParam = $request->query('minggu') ?? $request->input('minggu');
        $mingguCarbon = $mingguParam !== null ? Carbon::parse($mingguParam) : now();
        $range = PekanHelper::weekRange($mingguCarbon);
        $senin = $range['senin'];
        $ahad = $range['ahad'];

        $santriId = $request->query('santri_id') ?? $request->input('santri_id');

        // Fallback to first santri in halaqah if not provided
        if ($santriId === null) {
            $santriId = $halaqah->santris()->pluck('santris.id')->first();
        }

        $santri = null;
        $harian = [];
        $totalSepekan = 0;
        $tasmiPekan = null;
        $totalBulanan = 0;
        $ujianBulanan = null;
        $catatanTasmi = null;
        $catatanUjian = null;

        $listSantris = $halaqah->santris()->orderBy('nama')->get(['santris.id', 'santris.nama', 'santris.nis']);

        $days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'ahad'];

        if ($santriId !== null) {
            $santri = $listSantris->firstWhere('id', (int) $santriId);
            // If santri not in list, load directly for error handling (but still try)
            if ($santri === null) {
                $santri = Santri::find($santriId);
            }

            $mutabaahs = Mutabaah::where('santri_id', $santriId)
                ->whereBetween('tanggal', [$senin->toDateString(), $ahad->toDateString()])
                ->get()
                ->keyBy(fn (Mutabaah $m) => Carbon::parse($m->tanggal)->toDateString());

            foreach ($days as $idx => $dayName) {
                $date = $senin->copy()->addDays($idx)->toDateString();
                $entry = $mutabaahs->get($date);
                $harian[$dayName] = $entry?->halaman;
            }

            $totalSepekan = collect($harian)->filter(fn ($v) => $v !== null)->sum();

            $tahun = $senin->year;
            $bulan = $senin->month;
            $bulanan = MutabaahBulanan::where('santri_id', $santriId)
                ->where('tahun', $tahun)
                ->where('bulan', $bulan)
                ->first();

            $pekanNumber = PekanHelper::pekanNumberInMonth($senin);
            $tasmiPekan = $bulanan?->{'tasmi_pekan_'.$pekanNumber};
            $ujianBulanan = $bulanan?->ujian_bulanan;
            $catatanTasmi = $bulanan?->catatan_tasmi;
            $catatanUjian = $bulanan?->catatan_ujian;

            // totalBulanan = sum halaman for the month (sum of all mutabaahs in that month)
            $totalBulanan = (int) Mutabaah::where('santri_id', $santriId)
                ->whereYear('tanggal', $tahun)
                ->whereMonth('tanggal', $bulan)
                ->sum('halaman');
        } else {
            foreach ($days as $dayName) {
                $harian[$dayName] = null;
            }
        }

        $settings = MutabaahSetting::setting();

        $minggu = [
            'senin' => $senin->toDateString(),
            'ahad' => $ahad->toDateString(),
            'pekan_ke' => PekanHelper::pekanNumberInMonth($senin),
        ];

        return Inertia::render('muhafidz/setoran/index', [
            'halaqah' => $halaqah,
            'santri' => $santri,
            'santris' => $listSantris,
            'listSantris' => $listSantris,
            'harian' => $harian,
            'totalSepekan' => $totalSepekan,
            'tasmiPekan' => $tasmiPekan,
            'totalBulanan' => $totalBulanan,
            'ujianBulanan' => $ujianBulanan,
            'catatanTasmi' => $catatanTasmi,
            'catatanUjian' => $catatanUjian,
            'minggu' => $minggu,
            'settings' => $settings->only(['konversi_juz_halaman', 'ambang_hadiah_juz', 'tahun_aktif']),
        ]);
    }

    public function store(StoreSetoranRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $halaqahId = $validated['halaqah_id'];
        $santriId = $validated['santri_id'];
        $mingguCarbon = Carbon::parse($validated['minggu']);
        $range = PekanHelper::weekRange($mingguCarbon);
        $senin = $range['senin'];

        $harian = $validated['harian'] ?? [];
        $tasmiPekan = $validated['tasmi_pekan'] ?? null;
        $ujianBulanan = $validated['ujian_bulanan'] ?? null;
        $catatanTasmi = $validated['catatan_tasmi'] ?? null;
        $catatanUjian = $validated['catatan_ujian'] ?? null;

        $muhafidzId = $request->user()->muhafidz->id;

        $tahun = $senin->year;
        $bulan = $senin->month;
        $pekanNumber = PekanHelper::pekanNumberInMonth($senin);
        $tasmiColumn = 'tasmi_pekan_'.$pekanNumber;

        $days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'ahad'];

        DB::transaction(function () use ($days, $harian, $senin, $santriId, $muhafidzId, $tahun, $bulan, $tasmiColumn, $tasmiPekan, $ujianBulanan, $catatanTasmi, $catatanUjian, $validated): void {
            foreach ($days as $idx => $dayName) {
                $value = $harian[$dayName] ?? null;
                $tanggal = $senin->copy()->addDays($idx)->toDateString();

                if ($value === null || $value === '') {
                    Mutabaah::where('santri_id', $santriId)->whereDate('tanggal', $tanggal)->delete();

                    continue;
                }

                Mutabaah::updateOrCreate(
                    ['santri_id' => $santriId, 'tanggal' => Carbon::parse($tanggal)],
                    [
                        'halaman' => (int) $value,
                        'muhafidz_id' => $muhafidzId,
                        'surah' => 'Al-Fatihah',
                        'ayat_mulai' => 1,
                        'ayat_selesai' => 1,
                    ]
                );
            }

            $hasCatatanTasmi = array_key_exists('catatan_tasmi', $validated);
            $hasCatatanUjian = array_key_exists('catatan_ujian', $validated);
            $hasUjian = array_key_exists('ujian_bulanan', $validated);
            $hasTasmi = array_key_exists('tasmi_pekan', $validated);

            $payload = [];

            if ($hasTasmi) {
                $payload[$tasmiColumn] = $tasmiPekan !== null ? (int) $tasmiPekan : null;
            }
            if ($hasUjian) {
                $payload['ujian_bulanan'] = $ujianBulanan !== null ? (int) $ujianBulanan : null;
            }
            if ($hasCatatanTasmi) {
                $payload['catatan_tasmi'] = $catatanTasmi;
            }
            if ($hasCatatanUjian) {
                $payload['catatan_ujian'] = $catatanUjian;
            }

            if ($payload !== []) {
                MutabaahBulanan::updateOrCreate(
                    ['santri_id' => $santriId, 'tahun' => $tahun, 'bulan' => $bulan],
                    $payload
                );
            } elseif (MutabaahBulanan::where('santri_id', $santriId)->where('tahun', $tahun)->where('bulan', $bulan)->exists() === false) {
                MutabaahBulanan::updateOrCreate(
                    ['santri_id' => $santriId, 'tahun' => $tahun, 'bulan' => $bulan],
                    []
                );
            }
        });

        $halaqah = Halaqah::find($halaqahId);

        return redirect()->route('muhafidz.setoran.index', [$halaqah, 'minggu' => $senin->toDateString(), 'santri_id' => $santriId])
            ->with('success', 'Setoran pekan '.$pekanNumber.' disimpan.');
    }
}
