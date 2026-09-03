# Task 3 Report — Model unique constraint + MutabaahBulanan fillable update

## Summary
Implemented unique constraint `santri_id + tanggal` on `mutabaahs` to make `updateOrCreate` safe for 7-day upsert. Verified `MutabaahBulanan` fillable/casts already correct.

## TDD Cycle
- **Red:** Created `tests/Feature/MutabaahUpsertTest.php` with 3 tests (upsert distinct, unique index exists, duplicate prevented). Ran `php artisan test --filter=MutabaahUpsertTest` — failed: 2 rows instead of 1, no unique index, no exception. Fixed NOT NULL error by adding `surah` fields to test payload.
- **Green:** Created `database/migrations/2026_09_03_000002_add_unique_santri_tanggal_to_mutabaahs.php` with dedup logic + `unique(['santri_id','tanggal'])`. Fixed test to use stored `tanggal` Carbon to handle date cast mismatch. Tests passed (3/3).
- **Refactor:** Ran full suite (171 tests) — found breakages from new constraint and legacy `ujian_soal_1..5` columns. Fixed `MutabaahBulananFactory`, `MutabaahBulananCalculator::rataUjian()`, `MutabaahFactory` random dates, `DemoDataSeeder` to use `whereDate` + update-or-create, and `DashboardTest`/`RecalculateTargetProgressTest` to use distinct dates. Full suite now 171/171 passed.

## Files
- Modified: `app/Models/MutabaahBulanan.php` — already contained `ujian_bulanan`, `catatan_tasmi`, `catatan_ujian` in fillable and `ujian_bulanan` cast (verified, no change needed).
- Modified: `app/Actions/MutabaahBulanan/MutabaahBulananCalculator.php` — `rataUjian()` now returns `ujian_bulanan` single value.
- Created: `database/migrations/2026_09_03_000002_add_unique_santri_tanggal_to_mutabaahs.php`
- Created: `tests/Feature/MutabaahUpsertTest.php`
- Modified: `database/factories/MutabaahFactory.php`, `MutabaahBulananFactory.php`, `database/seeders/DemoDataSeeder.php`, `tests/Feature/DashboardTest.php`, `tests/Unit/MutabaahBulananCalculatorTest.php`, `tests/Unit/RecalculateTargetProgressTest.php` (supporting fixes)

## Verification
- `php artisan test --filter=MutabaahUpsertTest --compact` → 3 passed
- `php artisan test --compact` → 171 passed, 0 failed
- `vendor/bin/pint --dirty` → passed

## Commit
`d7eaa8b` on `feat/input-setoran-halaqah`

## Branch/Worktree
`feat/input-setoran-halaqah`, worktree `C:/ai/playground/simahal`
