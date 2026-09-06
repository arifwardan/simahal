# Clarify Ambiguous Flows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate 10 ambiguous flows (naming, units, dual mutabaah, pekan cross-month, onboarding) into single consistent UX with pekan strict Monday and shareable prestasi.

**Architecture:** Keep existing Laravel/Inertia stack. Patch `TargetHafalan` units (Juz target / Halaman progress), hide legacy mutabaah in favor of 5-panel Setoran, make pekan belong to Monday's month with UI warning, add onboarding tour via localStorage, scope prestasi share to owner.

**Tech Stack:** Laravel 13 PHP 8.5, Inertia v3 React 19 TS, Tailwind, SQLite, Pest

## Global Constraints

- Target `max:30` Juz, progress stored Halaman 0-600 (`target*20`), percent `floor(progress/(target*20)*100)` — verbatim from spec.
- Single term `muhafidz` only (remove `ustadz` from docs/rules/UI).
- Pekan N belongs to month of Monday, warning not error when crossing month.
- Both `santri` and `muhafidz` can CRUD target for their santri.

---

### Task 1: Rename ustadz → muhafidz in docs/rules

**Files:**
- Modify: `docs/superpowers/specs/*.md` (search `ustadz`)
- Modify: `.ai/rules/*.md`
- Modify: `README.md` (if contains ustadz)

**Interfaces:**
- Produces: no code, docs consistent

- [ ] Step 1: Grep for ustadz `grep -r ustadz docs/ .ai/ README.md`
- [ ] Step 2: Replace `ustadz` → `muhafidz` in docs, keep DB `muhafidzs` unchanged
- [ ] Step 3: Verify no `ustadz` remains `grep -r ustadz` empty
- [ ] Step 4: Commit `docs: rename ustadz to muhafidz`

### Task 2: Fix Target units & Recalculate

**Files:**
- Modify: `app/Models/TargetHafalan.php:44-51` (progressPercent)
- Modify: `app/Actions/Mutabaah/RecalculateTargetProgress.php:27-33`
- Modify: `database/factories/TargetHafalanFactory.php:23`
- Modify: `database/seeders/DatabaseSeeder.php:80` & `DemoDataSeeder.php:144`
- Modify: `resources/js/components/santri-progress-view.tsx:52`
- Test: `tests/Feature/TargetHafalanTest.php`

**Interfaces:**
- Consumes: `MutabaahSetting.konversi_juz_halaman=20`
- Produces: `TargetHafalan.progressPercent(): int` using `target*20`

- [ ] Step 1: Write failing test `test_progress_percent_uses_halaman` — create target 6/ progress 60 hal → expect 50% (60/120)
```php
$target = TargetHafalan::factory()->create(['target'=>6,'progress'=>60]);
expect($target->progressPercent())->toBe(50);
```
- [ ] Step 2: Run fails (currently 1000% because 60/6)
- [ ] Step 3: Implement `progressPercent` as `floor(progress/(target*20)*100)`
- [ ] Step 4: Update Recalculate to sum `halaman` where `status=lulus & jenis=setoran`, `min(sum, target*20)`
- [ ] Step 5: Update factory/seeder to use Juz target 1-30 and Halaman progress 0-600
- [ ] Step 6: Run test passes, commit

### Task 3: Single Mutabaah Flow (hide legacy)

**Files:**
- Modify: `resources/js/components/app-sidebar.tsx` (remove legacy mutabaah link if any)
- Modify: `resources/js/pages/dashboard/santri.tsx` (remove legacy add button)
- Test: `tests/Feature/MutabaahFlowTest.php` — ensure `POST /mutabaah` still works but not visible

- [ ] Step 1: Test legacy hidden `expect(page).not.toContain('Tambah Mutabaah')`
- [ ] Step 2: Ensure sidebar only shows `Halaqah Saya → Input Setoran`
- [ ] Step 3: Commit

### Task 4: Pekan Strict Monday + warning

**Files:**
- Modify: `app/Http/Controllers/Muhafidz/SetoranController.php` (store uses Monday month)
- Modify: `resources/js/pages/muhafidz/setoran/index.tsx` (badge warning)
- Test: `tests/Feature/SetoranPekanTest.php`

- [ ] Step 1: Write failing test: pekan Mon 30 Sep → `mutabaah_bulanans.bulan` should be 9 not 10
```php
$response = $this->post(route('muhafidz.setoran.store'), [... week 30 Sep ...]);
expect(MutabaahBulanan::first()->bulan)->toBe(9);
```
- [ ] Step 2: Run fails
- [ ] Step 3: Fix controller to use `Carbon::parse(monday)->month`
- [ ] Step 4: Add UI badge `weekEnd.month != weekStart.month` warning
- [ ] Step 5: Test passes, commit

### Task 5: Onboarding Tour

**Files:**
- Create: `resources/js/components/onboarding-tour.tsx`
- Modify: `resources/js/pages/dashboard/santri.tsx` & `muhafidz.tsx`
- Test: `tests/Feature/OnboardingTest.php` (localStorage flag)

- [ ] Step 1: Write test `expect(localStorage.getItem('onboarding_done'))` null initially
- [ ] Step 2: Implement tour 4 steps with checklist bar
- [ ] Step 3: Commit

### Task 6: Prestasi scope verification

**Files:**
- Modify: `app/Http/Controllers/Santri/PrestasiController.php` & `OrangTua/PrestasiController.php` (ensure scope)
- Test: `tests/Feature/PrestasiScopeTest.php` — orang tua cannot see other's child

- [ ] Step 1: Write failing test `other parent cannot view`
- [ ] Step 2: Verify aborts 403
- [ ] Step 3: Commit
