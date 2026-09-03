# Task 4 Report — FormRequest StoreSetoranRequest

## Summary
Implemented StoreSetoranRequest with authorize (muhafidz owns halaqah) and validation rules: halaqah_id/santri_id exists, santri belongsToHalaqah via closure, minggu date before_or_equal:today, harian.* 0..20, tasmi_pekan/ujian_bulanan 10..100, catatan_* max 1000.

## TDD Cycle
- **Red:** Created 	ests/Feature/StoreSetoranValidationTest.php with 7 tests (future minggu 422, halaman 30 422, tasmi 200 422, ujian 200 422, santri not in halaqah 422, not own halaqah 403, valid ok). Ran php artisan test --filter=StoreSetoranValidation — failed: Class StoreSetoranRequest does not exist (500).
- **Green:** Created pp/Http/Requests/Muhafidz/StoreSetoranRequest.php with uthorize() checking muhafidz ownership (returns true for missing/null halaqah to let required/exists rules produce 422) and ules() covering all required fields plus explicit harian.senin..ahad + harian.*. Tests passed (7/7).
- **Refactor:** endor/bin/pint --dirty passed.

## Files
- Created: pp/Http/Requests/Muhafidz/StoreSetoranRequest.php:1
- Created: 	ests/Feature/StoreSetoranValidationTest.php:1

## Verification
- php artisan test --filter=StoreSetoranValidation --compact ? 7 passed
- endor/bin/pint --dirty ? passed

## Commit
ecbb9a2 on eat/input-setoran-halaqah

## Branch/Worktree
eat/input-setoran-halaqah, worktree C:/ai/playground/simahal

