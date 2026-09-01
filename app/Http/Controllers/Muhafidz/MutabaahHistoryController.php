<?php

namespace App\Http\Controllers\Muhafidz;

use App\Http\Controllers\Controller;
use App\Models\Santri;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MutabaahHistoryController extends Controller
{
    public function index(Request $request): Response
    {
        $muhafidz = $request->user()->muhafidz;

        abort_unless($muhafidz !== null, 403, __('You do not have a muhafidz profile.'));

        $santriOptions = $muhafidz->halaqahs()
            ->with('santris:id,nama')
            ->get()
            ->flatMap->santris
            ->unique('id')
            ->values()
            ->map(fn (Santri $santri) => ['id' => $santri->id, 'nama' => $santri->nama]);

        $mutabaahs = $muhafidz->mutabaahs()
            ->with('santri')
            ->when($request->filled('santri'), function ($query) use ($request) {
                $query->where('santri_id', $request->integer('santri'));
            })
            ->orderBy('tanggal', 'desc')
            ->paginate(6)
            ->withQueryString();

        return Inertia::render('muhafidz/mutabaahs/history', [
            'mutabaahs' => $mutabaahs,
            'santriOptions' => $santriOptions,
        ]);
    }
}
