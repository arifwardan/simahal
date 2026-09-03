<?php

namespace App\Http\Controllers\Admin;

use App\Enums\HalaqahStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Halaqah\StoreHalaqahRequest;
use App\Http\Requests\Admin\Halaqah\UpdateHalaqahRequest;
use App\Models\Halaqah;
use App\Models\Muhafidz;
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
            ->with(['muhafidz'])
            ->withCount('santris')
            ->orderBy('nama')
            ->paginate(5)
            ->through(fn (Halaqah $halaqah) => [
                'id' => $halaqah->id,
                'nama' => $halaqah->nama,
                'jam_mulai' => $halaqah->jam_mulai ? substr($halaqah->jam_mulai, 0, 5) : null,
                'jam_selesai' => $halaqah->jam_selesai ? substr($halaqah->jam_selesai, 0, 5) : null,
                'status' => $halaqah->status->value,
                'santris_count' => $halaqah->santris_count,
                'muhafidz' => $halaqah->muhafidz ? ['id' => $halaqah->muhafidz->id, 'nama' => $halaqah->muhafidz->nama] : null,
            ]);

        return Inertia::render('admin/halaqahs/index', [
            'halaqahs' => $halaqahs,
            'muhafidzs' => Muhafidz::query()->orderBy('nama')->get(['id', 'nama']),
            'statuses' => collect(HalaqahStatus::cases())->map(fn (HalaqahStatus $status) => [
                'value' => $status->value,
                'label' => $status->label(),
            ]),
        ]);
    }

    public function store(StoreHalaqahRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $muhafidzIds = $validated['muhafidz_ids'] ?? (isset($validated['muhafidz_id']) ? [$validated['muhafidz_id']] : []);

        DB::transaction(function () use ($validated, $muhafidzIds): void {
            foreach ($muhafidzIds as $muhafidzId) {
                Halaqah::create([
                    'nama' => $validated['nama'],
                    'muhafidz_id' => $muhafidzId,
                    'jam_mulai' => $validated['jam_mulai'],
                    'jam_selesai' => $validated['jam_selesai'],
                    'status' => $validated['status'],
                ]);
            }
        });

        $message = count($muhafidzIds) > 1
            ? __('Halaqah created for :count muhafidz.', ['count' => count($muhafidzIds)])
            : __('Halaqah created.');

        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return to_route('admin.halaqahs.index');
    }

    public function update(UpdateHalaqahRequest $request, Halaqah $halaqah): RedirectResponse
    {
        $validated = $request->validated();

        $halaqah->update([
            'nama' => $validated['nama'],
            'muhafidz_id' => $validated['muhafidz_id'],
            'jam_mulai' => $validated['jam_mulai'],
            'jam_selesai' => $validated['jam_selesai'],
            'status' => $validated['status'],
        ]);

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
