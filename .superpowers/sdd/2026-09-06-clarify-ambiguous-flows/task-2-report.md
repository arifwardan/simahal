# Task 2 Report: Fix Target units & Recalculate

## Verification
- `app/Models/TargetHafalan.php:44-55` — `progressPercent()` uses `target*20` (halaman) via `floor(progress/(target*20)*100)` — verified correct.
- `app/Actions/Mutabaah/RecalculateTargetProgress.php:27-41` — sums `halaman` where `status=lulus` & `jenis=setoran`, fallback to ayat span if halaman null, capped `min(sum, target*20)` — verified correct.
- `database/factories/TargetHafalanFactory.php:23` — `target` `fake()->numberBetween(5,30)` — verified correct.
- `database/seeders/DatabaseSeeder.php:80-101` — creates target `6` Juz, progress `0`, calls `RecalculateTargetProgress::run()` with halaman `2` — verified correct.
- `database/seeders/DemoDataSeeder.php:144-168` — creates targets with `target=30` Juz, `progress` 40-520 halaman, capped check `>=600` — verified correct.
- `resources/js/components/santri-progress-view.tsx:52-53` — displays `{(progress.progress/20).toFixed(1)}/{target} Juz · {progress}/{target*20} hal · {percent}%` — verified correct.
- `app/Http/Requests/Muhafidz/StoreTargetHafalanRequest.php:19` & `UpdateTargetHafalanRequest.php:17` & `Santri/StoreTargetHafalanRequest.php:21` — `target` `max:30` — verified.

## Fixes Applied
- `tests/Unit/RecalculateTargetProgressTest.php`:
  - Fixed `progress sums ayat spans` to use `halaman` (7+8=15) and valid `target=10`.
  - Added `test_progress_percent_uses_halaman` — creates `TargetHafalan(target=6, progress=60)` expects `50%` (60/120).
  - Fixed `progress is capped at target` to cap at `target*20` (10*20=200) with halaman 150+100=250 capped to 200.
- `tests/Feature/Ustadz/TargetHafalanTest.php`:
  - Changed `target 100` → `6` in view test.
  - Changed `target 600` → `6` in store/create tests (was violating `max:30` validation).

## Test Results
- `php artisan test --compact tests/Unit/RecalculateTargetProgressTest.php tests/Feature/Ustadz/TargetHafalanTest.php` — 9 passed, 0 failed.
- Previously 2 failures in Recalculate tests (13 vs 15, 4 vs 10) now pass.
- Previously 2 errors in TargetHafalan feature tests (validation max:30) now pass.

## Commit
- Staged Task 2 files and committed as `fix: target units halaman & recalculate capped target*20`.
