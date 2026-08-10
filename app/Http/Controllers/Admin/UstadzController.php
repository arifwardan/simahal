<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Ustadz\StoreUstadzRequest;
use App\Http\Requests\Admin\Ustadz\UpdateUstadzRequest;
use App\Models\User;
use App\Models\Ustadz;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class UstadzController extends Controller
{
    public function index(Request $request): Response
    {
        $ustadzs = Ustadz::query()
            ->with('user')
            ->orderBy('nama')
            ->paginate(15);

        return Inertia::render('admin/ustadzs/index', [
            'ustadzs' => $ustadzs,
        ]);
    }

    public function store(StoreUstadzRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated): void {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => $validated['password'],
                'role' => UserRole::Ustadz,
            ]);

            Ustadz::create([
                'user_id' => $user->id,
                'nama' => $validated['name'],
                'kontak' => $validated['kontak'] ?? null,
            ]);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Ustadz created.')]);

        return to_route('admin.ustadzs.index');
    }

    public function update(UpdateUstadzRequest $request, Ustadz $ustadz): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated, $ustadz): void {
            $ustadz->update([
                'nama' => $validated['name'],
                'kontak' => $validated['kontak'] ?? null,
            ]);

            $ustadz->user->update([
                'name' => $validated['name'],
                'email' => $validated['email'],
            ]);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Ustadz updated.')]);

        return to_route('admin.ustadzs.index');
    }

    public function destroy(Request $request, Ustadz $ustadz): RedirectResponse
    {
        $ustadz->user->delete();
        $ustadz->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Ustadz deleted.')]);

        return to_route('admin.ustadzs.index');
    }
}
