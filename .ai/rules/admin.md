---
paths:
  - 'app/Http/Controllers/Admin/**'
---

# Admin

## Wrap linked User + profile create in a transaction
Admin controllers create a linked `User` row plus a profile row (Santri/Ustadz/OrangTua) atomically. The Phase 2 plan's code does this WITHOUT a DB::transaction, so a failure between the two `create()` calls leaves an orphan user. Wrap store/update/destroy in `DB::transaction()` (or a DB::transaction closure) when possible. The schema cascades handle deletes, so destroy is safe; the concern is create/update partial failures.

## Orang tua delete cascades santris but orphans user accounts
santris.orang_tua_id FK is cascadeOnDelete (Task 1 default). Deleting an orang tua with children cascade-deletes the santri rows but ORPHANS their linked user accounts (santris.user_id does not cascade user deletion). The admin delete test only covers orang tua without children. If orphaned users become a problem, add a nullOnDelete migration + delete orphaned santri users explicitly in OrangTuaController::destroy.
