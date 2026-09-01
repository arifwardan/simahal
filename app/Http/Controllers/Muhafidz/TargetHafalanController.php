<?php

namespace App\Http\Controllers\Muhafidz;

use App\Actions\Mutabaah\RecalculateTargetProgress;
use App\Enums\TargetHafalanStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Muhafidz\StoreTargetHafalanRequest;
use App\Http\Requests\Muhafidz\UpdateTargetHafalanRequest;
use App\Models\Santri;
use App\Models\TargetHafalan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TargetHafalanController extends Controller
{
    public function index(Request $request): Response
    {
        $muhafidz = $request->user()->muhafidz;

        abort_unless($muhafidz !== null, 403, __('You do not have a muhafidz profile.'));

        $santris = $muhafidz->halaqahs()
            ->with(['santris' => fn ($query) => $query->with('targetHafalans')->orderBy('nama')])
            ->get()
            ->flatMap->santris
            ->unique('id')
            ->values();

        return Inertia::render('muhafidz/targets/index', [
            'santris' => $santris->map(fn (Santri $santri) => [
                'id' => $santri->id,
                'nama' => $santri->nama,
                'nis' => $santri->nis,
                'targets' => $santri->targetHafalans->sortByDesc('id')->values()->map(fn (TargetHafalan $target) => [
                    'id' => $target->id,
                    'periode' => $target->periode,
                    'target' => $target->target,
                    'progress' => $target->progress,
                    'progress_percent' => $target->progressPercent(),
                    'status' => $target->status->value,
                    'status_label' => $target->status->label(),
                ]),
            ]),
            'statuses' => collect(TargetHafalanStatus::cases())->map(fn (TargetHafalanStatus $status) => [
                'value' => $status->value,
                'label' => $status->label(),
            ]),
        ]);
    }

    public function store(StoreTargetHafalanRequest $request): RedirectResponse
    {
        $muhafidz = $request->user()->muhafidz;
        $validated = $request->validated();

        abort_unless($this->managesSantri($muhafidz, $validated['santri_id']), 403, __('This santri is not in any of your halaqah.'));

        TargetHafalan::create($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Target created.')]);

        return to_route('muhafidz.targets.index');
    }

    public function update(UpdateTargetHafalanRequest $request, TargetHafalan $targetHafalan): RedirectResponse
    {
        $muhafidz = $request->user()->muhafidz;

        abort_unless($this->managesSantri($muhafidz, $targetHafalan->santri_id), 403, __('This santri is not in any of your halaqah.'));

        $targetHafalan->update($request->validated());

        $targetHafalan->loadMissing('santri');
        app(RecalculateTargetProgress::class)->run($targetHafalan->santri);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Target updated.')]);

        return to_route('muhafidz.targets.index');
    }

    public function destroy(Request $request, TargetHafalan $targetHafalan): RedirectResponse
    {
        $muhafidz = $request->user()->muhafidz;

        abort_unless($this->managesSantri($muhafidz, $targetHafalan->santri_id), 403, __('This santri is not in any of your halaqah.'));

        $targetHafalan->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Target deleted.')]);

        return to_route('muhafidz.targets.index');
    }

    private function managesSantri(mixed $muhafidz, int $santriId): bool
    {
        return $muhafidz?->halaqahs()
            ->whereHas('santris', fn ($query) => $query->whereKey($santriId))
            ->exists() ?? false;
    }
}
