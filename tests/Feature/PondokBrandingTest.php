<?php

use App\Enums\UserRole;
use App\Models\Pondok;
use App\Models\User;

it('shares pondok branding in inertia props', function (): void {
    $pondok = Pondok::factory()->create(['nama_yayasan' => 'Yayasan Cahaya', 'logo_path' => 'logos/x.png']);
    $user = User::factory()->create(['pondok_id' => $pondok->id, 'role' => UserRole::Admin]);

    $this->actingAs($user)->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('pondok.nama_yayasan', 'Yayasan Cahaya')
            ->where('pondok.slug', $pondok->slug)
            ->has('pondok.logo_url'));
});

it('shares null pondok for guests', function (): void {
    $this->get(route('login'))->assertOk()
        ->assertInertia(fn ($page) => $page->where('pondok', null));
});
