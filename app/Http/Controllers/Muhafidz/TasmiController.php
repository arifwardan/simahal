<?php

namespace App\Http\Controllers\Muhafidz;

use App\Helpers\PekanHelper;
use App\Http\Controllers\Controller;
use App\Models\HalaqahMember;
use App\Models\Mutabaah;
use App\Models\MutabaahBulanan;
use App\Models\Santri;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TasmiController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $halaqahIds = $user->muhafidz->halaqahs()->pluck('halaqahs.id');
        $santris = Santri::whereIn('id', function ($q) use ($halaqahIds): void {
            $q->select('santri_id')->from('halaqah_members')->whereIn('halaqah_id', $halaqahIds);
        })->orderBy('nama')->get(['id', 'nama', 'nis']);

        $santriId = $request->query('santri_id', $santris->first()?->id);
        $mingguParam = $request->query('minggu', now()->toDateString());
        $range = PekanHelper::weekRange(Carbon::parse($mingguParam));
        $senin = $range['senin'];
        $ahad = $range['ahad'];

        $totalSepekan = 0;
        $tasmiPekan = null;
        $catatanTasmi = null;

        if ($santriId !== null) {
            $totalSepekan = (int) Mutabaah::where('santri_id', $santriId)
                ->whereBetween('tanggal', [$senin->toDateString(), $ahad->toDateString()])
                ->sum('halaman');

            $bulanan = MutabaahBulanan::where('santri_id', $santriId)
                ->where('tahun', $senin->year)
                ->where('bulan', $senin->month)
                ->first();

            $tasmiPekan = $bulanan?->{'tasmi_pekan_'.PekanHelper::pekanNumberInMonth($senin)};
            $catatanTasmi = $bulanan?->catatan_tasmi;
        }

        return Inertia::render('muhafidz/tasmi/index', [
            'santris' => $santris,
            'santriId' => $santriId !== null ? (int) $santriId : null,
            'minggu' => [
                'senin' => $senin->toDateString(),
                'ahad' => $ahad->toDateString(),
                'pekan_ke' => PekanHelper::pekanNumberInMonth($senin),
            ],
            'totalSepekan' => $totalSepekan,
            'tasmiPekan' => $tasmiPekan,
            'catatanTasmi' => $catatanTasmi,
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
            'minggu' => ['required', 'date', 'before_or_equal:today'],
            'tasmi_pekan' => ['nullable', 'integer', 'min:10', 'max:100'],
            'catatan_tasmi' => ['nullable', 'string', 'max:1000'],
        ]);

        $range = PekanHelper::weekRange(Carbon::parse($validated['minggu']));
        $senin = $range['senin'];
        $pekanNumber = PekanHelper::pekanNumberInMonth($senin);

        $payload = [];

        if (array_key_exists('tasmi_pekan', $validated)) {
            $payload['tasmi_pekan_'.$pekanNumber] = $validated['tasmi_pekan'] !== null ? (int) $validated['tasmi_pekan'] : null;
        }

        if (array_key_exists('catatan_tasmi', $validated)) {
            $payload['catatan_tasmi'] = $validated['catatan_tasmi'];
        }

        MutabaahBulanan::updateOrCreate(
            ['santri_id' => $validated['santri_id'], 'tahun' => $senin->year, 'bulan' => $senin->month],
            $payload
        );

        return redirect()->route('muhafidz.tasmi.index', ['santri_id' => $validated['santri_id'], 'minggu' => $senin->toDateString()])
            ->with('success', 'Tasmi pekan '.$pekanNumber.' disimpan.');
    }
}
