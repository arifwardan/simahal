---
paths:
  - 'resources/js/**'
---

# Js

## Don't pass `relative` via className to shadcn Sidebar
`<Sidebar className>` is merged with tailwind-merge in ui/sidebar.tsx; the base already uses `fixed inset-y-0 h-svh`. Passing `relative` overrides `fixed` and breaks the sidebar (falls into document flow below an h-svh gap div — must scroll to see it). Use `overflow-hidden` alone; `absolute` children anchor to the fixed container.
