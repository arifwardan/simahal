<?php

namespace App\Http\Controllers\Admin;

use App\Enums\HalaqahStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Halaqah\StoreHalaqahRequest;
use App\Http\Requests\Admin\Halaqah\UpdateHalaqahRequest;
use App\Models\Halaqah;
use App\Models\Santri;
use App\Models\Ustadz;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class HalaqahController extends Controller
{
    public function index(Request $request): Response
    {
        $halaqahs = Halaqah::query()
            ->with('ustadz')
            ->withCount('santris')
            ->orderBy('nama')
            ->paginate(15);

        return Inertia::render('admin/halaqahs/index', [
            'halaqahs' => $halaqahs,
            'ustadzs' => Ustadz::query()->orderBy('nama')->get(['id', 'nama']),
            'santris' => Santri::query()->orderBy('nama')->get(['id', 'nama']),
            'statuses' => collect(HalaqahStatus::cases())->map(fn (HalaqahStatus $status) => [
                'value' => $status->value,
                'label' => $status->label(),
            ]),
        ]);
    }

    public function store(StoreHalaqahRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated): void {
            $halaqah = Halaqah::create([
                'nama' => $validated['nama'],
                'ustadz_id' => $validated['ustadz_id'],
                'jadwal' => $validated['jadwal'] ?? null,
                'status' => $validated['status'],
            ]);

            $halaqah->santris()->sync($validated['santri_ids'] ?? []);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Halaqah created.')]);

        return to_route('admin.halaqahs.index');
    }

    public function update(UpdateHalaqahRequest $request, Halaqah $halaqah): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated, $halaqah): void {
            $halaqah->update([
                'nama' => $validated['nama'],
                'ustadz_id' => $validated['ustadz_id'],
                'jadwal' => $validated['jadwal'] ?? null,
                'status' => $validated['status'],
            ]);

            $halaqah->santris()->sync($validated['santri_ids'] ?? []);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Halaqah updated.')]);

        return to_route('admin.halaqahs.index');
    }

    public function destroy(Request $request, Halaqah $halaqah): RedirectResponse
    {
        $halaqah->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Halaqah deleted.')]);

        return to_route('admin.halaqahs.index');
    }
}
