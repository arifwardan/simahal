---
paths:
  - 'resources/js/**'
---

# Js

## Don't pass `relative` via className to shadcn Sidebar
`<Sidebar className>` is merged with tailwind-merge in ui/sidebar.tsx; the base already uses `fixed inset-y-0 h-svh`. Passing `relative` overrides `fixed` and breaks the sidebar (falls into document flow below an h-svh gap div — must scroll to see it). Use `overflow-hidden` alone; `absolute` children anchor to the fixed container.

## Force npm when running shadcn CLI (pnpm-workspace.yaml trap)
The repo tracks pnpm-workspace.yaml at root but uses npm (package-lock.json). `npx shadcn add` auto-detects pnpm from pnpm-workspace.yaml and will try `pnpm add`, which destroys node_modules via `.ignored` moves and fails with EPERM on Windows. Before running shadcn CLI: temporarily `Move-Item pnpm-workspace.yaml <temp>` so it detects npm, run the command, then restore the file. Never overwrite the tracked pnpm-workspace.yaml.
