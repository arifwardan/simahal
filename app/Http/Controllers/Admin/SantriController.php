<?php

namespace App\Http\Controllers\Admin;

use App\Enums\SantriJenis;
use App\Enums\SantriStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Santri\StoreSantriRequest;
use App\Http\Requests\Admin\Santri\UpdateSantriRequest;
use App\Models\OrangTua;
use App\Models\Santri;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SantriController extends Controller
{
    public function index(Request $request): Response
    {
        $santris = Santri::query()
            ->with(['user', 'orangTua'])
            ->orderBy('nama')
            ->paginate(15);

        return Inertia::render('admin/santris/index', [
            'santris' => $santris,
            'orangTuas' => OrangTua::query()->orderBy('nama')->get(['id', 'nama']),
            'statuses' => collect(SantriStatus::cases())->map(fn (SantriStatus $status) => [
                'value' => $status->value,
                'label' => $status->label(),
            ]),
            'jenisOptions' => collect(SantriJenis::cases())->map(fn (SantriJenis $jenis) => [
                'value' => $jenis->value,
                'label' => $jenis->label(),
            ]),
        ]);
    }

    public function store(StoreSantriRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated): void {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => $validated['password'],
                'role' => UserRole::Santri,
            ]);

            Santri::create([
                'user_id' => $user->id,
                'orang_tua_id' => $validated['orang_tua_id'] ?? null,
                'nis' => $validated['nis'] ?? null,
                'nama' => $validated['name'],
                'tanggal_lahir' => $validated['tanggal_lahir'] ?? null,
                'status' => $validated['status'],
                'halaman_awal' => $validated['halaman_awal'] ?? null,
                'jenis' => $validated['jenis'] ?? null,
            ]);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Santri created.')]);

        return to_route('admin.santris.index');
    }

    public function update(UpdateSantriRequest $request, Santri $santri): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated, $santri): void {
            $santri->update([
                'orang_tua_id' => $validated['orang_tua_id'] ?? null,
                'nis' => $validated['nis'] ?? null,
                'nama' => $validated['name'],
                'tanggal_lahir' => $validated['tanggal_lahir'] ?? null,
                'status' => $validated['status'],
                'halaman_awal' => $validated['halaman_awal'] ?? null,
                'jenis' => $validated['jenis'] ?? null,
            ]);

            $santri->user->update([
                'name' => $validated['name'],
                'email' => $validated['email'],
            ]);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Santri updated.')]);

        return to_route('admin.santris.index');
    }

    public function destroy(Request $request, Santri $santri): RedirectResponse
    {
        $santri->user->delete();
        $santri->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Santri deleted.')]);

        return to_route('admin.santris.index');
    }
}
