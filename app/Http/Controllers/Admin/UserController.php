<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Santri\AssignOrangTuaRequest;
use App\Http\Requests\Admin\User\StoreUserRequest;
use App\Http\Requests\Admin\User\UpdateUserRequest;
use App\Models\OrangTua;
use App\Models\Santri;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $users = User::query()
            ->with(['santri', 'muhafidz', 'orangTua'])
            ->orderBy('name')
            ->paginate(5)
            ->through(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role->value,
                'role_label' => $user->roleLabel(),
                'status' => $user->status->value,
                'status_label' => $user->status === UserStatus::Active ? 'Aktif' : 'Menunggu',
            ]);

        $pendingCount = User::query()->where('status', UserStatus::Pending)->count();

        $pendingUsers = User::query()
            ->where('status', UserStatus::Pending)
            ->orderBy('created_at')
            ->get(['id', 'name', 'email'])
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ]);

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'pendingCount' => $pendingCount,
            'pendingUsers' => $pendingUsers,
            'roles' => collect(UserRole::cases())->map(fn (UserRole $role) => [
                'value' => $role->value,
                'label' => $role->label(),
            ]),
            'statuses' => [
                ['value' => UserStatus::Active->value, 'label' => 'Aktif'],
                ['value' => UserStatus::Pending->value, 'label' => 'Menunggu'],
            ],
            'assignOptions' => [
                'santris' => Santri::query()->orderBy('nama')->get(['id', 'nama', 'nis', 'orang_tua_id']),
                'orangTuas' => OrangTua::query()->orderBy('nama')->get(['id', 'nama']),
                'assignments' => Santri::query()
                    ->with('orangTua:id,nama')
                    ->orderBy('nama')
                    ->get(['id', 'nama', 'nis', 'orang_tua_id'])
                    ->map(fn (Santri $s) => [
                        'id' => $s->id,
                        'nama' => $s->nama,
                        'nis' => $s->nis,
                        'orang_tua_id' => $s->orang_tua_id,
                        'orang_tua_nama' => $s->orangTua?->nama,
                    ]),
            ],
        ]);
    }

    public function assignOrangTua(AssignOrangTuaRequest $request, Santri $santri): RedirectResponse
    {
        $santri->update(['orang_tua_id' => $request->validated()['orang_tua_id'] ?? null]);

        $message = $request->validated()['orang_tua_id']
            ? __('Orang tua berhasil di-assign ke santri.')
            : __('Assign orang tua dilepas.');

        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return to_route('admin.users.index');
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        User::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('User created.')]);

        return to_route('admin.users.index');
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $user->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('User updated.')]);

        return to_route('admin.users.index');
    }

    public function approve(Request $request, User $user): RedirectResponse
    {
        if ($user->id === $request->user()->id) {
            abort(403, __('You cannot approve your own account.'));
        }

        if ($user->status !== UserStatus::Pending) {
            abort(403, __('Only pending accounts can be approved.'));
        }

        $user->update(['status' => UserStatus::Active]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Akun :name disetujui dan diaktifkan.', ['name' => $user->name])]);

        return to_route('admin.users.index');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($user->id === $request->user()->id) {
            abort(403, __('You cannot delete your own account.'));
        }

        $user->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('User deleted.')]);

        return to_route('admin.users.index');
    }
}
