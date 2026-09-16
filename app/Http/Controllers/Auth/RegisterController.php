<?php

namespace App\Http\Controllers\Auth;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RegisterController extends Controller
{
    use PasswordValidationRules;
    use ProfileValidationRules;

    public function show(): Response
    {
        return Inertia::render('auth/register');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => UserRole::Admin,
            'status' => UserStatus::Pending,
        ]);

        event(new Registered($user));

        return redirect()->route('login')->with([
            'status' => 'Akun Anda berhasil didaftarkan. Silakan hubungi admin untuk mengaktifkan akun.',
        ]);
    }
}
