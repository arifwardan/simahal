<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\MutabaahSetting\UpdateMutabaahSettingRequest;
use App\Models\MutabaahSetting;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class MutabaahSettingController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('admin/mutabaah-settings', [
            'settings' => MutabaahSetting::setting(),
        ]);
    }

    public function update(UpdateMutabaahSettingRequest $request): RedirectResponse
    {
        MutabaahSetting::setting()->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Pengaturan mutabaah diperbarui.')]);

        return back();
    }
}
