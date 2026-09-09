<?php

namespace App\Http\Controllers\Santri;

use App\Actions\Mutabaah\RecalculateTargetProgress;
use App\Enums\TargetHafalanStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Santri\StoreTargetHafalanRequest;
use App\Models\TargetHafalan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TargetHafalanController extends Controller
{
    public function index(Request $request): Response
    {
        $santri = $request->user()->santri;
        abort_unless($santri !== null, 403);

        $targets = $santri->targetHafalans()->orderByDesc('id')->get()->map(fn (TargetHafalan $t) => [
            'id' => $t->id,
            'periode' => $t->periode,
            'target' => $t->target,
            'progress' => $t->progress,
            'progress_percent' => $t->progressPercent(),
            'status' => $t->status->value,
            'status_label' => $t->status->label(),
        ]);

        return Inertia::render('santri/targets/index', [
            'targets' => $targets,
            'statuses' => collect(TargetHafalanStatus::cases())->map(fn ($s) => ['value' => $s->value, 'label' => $s->label()]),
        ]);
    }

    public function store(StoreTargetHafalanRequest $request): RedirectResponse
    {
        $santri = $request->user()->santri;
        $validated = $request->validated();
        $validated['santri_id'] = $santri->id;

        TargetHafalan::create($validated);
        Inertia::flash('toast', ['type' => 'success', 'message' => __('Target dibuat.')]);

        return to_route('santri.targets.index');
    }

    public function update(StoreTargetHafalanRequest $request, TargetHafalan $targetHafalan): RedirectResponse
    {
        $santri = $request->user()->santri;
        abort_unless((int) $targetHafalan->santri_id === (int) $santri->id, 403);
        $targetHafalan->update($request->validated());
        app(RecalculateTargetProgress::class)->run($santri);
        Inertia::flash('toast', ['type' => 'success', 'message' => __('Target diperbarui.')]);

        return to_route('santri.targets.index');
    }

    public function destroy(Request $request, TargetHafalan $targetHafalan): RedirectResponse
    {
        $santri = $request->user()->santri;
        abort_unless((int) $targetHafalan->santri_id === (int) $santri->id, 403);
        $targetHafalan->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => __('Target dihapus.')]);

        return to_route('santri.targets.index');
    }
}
