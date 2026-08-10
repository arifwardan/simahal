<?php

namespace App\Http\Controllers\Ustadz;

use App\Http\Controllers\Controller;
use App\Models\Santri;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MutabaahHistoryController extends Controller
{
    public function index(Request $request): Response
    {
        $ustadz = $request->user()->ustadz;

        abort_unless($ustadz !== null, 403, __('You do not have a ustadz profile.'));

        $santriOptions = $ustadz->halaqahs()
            ->with('santris:id,nama')
            ->get()
            ->flatMap->santris
            ->unique('id')
            ->values()
            ->map(fn (Santri $santri) => ['id' => $santri->id, 'nama' => $santri->nama]);

        $mutabaahs = $ustadz->mutabaahs()
            ->with('santri')
            ->when($request->filled('santri'), function ($query) use ($request) {
                $query->where('santri_id', $request->integer('santri'));
            })
            ->orderBy('tanggal', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('ustadz/mutabaahs/history', [
            'mutabaahs' => $mutabaahs,
            'santriOptions' => $santriOptions,
        ]);
    }
}
