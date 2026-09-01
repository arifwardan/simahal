<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Muhafidz\StoreMuhafidzRequest;
use App\Http\Requests\Admin\Muhafidz\UpdateMuhafidzRequest;
use App\Models\Muhafidz;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class MuhafidzController extends Controller
{
    public function index(Request $request): Response
    {
        $muhafidzs = Muhafidz::query()
            ->with('user')
            ->orderBy('nama')
            ->paginate(15);

        return Inertia::render('admin/muhafidzs/index', [
            'muhafidzs' => $muhafidzs,
        ]);
    }

    public function store(StoreMuhafidzRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated): void {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => $validated['password'],
                'role' => UserRole::Muhafidz,
            ]);

            Muhafidz::create([
                'user_id' => $user->id,
                'nama' => $validated['name'],
                'kontak' => $validated['kontak'] ?? null,
            ]);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Muhafidz created.')]);

        return to_route('admin.muhafidzs.index');
    }

    public function update(UpdateMuhafidzRequest $request, Muhafidz $muhafidz): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated, $muhafidz): void {
            $muhafidz->update([
                'nama' => $validated['name'],
                'kontak' => $validated['kontak'] ?? null,
            ]);

            $muhafidz->user->update([
                'name' => $validated['name'],
                'email' => $validated['email'],
            ]);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Muhafidz updated.')]);

        return to_route('admin.muhafidzs.index');
    }

    public function destroy(Request $request, Muhafidz $muhafidz): RedirectResponse
    {
        $muhafidz->user->delete();
        $muhafidz->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Muhafidz deleted.')]);

        return to_route('admin.muhafidzs.index');
    }
}
