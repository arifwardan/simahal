<?php

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Muhafidz;
use App\Models\Pondok;
use App\Models\Santri;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

it('approves a pending join and creates the role row', function (): void {
    $pondok = Pondok::factory()->create();
    $admin = User::factory()->create(['pondok_id' => $pondok->id, 'role' => UserRole::Admin]);
    $pending = User::factory()->create([
        'pondok_id' => $pondok->id, 'role' => UserRole::Santri, 'status' => UserStatus::Pending,
    ]);

    $this->actingAs($admin)->post(route('admin.approvals.approve', $pending))->assertRedirect();

    expect($pending->fresh()->status)->toBe(UserStatus::Active);
    expect(Santri::where('user_id', $pending->id)->exists())->toBeTrue();
});

it('rejects cross-pondok approval with 403', function (): void {
    $a = Pondok::factory()->create();
    $b = Pondok::factory()->create();
    $admin = User::factory()->create(['pondok_id' => $a->id, 'role' => UserRole::Admin]);
    $pending = User::factory()->create([
        'pondok_id' => $b->id, 'role' => UserRole::Muhafidz, 'status' => UserStatus::Pending,
    ]);

    $this->actingAs($admin)->post(route('admin.approvals.approve', $pending))->assertForbidden();
    expect(Muhafidz::where('pondok_id', $b->id)->count())->toBe(0);
});

it('uploads a pondok logo', function (): void {
    Storage::fake('public');
    $pondok = Pondok::factory()->create();
    $admin = User::factory()->create(['pondok_id' => $pondok->id, 'role' => UserRole::Admin]);

    $this->actingAs($admin)->patch(route('admin.pondok-settings.update'), [
        'nama_yayasan' => 'Yayasan Baru',
        'logo' => UploadedFile::fake()->image('logo.png'),
    ])->assertRedirect();

    $pondok->refresh();
    expect($pondok->nama_yayasan)->toBe('Yayasan Baru');
    Storage::disk('public')->assertExists($pondok->logo_path);
});
