<?php

use App\Enums\MutabaahStatus;
use App\Enums\SantriJenis;
use App\Enums\TargetHafalanStatus;
use App\Enums\UserRole;
use App\Models\Halaqah;
use App\Models\Mutabaah;
use App\Models\OrangTua;
use App\Models\Santri;
use App\Models\TargetHafalan;
use App\Models\User;
use App\Models\Ustadz;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    Santri::factory()->create(['user_id' => $user->id]);
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

test('santri without a profile gets a clean 403', function () {
    $user = User::factory()->create(['role' => UserRole::Santri]);

    $this->actingAs($user)->get(route('dashboard'))->assertForbidden();
});

test('ustadz without a profile gets a clean 403', function () {
    $user = User::factory()->create(['role' => UserRole::Ustadz]);

    $this->actingAs($user)->get(route('dashboard'))->assertForbidden();
});

test('orang tua without a profile gets a clean 403', function () {
    $user = User::factory()->create(['role' => UserRole::OrangTua]);

    $this->actingAs($user)->get(route('dashboard'))->assertForbidden();
});

test('admin dashboard renders the admin component', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);

    $this->actingAs($admin)->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('dashboard/admin'));
});

test('ustadz dashboard renders the ustadz component with their halaqah', function () {
    $user = User::factory()->create(['role' => UserRole::Ustadz]);
    $ustadz = Ustadz::factory()->create(['user_id' => $user->id]);
    Halaqah::factory()->count(2)->create(['ustadz_id' => $ustadz->id]);
    $own = Mutabaah::factory()->count(6)->create(['ustadz_id' => $ustadz->id]);
    $other = Ustadz::factory()->create();
    Mutabaah::factory()->count(2)->create(['ustadz_id' => $other->id]);

    $this->actingAs($user)->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard/ustadz')
            ->has('halaqahs', 2)
            ->has('recentMutabaahs', 5)
            ->where('totalMutabaahs', 6));
});

test('santri dashboard renders the santri component with progress', function () {
    $user = User::factory()->create(['role' => UserRole::Santri]);
    $santri = Santri::factory()->create(['user_id' => $user->id]);
    TargetHafalan::factory()->create(['santri_id' => $santri->id, 'target' => 40, 'progress' => 10]);
    Mutabaah::factory()->count(2)->create(['santri_id' => $santri->id]);

    $this->actingAs($user)->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard/santri')
            ->where('progress.target', 40)
            ->where('progress.progress', 10)
            ->where('progress.percent', 25)
            ->has('riwayat', 2));
});

test('orang tua dashboard renders only their own children', function () {
    $user = User::factory()->create(['role' => UserRole::OrangTua]);
    $orangTua = OrangTua::factory()->create(['user_id' => $user->id]);
    $ownChild = Santri::factory()->create(['orang_tua_id' => $orangTua->id, 'nama' => 'Anak Saya']);
    $otherParent = OrangTua::factory()->create();
    Santri::factory()->create(['orang_tua_id' => $otherParent->id, 'nama' => 'Anak Orang Lain']);

    $this->actingAs($user)->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard/orang-tua')
            ->has('children', 1)
            ->where('children.0.nama', 'Anak Saya'));
});

test('admin dashboard shows global counts', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    Santri::factory()->count(4)->create();
    $ustadzs = Ustadz::factory()->count(2)->create();
    OrangTua::factory()->count(1)->create();
    Halaqah::factory()->count(3)->create(['ustadz_id' => $ustadzs->first()->id]);

    $this->actingAs($admin)->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('counts.santris', 4)
            ->where('counts.ustadzs', 2)
            ->where('counts.halaqahs', 3));
});

test('admin dashboard includes mutabaah status distribution', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);

    Mutabaah::factory()->count(3)->create(['status' => MutabaahStatus::Lulus]);
    Mutabaah::factory()->count(2)->create(['status' => MutabaahStatus::PerluMurajaah]);
    Mutabaah::factory()->count(1)->create(['status' => MutabaahStatus::Mengulang]);

    $this->actingAs($admin)->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('mutabaahByStatus.0', ['key' => 'lulus', 'label' => 'Lulus', 'count' => 3])
            ->where('mutabaahByStatus.1', ['key' => 'perlu_murajaah', 'label' => 'Perlu Murajaah', 'count' => 2])
            ->where('mutabaahByStatus.2', ['key' => 'mengulang', 'label' => 'Mengulang', 'count' => 1]));
});

test('admin dashboard includes santri jenis distribution', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);

    Santri::factory()->count(2)->create(['jenis' => SantriJenis::Ikhwan]);
    Santri::factory()->count(3)->create(['jenis' => SantriJenis::Akhwat]);
    Santri::factory()->count(1)->create(['jenis' => null]);

    $this->actingAs($admin)->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('santriByJenis', [
                ['key' => 'akhwat', 'label' => 'Akhwat', 'count' => 3],
                ['key' => 'ikhwan', 'label' => 'Ikhwan', 'count' => 2],
            ]));
});

test('admin dashboard includes mutabaah count delta for this and last month', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);

    Mutabaah::factory()->count(2)->create(['tanggal' => now()->subMonth()]);
    Mutabaah::factory()->count(4)->create(['tanggal' => now()]);

    $this->actingAs($admin)->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('mutabaahsThisMonth', 4)
            ->where('mutabaahsLastMonth', 2));
});

test('admin dashboard includes santris created this month', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);

    Santri::factory()->count(3)->create();

    $this->actingAs($admin)->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('santrisThisMonth', 3));
});

test('ustadz dashboard includes only their mutabaah status distribution', function () {
    $user = User::factory()->create(['role' => UserRole::Ustadz]);
    $ustadz = Ustadz::factory()->create(['user_id' => $user->id]);

    Mutabaah::factory()->count(2)->create(['ustadz_id' => $ustadz->id, 'status' => MutabaahStatus::Lulus]);
    Mutabaah::factory()->count(1)->create(['ustadz_id' => $ustadz->id, 'status' => MutabaahStatus::Mengulang]);

    $other = Ustadz::factory()->create();
    Mutabaah::factory()->count(5)->create(['ustadz_id' => $other->id, 'status' => MutabaahStatus::Lulus]);

    $this->actingAs($user)->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('mutabaahByStatus', [
                ['key' => 'lulus', 'label' => 'Lulus', 'count' => 2],
                ['key' => 'mengulang', 'label' => 'Mengulang', 'count' => 1],
            ]));
});

test('santri dashboard includes only their mutabaah status distribution', function () {
    $user = User::factory()->create(['role' => UserRole::Santri]);
    $santri = Santri::factory()->create(['user_id' => $user->id]);

    Mutabaah::factory()->count(2)->create(['santri_id' => $santri->id, 'status' => MutabaahStatus::Lulus]);
    Mutabaah::factory()->count(1)->create(['santri_id' => $santri->id, 'status' => MutabaahStatus::PerluMurajaah]);

    $other = Santri::factory()->create();
    Mutabaah::factory()->count(4)->create(['santri_id' => $other->id, 'status' => MutabaahStatus::Lulus]);

    $this->actingAs($user)->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('mutabaahByStatus', [
                ['key' => 'lulus', 'label' => 'Lulus', 'count' => 2],
                ['key' => 'perlu_murajaah', 'label' => 'Perlu Murajaah', 'count' => 1],
            ]));
});

test('orang tua dashboard includes children progress status distribution', function () {
    $user = User::factory()->create(['role' => UserRole::OrangTua]);
    $orangTua = OrangTua::factory()->create(['user_id' => $user->id]);

    $berlangsung = Santri::factory()->create(['orang_tua_id' => $orangTua->id, 'nama' => 'Anak A']);
    TargetHafalan::factory()->create(['santri_id' => $berlangsung->id, 'status' => TargetHafalanStatus::Berlangsung]);
    $selesai = Santri::factory()->create(['orang_tua_id' => $orangTua->id, 'nama' => 'Anak B']);
    TargetHafalan::factory()->create(['santri_id' => $selesai->id, 'status' => TargetHafalanStatus::Selesai]);

    $this->actingAs($user)->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('childrenProgress', [
                ['key' => 'berlangsung', 'label' => 'Berlangsung', 'count' => 1],
                ['key' => 'selesai', 'label' => 'Selesai', 'count' => 1],
            ]));
});
