---
paths:
  - 'app/Http/Controllers/**'
---

# Controllers

## Never mass-assign the role attribute via user input
users.role is fillable on the User model (Phase 1). Any controller that blind-fills validated input lets a user self-promote. The role may only change through an explicit, authorized path (admin CRUD with a dedicated RoleGuard policy/check). Validate role against App\Enums\UserRole and never rely on a generic user-update to carry it.
