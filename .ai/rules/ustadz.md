---
paths:
  - 'app/Http/Controllers/Ustadz/**'
---

# Ustadz

## Ustadz pages use santri_count alias
Ustadz feature uses the alias `->withCount('santris as santri_count')` so the Inertia prop is `santri_count` (admin pages use the bare `santris_count`; the ustadz test + page both key on `santri_count`). Keep this alias when adding santri counts to ustadz pages.
