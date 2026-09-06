---
paths:
  - 'app/Http/Controllers/Muhafidz/**'
---

# Muhafidz

## Muhafidz pages use santri_count alias
Muhafidz feature uses the alias `->withCount('santris as santri_count')` so the Inertia prop is `santri_count` (admin pages use the bare `santris_count`; the muhafidz test + page both key on `santri_count`). Keep this alias when adding santri counts to muhafidz pages.
