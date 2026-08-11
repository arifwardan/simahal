# Sidebar Emerald + Background Beraksen — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the app shell (sidebar, header, content background) and dashboard stat cards an emerald-colored, modern accent without changing the global shadcn palette or the welcome page.

**Architecture:** Change the CSS sidebar tokens (`--sidebar-*` in `app.css`) to a dark emerald theme with white/translucent accents — it works in light and dark modes with no component changes. Add decorative overlay layers (gradient glow in the sidebar, gradient + blur blobs behind the content, glassy header) purely via `className` on existing wrappers. Extend `StatCard` with optional `icon` + `tone` props mapped to Tailwind soft-color classes.

**Tech Stack:** React (Inertia.js v3), Tailwind CSS v4, shadcn/ui, lucide-react, Laravel 12 / PHP 8.5 backend (unchanged).

## Global Constraints

- Do NOT modify `resources/js/components/ui/sidebar.tsx` or any file under `resources/js/components/ui/` (shadcn components are off-limits).
- Do NOT change global tokens `--primary`, `--foreground`, `--background`, `--card`, `--muted`, `--border` etc. Only the `--sidebar-*` block changes.
- No changes to `welcome.tsx`, welcome styling, or `pint`/PHP files (zero backend changes).
- Every task must leave these green: `npx tsc --noEmit`, `npm run build`, `php artisan test --compact` (107 tests / 479 assertions).
- Indonesian copy is already present; do not rename any existing UI text.
- Commit after each task with a concise conventional message.
- If a frontend change doesn't appear in the browser, run `npm run build` (or use the running `npm run dev` server).
- Verify visually in both light and dark modes (browser) at the end of each styling task. Logged-in users navigate to `/dashboard`; page content uses `PageContainer` (already applied).

---

### Task 1: Emerald sidebar tokens in app.css

**Files:**
- Modify: `resources/css/app.css:64-133` (the `:root` and `.dark` `--sidebar-*` blocks)

**Interfaces:**
- Consumes: none (pure CSS token change).
- Produces: `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-primary-foreground`, `--sidebar-accent`, `--sidebar-accent-foreground`, `--sidebar-border`, `--sidebar-ring` set to dark emerald with white accents in BOTH `:root` and `.dark`. Later tasks rely on these tokens through the existing `bg-sidebar`, `text-sidebar-foreground`, `bg-sidebar-accent` utilities already used by `ui/sidebar.tsx`, `nav-main.tsx`, `nav-user.tsx`, and `app-logo.tsx`.

- [ ] **Step 1: Replace the `:root` sidebar tokens**

In `resources/css/app.css`, replace the `:root` block's sidebar lines (currently lines 90-97):

```css
    --sidebar: oklch(0.21 0.05 165);
    --sidebar-foreground: oklch(0.985 0 0);
    --sidebar-primary: oklch(0.985 0 0);
    --sidebar-primary-foreground: oklch(0.21 0.05 165);
    --sidebar-accent: oklch(1 0 0 / 0.1);
    --sidebar-accent-foreground: oklch(0.985 0 0);
    --sidebar-border: oklch(1 0 0 / 0.12);
    --sidebar-ring: oklch(1 0 0 / 0.3);
```

- [ ] **Step 2: Replace the `.dark` sidebar tokens**

In the `.dark` block (currently lines 125-132), replace with the SAME values as `:root` (sidebar stays dark emerald in dark mode too):

```css
    --sidebar: oklch(0.21 0.05 165);
    --sidebar-foreground: oklch(0.985 0 0);
    --sidebar-primary: oklch(0.985 0 0);
    --sidebar-primary-foreground: oklch(0.21 0.05 165);
    --sidebar-accent: oklch(1 0 0 / 0.1);
    --sidebar-accent-foreground: oklch(0.985 0 0);
    --sidebar-border: oklch(1 0 0 / 0.12);
    --sidebar-ring: oklch(1 0 0 / 0.3);
```

- [ ] **Step 3: Verify build + tests**

Run: `npx tsc --noEmit` — expected: clean.
Run: `npm run build` — expected: success.
Run: `php artisan test --compact` — expected: 107 passed / 479 assertions.
Run a dev server (`npm run dev` already running if logged out in browser; otherwise rebuild). Log in as `admin@simahal.test` / `password` and confirm the sidebar now renders dark emerald with white text in BOTH light and dark (toggle via the appearance settings page `/settings/appearance` or browser dark mode). The active nav item is a translucent white pill (from `--sidebar-accent`).

- [ ] **Step 4: Commit**

```bash
git add resources/css/app.css
git commit -m "style: emerald dark sidebar tokens in light and dark mode"
```

---

### Task 2: Gradient overlay inside AppSidebar

**Files:**
- Modify: `resources/js/components/app-sidebar.tsx:79` (the `<Sidebar ...>` opening tag and children)

**Interfaces:**
- Consumes: sidebar tokens from Task 1 (`--sidebar` base + white translucent accents).
- Produces: a decorative absolute overlay layered under the sidebar content. Content (logo, nav, footer) stays readable because it is rendered after the overlay (naturally above it in DOM order; both are static/absolute so no z-index needed unless the overlay visually covers it — the overlay only draws translucent glows).

- [ ] **Step 1: Add `relative overflow-hidden` to the Sidebar and an overlay div**

In `resources/js/components/app-sidebar.tsx`, change the `<Sidebar ...>` opening tag to add a `className`, then insert a decorative overlay as the first child (before `<SidebarHeader>`):

```tsx
<Sidebar collapsible="icon" variant="inset" className="relative overflow-hidden">
    <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 -right-12 size-60 rounded-full bg-emerald-500/25 blur-3xl" />
        <div className="absolute -bottom-16 -left-10 size-44 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-600/10 blur-3xl" />
    </div>

    <SidebarHeader>
        ...existing...
    </SidebarHeader>
    ...existing content and footer unchanged...
</Sidebar>
```

Keep `SidebarHeader`, `SidebarContent` (`<NavMain>`), and `SidebarFooter` (`<NavFooter>` + `<NavUser>`) exactly as they are now.

- [ ] **Step 2: Verify in browser**

`npm run dev` (already running) or `npm run build`. Log in and confirm: translucent emerald glows are visible inside the sidebar, the nav text/icons/logo remain fully readable, the collapsed icon state (`b` keyboard shortcut with Ctrl) still shows the glows nicely clipped, and the appearance still holds in dark mode.

- [ ] **Step 3: Commit**

```bash
git add resources/js/components/app-sidebar.tsx
git commit -m "style: emerald gradient glow overlay in sidebar"
```

---

### Task 3: Accent background + glassy header

**Files:**
- Modify: `resources/js/layouts/app/app-sidebar-layout.tsx:14-15` (the `<AppContent>` tag)
- Modify: `resources/js/components/app-sidebar-header.tsx:11` (header className)

**Interfaces:**
- Consumes: `PageContainer` is unchanged (already wraps page content inside `<AppContent>`), `SidebarInset` from `ui/sidebar.tsx`. The `AppContent` variant `"sidebar"` renders `SidebarInset` and accepts `className`.
- Produces: content area with a soft emerald-tinted gradient + blur blobs, and a frosted header. No consumer-facing API change.

- [ ] **Step 1: Give AppContent a gradient + decorative blobs**

In `resources/js/layouts/app/app-sidebar-layout.tsx`, change the `<AppContent>` element to:

```tsx
<AppContent
    variant="sidebar"
    className="relative overflow-hidden bg-gradient-to-br from-background via-background to-emerald-500/5 dark:to-emerald-500/10"
>
    <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 right-10 size-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute bottom-0 left-10 size-64 rounded-full bg-sky-400/10 blur-3xl" />
    </div>
    <div className="relative z-10">
        <AppSidebarHeader breadcrumbs={breadcrumbs} />
        {children}
    </div>
</AppContent>
```

Note: the wrapping `<div className="relative z-10">` keeps header + page content above the blobs. Do not touch `AppShell` or `AppSidebar`.

- [ ] **Step 2: Make the header glassy**

In `resources/js/components/app-sidebar-header.tsx`, on the `<header ...>` element (line 11), add the glassy classes after the existing ones:

```tsx
<header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 bg-background/70 px-6 backdrop-blur-md transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
```

Keep everything else in the file unchanged.

- [ ] **Step 3: Verify in browser**

Refresh: content background has a barely-visible emerald tint at bottom-right with two soft blur blobs, the header is frosted glass while scrolling, pages/cards/tables remain readable and above the blobs, and light/dark both look intentional (not washed out). Check `/dashboard` for each role: `admin`, `ustadz`, `santri`, `orang-tua` (passwords are `password`).

- [ ] **Step 4: Commit**

```bash
git add resources/js/layouts/app/app-sidebar-layout.tsx resources/js/components/app-sidebar-header.tsx
git commit -m "style: emerald-tinted content background and glassy header"
```

---

### Task 4: StatCard icon + tone props

**Files:**
- Modify: `resources/js/components/dashboard/stat-card.tsx` (entire file)

**Interfaces:**
- Consumes: nothing backwards — keeps the existing `label` and `value` props so current callers compile.
- Produces: `StatCard({ label: string; value: string | number; icon?: LucideIcon; tone?: Tone })` where `type Tone = 'emerald' | 'sky' | 'violet' | 'amber' | 'rose'`. Default `tone` = `'emerald'`; when `icon` is omitted, no icon box renders and `header` just shows label + value as before (value below). Later dashboard tasks pass `icon` + `tone`.

- [ ] **Step 1: Rewrite StatCard**

Replace the whole file `resources/js/components/dashboard/stat-card.tsx` with:

```tsx
import type { LucideIcon } from 'lucide-react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type Tone = 'emerald' | 'sky' | 'violet' | 'amber' | 'rose';

type StatCardProps = {
    label: string;
    value: string | number;
    icon?: LucideIcon;
    tone?: Tone;
};

const toneClasses: Record<Tone, string> = {
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    sky: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    violet: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    rose: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
};

export default function StatCard({ label, value, icon: Icon, tone = 'emerald' }: StatCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                {Icon && (
                    <span className={`flex size-9 items-center justify-center rounded-lg ${toneClasses[tone]}`}>
                        <Icon className="size-4.5" />
                    </span>
                )}
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-semibold">{value}</p>
            </CardContent>
        </Card>
    );
}
```

- [ ] **Step 2: Verify types + build + tests**

Run: `npx tsc --noEmit` — expected: clean (existing callers pass no `icon` so they still compile; `size-4.5` is a valid Tailwind v4 spacing utility).
Run: `npm run build` — expected: success.
Run: `php artisan test --compact` — expected: 107 passed.

- [ ] **Step 3: Commit**

```bash
git add resources/js/components/dashboard/stat-card.tsx
git commit -m "feat: add icon and tone to dashboard stat card"
```

---

### Task 5: Use colored stat cards on dashboards

**Files:**
- Modify: `resources/js/pages/dashboard/admin.tsx` (imports + the `StatCard` usages, lines 2 and 38-43)
- Modify: `resources/js/pages/dashboard/ustadz.tsx` (imports + `StatCard` usages, lines 2-4 and 42-45)

**Interfaces:**
- Consumes: `StatCard({ icon?: LucideIcon; tone?: Tone })` from Task 4. Icons below exist in `lucide-react` (no new dependency).
- Produces: the final visible dashboard coloring; no new props.

- [ ] **Step 1: Admin dashboard icons + tones**

In `resources/js/pages/dashboard/admin.tsx`:
- Add lucide icons to the existing import from `lucide-react` (`ClipboardCheck, FolderGit2, GraduationCap, HeartHandshake`). Since the file currently imports react/inertia components, add a new import line:
  ```tsx
  import { BookOpen, ClipboardCheck, FolderGit2, GraduationCap, HeartHandshake } from 'lucide-react';
  ```
- Update the grid (currently lines 38-43) to:
  ```tsx
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <StatCard label="Santri" value={counts.santris} icon={GraduationCap} tone="emerald" />
      <StatCard label="Ustadz" value={counts.ustadzs} icon={BookOpen} tone="sky" />
      <StatCard label="Orang Tua" value={counts.orangTuas} icon={HeartHandshake} tone="violet" />
      <StatCard label="Halaqah" value={counts.halaqahs} icon={FolderGit2} tone="amber" />
      <StatCard label="Mutabaah" value={counts.mutabaahs} icon={ClipboardCheck} tone="rose" />
  </div>
  ```

- [ ] **Step 2: Ustadz dashboard icons + tones**

In `resources/js/pages/dashboard/ustadz.tsx`:
- Add to imports:
  ```tsx
  import { ClipboardCheck, FolderGit2, GraduationCap } from 'lucide-react';
  ```
- Update the grid (currently lines 42-46) to:
  ```tsx
  <div className="grid gap-4 sm:grid-cols-3">
      <StatCard label="Halaqah" value={halaqahs.length} icon={FolderGit2} tone="emerald" />
      <StatCard label="Santri" value={totalSantri} icon={GraduationCap} tone="sky" />
      <StatCard label="Mutabaah" value={totalMutabaahs} icon={ClipboardCheck} tone="violet" />
  </div>
  ```

- [ ] **Step 3: Verify builds + browser**

Run: `npx tsc --noEmit`, `npm run build`, `php artisan test --compact` — all green.
In the browser (as admin and as ustadz) confirm each stat card shows a soft-colored icon box and the value below, readable in light & dark.

- [ ] **Step 4: Commit**

```bash
git add resources/js/pages/dashboard/admin.tsx resources/js/pages/dashboard/ustadz.tsx
git commit -m "feat: colored stat cards on admin and ustadz dashboards"
```

---

### Task 6: Emerald progress bar in santri progress view

**Files:**
- Modify: `resources/js/components/santri-progress-view.tsx:58` (progress fill `bg-primary`)

**Interfaces:**
- Consumes: nothing new. This component is shared by the santri and orang-tua dashboards.
- Produces: an emerald gradient progress fill replacing the neutral `bg-primary`.

- [ ] **Step 1: Change the progress fill**

In `resources/js/components/santri-progress-view.tsx`, change the fill div (line 58) from:

```tsx
className="h-full rounded-full bg-primary"
```

to:

```tsx
className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600"
```

Leave the track (`bg-muted`) and everything else unchanged.

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`, `npm run build`, `php artisan test --compact` — all green.
Browser: as `santri@simahal.test` and `ortu@simahal.test` (both `password`), the target-hafalan progress bar is an emerald gradient in light and dark.

- [ ] **Step 3: Commit**

```bash
git add resources/js/components/santri-progress-view.tsx
git commit -m "style: emerald gradient progress bar"
```

---

### Task 7: Final verification

**Files:** none.

- [ ] **Step 1: Full check**

Run: `npx tsc --noEmit` — clean.
Run: `npm run build` — success.
Run: `php artisan test --compact` — 107 passed / 479 assertions.
Check `git status` — only this feature's files changed (sidebar tokens, app-sidebar, app-sidebar-layout, app-sidebar-header, stat-card, admin/ustadz dashboards, santri-progress-view). `database/seeders/DatabaseSeeder.php` stays intentionally uncommitted (standing rule R4).

- [ ] **Step 2: Visual pass in light & dark**

As each role, navigate `/dashboard` and one admin management page:
- Sidebar is dark emerald with readable white text/icons; active item translucent white pill; glows subtle.
- Content background soft emerald tint + two blur blobs; pages/cards above the blobs; header frosted glass.
- Stat cards have colored icon boxes; progress bar emerald gradient.
- Toggle dark mode — everything remains intentional and readable.

- [ ] **Step 3: Commit final diff note only if needed**

If any fix arose during Step 2, apply it, re-run the three checks, then commit that fix with a `style:` message. Otherwise no commit needed (each task already committed).