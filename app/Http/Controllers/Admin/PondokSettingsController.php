<?php

namespace App\Http\Controllers\Admin;

use App\Enums\SantriStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Models\Muhafidz;
use App\Models\Santri;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PondokSettingsController extends Controller
{
    public function edit(Request $request): Response
    {
        $pondok = $request->user()->pondok;

        $pendings = User::query()
            ->withoutGlobalScope('pondok')
            ->where('pondok_id', $pondok->id)
            ->where('status', UserStatus::Pending)
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role']);

        $users = User::query()
            ->withoutGlobalScope('pondok')
            ->where('pondok_id', $pondok->id)
            ->where('status', UserStatus::Active)
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role']);

        return Inertia::render('admin/pondok-settings', [
            'pondok' => [
                'id' => $pondok->id,
                'nama_yayasan' => $pondok->nama_yayasan,
                'slug' => $pondok->slug,
                'logo_url' => $pondok->logoUrl(),
            ],
            'pendings' => $pendings->map(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role->value,
                'role_label' => $user->role->label(),
            ]),
            'users' => $users->map(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role->value,
                'role_label' => $user->role->label(),
            ]),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nama_yayasan' => ['required', 'string', 'max:150'],
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png', 'max:2048'],
        ]);

        $pondok = $request->user()->pondok;

        if ($request->hasFile('logo')) {
            if ($pondok->logo_path !== null) {
                Storage::disk('public')->delete($pondok->logo_path);
            }

            $pondok->logo_path = $request->file('logo')->store('logos', 'public');
        }

        $pondok->nama_yayasan = $validated['nama_yayasan'];
        $pondok->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Pondok settings updated.')]);

        return to_route('admin.pondok-settings.edit');
    }

    public function approve(Request $request, int $user): RedirectResponse
    {
        $admin = $request->user();

        $pending = User::query()
            ->withoutGlobalScope('pondok')
            ->where('status', UserStatus::Pending)
            ->findOrFail($user);

        abort_unless($pending->pondok_id === $admin->pondok_id, 403);

        DB::transaction(function () use ($pending): void {
            $pending->update(['status' => UserStatus::Active]);

            if ($pending->role === UserRole::Muhafidz) {
                Muhafidz::create([
                    'user_id' => $pending->id,
                    'nama' => $pending->name,
                    'pondok_id' => $pending->pondok_id,
                ]);
            }

            if ($pending->role === UserRole::Santri) {
                Santri::create([
                    'user_id' => $pending->id,
                    'nama' => $pending->name,
                    'status' => SantriStatus::Aktif,
                    'pondok_id' => $pending->pondok_id,
                ]);
            }
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('User approved.')]);

        return to_route('admin.pondok-settings.edit');
    }

    public function reject(Request $request, int $user): RedirectResponse
    {
        $admin = $request->user();

        $pending = User::query()
            ->withoutGlobalScope('pondok')
            ->where('status', UserStatus::Pending)
            ->findOrFail($user);

        abort_unless($pending->pondok_id === $admin->pondok_id, 403);

        $pending->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('User rejected.')]);

        return to_route('admin.pondok-settings.edit');
    }
}
