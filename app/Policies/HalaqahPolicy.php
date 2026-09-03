<?php

namespace App\Policies;

use App\Models\Halaqah;
use App\Models\User;

class HalaqahPolicy
{
    public function view(User $user, Halaqah $halaqah): bool
    {
        return $user->muhafidz !== null && (int) $halaqah->muhafidz_id === (int) $user->muhafidz->id;
    }
}
