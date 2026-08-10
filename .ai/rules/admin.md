---
paths:
  - 'app/Http/Controllers/Admin/**'
---

# Admin

## Wrap linked User + profile create in a transaction
Admin controllers create a linked `User` row plus a profile row (Santri/Ustadz/OrangTua) atomically. The Phase 2 plan's code does this WITHOUT a DB::transaction, so a failure between the two `create()` calls leaves an orphan user. Wrap store/update/destroy in `DB::transaction()` (or a DB::transaction closure) when possible. The schema cascades handle deletes, so destroy is safe; the concern is create/update partial failures.
