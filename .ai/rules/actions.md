---
paths:
  - 'resources/js/actions/**'
---

# Actions

## Always regenerate Wayfinder with --with-form
Run `php artisan wayfinder:generate --with-form`. Without --with-form it strips the `.form` helper from every gitignored `@/actions` file, which breaks `npx tsc --noEmit` repo-wide (vite.config.ts uses formVariants: true).
