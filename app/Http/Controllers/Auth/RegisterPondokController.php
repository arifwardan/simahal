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
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class RegisterPondokController extends Controller
{
    use PasswordValidationRules;
    use ProfileValidationRules;

    public function index(): Response
    {
        return Inertia::render('auth/register-pondok');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nama_yayasan' => ['required', 'string', 'max:150'],
            'slug' => ['required', 'string', 'alpha_dash', 'min:3', 'max:50', 'unique:pondoks,slug'],
            'name' => $this->nameRules(),
            'email' => $this->emailRules(),
            'password' => $this->passwordRules(),
        ]);

        $user = DB::transaction(function () use ($validated) {
            $pondok = Pondok::create([
                'nama_yayasan' => $validated['nama_yayasan'],
                'slug' => $validated['slug'],
            ]);

            return User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => $validated['password'],
                'role' => UserRole::Admin,
                'status' => UserStatus::Active,
                'pondok_id' => $pondok->id,
            ]);
        });

        Auth::login($user);

        return redirect()->route('dashboard');
    }
}
