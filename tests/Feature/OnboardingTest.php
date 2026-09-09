<?php

use App\Enums\UserRole;
use App\Models\Muhafidz;
use App\Models\Santri;
use App\Models\TargetHafalan;
use App\Models\User;

test('onboarding tour component file exists with 4 steps and localStorage key', function () {
    $path = resource_path('js/components/onboarding-tour.tsx');
    expect(file_exists($path))->toBeTrue();

    $content = file_get_contents($path);
    expect($content)->toContain('onboarding_done');
    expect($content)->toContain('localStorage');
    expect($content)->toContain('checklist-bar');
    // 4 steps
    expect($content)->toContain('profile-halaqah');
    expect($content)->toContain('target');
    expect($content)->toContain('setoran');
    expect($content)->toContain('prestasi');
    expect($content)->toContain('Target 1');
    expect($content)->toContain('Senin');
    expect($content)->toContain('onboarding_done');
});

test('santri dashboard includes onboarding tour', function () {
    $content = file_get_contents(resource_path('js/pages/dashboard/santri.tsx'));
    expect($content)->toContain('onboarding-tour');
    expect($content)->toContain('OnboardingTour');
});

test('muhafidz dashboard includes onboarding tour', function () {
    $content = file_get_contents(resource_path('js/pages/dashboard/muhafidz.tsx'));
    expect($content)->toContain('onboarding-tour');
    expect($content)->toContain('OnboardingTour');
});

test('santri dashboard renders with onboarding props', function () {
    $user = User::factory()->create(['role' => UserRole::Santri]);
    $santri = Santri::factory()->create(['user_id' => $user->id]);
    TargetHafalan::factory()->create(['santri_id' => $santri->id, 'target' => 5, 'progress' => 10]);

    $this->actingAs($user)->get(route('dashboard'))->assertOk()->assertInertia(fn ($page) => $page->component('dashboard/santri'));
});

test('muhafidz dashboard renders with onboarding', function () {
    $user = User::factory()->create(['role' => UserRole::Muhafidz]);
    $muhafidz = Muhafidz::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)->get(route('dashboard'))->assertOk()->assertInertia(fn ($page) => $page->component('dashboard/muhafidz'));
});
