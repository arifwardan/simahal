<?php

namespace App\Http\Controllers\Auth;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Models\Pondok;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class JoinPondokController extends Controller
{
    use PasswordValidationRules;
    use ProfileValidationRules;

    public function index(): Response
    {
        return Inertia::render('auth/join-pondok', [
            'pondoks' => Pondok::query()
                ->orderBy('nama_yayasan')
                ->get(['id', 'nama_yayasan', 'slug']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'pondok_id' => ['required', 'integer', Rule::exists('pondoks', 'id')],
            'role' => ['required', Rule::in([UserRole::Muhafidz->value, UserRole::Santri->value])],
            'name' => $this->nameRules(),
            'email' => $this->emailRules(),
            'password' => $this->passwordRules(),
        ]);

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => UserRole::from($validated['role']),
            'status' => UserStatus::Pending,
            'pondok_id' => $validated['pondok_id'],
        ]);

        return redirect()->route('login')->with('status', 'Pendaftaran terkirim. Akun menunggu persetujuan admin pondok.');
    }
}
