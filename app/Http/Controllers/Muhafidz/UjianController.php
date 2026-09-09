<?php

namespace App\Http\Controllers\Muhafidz;

use App\Http\Controllers\Controller;
use App\Models\HalaqahMember;
use App\Models\Mutabaah;
use App\Models\MutabaahBulanan;
use App\Models\Santri;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UjianController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $halaqahIds = $user->muhafidz->halaqahs()->pluck('halaqahs.id');
        $santris = Santri::whereIn('id', function ($q) use ($halaqahIds): void {
            $q->select('santri_id')->from('halaqah_members')->whereIn('halaqah_id', $halaqahIds);
        })->orderBy('nama')->get(['id', 'nama', 'nis']);

        $santriId = $request->query('santri_id', $santris->first()?->id);
        $tahun = (int) $request->query('tahun', now()->year);
        $bulan = (int) $request->query('bulan', now()->month);

        $totalBulanan = 0;
        $ujianSoal = [null, null, null, null, null];
        $ujianTotal = 0;
        $catatanUjian = null;

        if ($santriId !== null) {
            $totalBulanan = (int) Mutabaah::where('santri_id', $santriId)
                ->whereYear('tanggal', $tahun)
                ->whereMonth('tanggal', $bulan)
                ->sum('halaman');

            $bulanan = MutabaahBulanan::where('santri_id', $santriId)
                ->where('tahun', $tahun)
                ->where('bulan', $bulan)
                ->first();

            $ujianSoal = [
                $bulanan?->ujian_soal_1,
                $bulanan?->ujian_soal_2,
                $bulanan?->ujian_soal_3,
                $bulanan?->ujian_soal_4,
                $bulanan?->ujian_soal_5,
            ];
            $ujianTotal = $bulanan?->ujianTotal() ?? 0;
            $catatanUjian = $bulanan?->catatan_ujian;
        }

        return Inertia::render('muhafidz/ujian/index', [
            'santris' => $santris,
            'santriId' => $santriId !== null ? (int) $santriId : null,
            'tahun' => $tahun,
            'bulan' => $bulan,
            'totalBulanan' => $totalBulanan,
            'ujianSoal' => $ujianSoal,
            'ujianTotal' => $ujianTotal,
            'catatanUjian' => $catatanUjian,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'santri_id' => [
                'required',
                'exists:santris,id',
                function (string $attribute, mixed $value, \Closure $fail) use ($request): void {
                    $belongs = HalaqahMember::where('santri_id', $value)
                        ->whereHas('halaqah', fn ($q) => $q->where('muhafidz_id', $request->user()->muhafidz->id))
                        ->exists();

                    if (! $belongs) {
                        $fail('Santri tidak terdaftar di halaqah Anda.');
                    }
                },
            ],
            'tahun' => ['required', 'integer', 'min:2000', 'max:2100'],
            'bulan' => ['required', 'integer', 'min:1', 'max:12'],
            'ujian_soal' => ['nullable', 'array', 'size:5'],
            'ujian_soal.*' => ['nullable', 'boolean'],
            'catatan_ujian' => ['nullable', 'string', 'max:1000'],
        ]);

        $payload = [];

        if (array_key_exists('ujian_soal', $validated) && $validated['ujian_soal'] !== null) {
            foreach (range(1, 5) as $i) {
                $payload['ujian_soal_'.$i] = $validated['ujian_soal'][$i - 1] ?? null;
            }
            $payload['ujian_bulanan'] = collect($validated['ujian_soal'])->filter(fn ($v) => $v === true)->count() * 20;
        }

        if (array_key_exists('catatan_ujian', $validated)) {
            $payload['catatan_ujian'] = $validated['catatan_ujian'];
        }

        MutabaahBulanan::updateOrCreate(
            ['santri_id' => $validated['santri_id'], 'tahun' => $validated['tahun'], 'bulan' => $validated['bulan']],
            $payload
        );

        return redirect()->route('muhafidz.ujian.index', ['santri_id' => $validated['santri_id'], 'tahun' => $validated['tahun'], 'bulan' => $validated['bulan']])
            ->with('success', 'Ujian bulanan disimpan.');
    }
}
