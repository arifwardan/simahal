<?php

namespace App\Http\Controllers\Ustadz;

use App\Http\Controllers\Controller;
use App\Models\Halaqah;
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

        return Inertia::render('ustadz/halaqahs/santris', [
            'halaqah' => $halaqah,
            'santris' => $santris,
        ]);
    }
}
