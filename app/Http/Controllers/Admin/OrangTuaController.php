<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\OrangTua\StoreOrangTuaRequest;
use App\Http\Requests\Admin\OrangTua\UpdateOrangTuaRequest;
use App\Models\OrangTua;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class OrangTuaController extends Controller
{
    public function index(Request $request): Response
    {
        $orangTuas = OrangTua::query()
            ->with('user')
            ->withCount('santris')
            ->orderBy('nama')
            ->paginate(15);

        return Inertia::render('admin/orang-tuas/index', [
            'orangTuas' => $orangTuas,
        ]);
    }

    public function store(StoreOrangTuaRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated): void {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => $validated['password'],
                'role' => UserRole::OrangTua,
            ]);

            OrangTua::create([
                'user_id' => $user->id,
                'nama' => $validated['name'],
                'kontak' => $validated['kontak'] ?? null,
            ]);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Orang tua created.')]);

        return to_route('admin.orang-tuas.index');
    }

    public function update(UpdateOrangTuaRequest $request, OrangTua $orangTua): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated, $orangTua): void {
            $orangTua->update([
                'nama' => $validated['name'],
                'kontak' => $validated['kontak'] ?? null,
            ]);

            $orangTua->user->update([
                'name' => $validated['name'],
                'email' => $validated['email'],
            ]);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Orang tua updated.')]);

        return to_route('admin.orang-tuas.index');
    }

    public function destroy(Request $request, OrangTua $orangTua): RedirectResponse
    {
        $orangTua->user->delete();
        $orangTua->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Orang tua deleted.')]);

        return to_route('admin.orang-tuas.index');
    }
}
