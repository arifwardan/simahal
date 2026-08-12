---
paths:
  - 'app/Services/ExcelImport/**'
---

# Excel Import

## ImportExecutor atomicity + not final
ImportExecutor runs the whole plan in one DB::transaction and is intentionally NOT final (kept mockable so the feature test can mock it; Mockery cannot mock final classes). Per-item exceptions propagate out of the transaction (all-or-nothing rollback); the controller catches \Throwable and flashes an error toast. ImportResult::errors stays empty on the happy path. Do not re-add `final`, and do not re-introduce a per-row try/catch inside the transaction — that would commit partial writes.
