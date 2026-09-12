# SIMAHAL Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold monorepo Turbo + Bun + Elysia API + SvelteKit web + Drizzle schema sesuai PRD.

**Architecture:** Bun workspaces (`apps/*`, `packages/*`), Turbo pipelines. API Elysia dengan plugin tenant-resolve skeleton. DB Drizzle di `packages/db`, dikonsumsi API via `db.ts`. Web SvelteKit konsumsi API via Eden Treaty.

**Tech Stack:** Bun 1.4.0, Turborepo (via bunx), ElysiaJS, SvelteKit 2 + Svelte 4/5, Drizzle ORM + postgres-js, PostgreSQL 16 (docker-compose), TypeScript strict, Tailwind.

**Spec:** `docs/superpowers/specs/2026-09-12-simahal-foundation-design.md`

## Global Constraints
- Semua tabel operasional wajib punya `tenant_id`.
- Unique constraint composite `(tenant_id, ...)`.
- Semua query operasional filter `tenant_id` dari tenant context.
- Drizzle ORM saja, bukan Prisma.
- Komunikasi web-api via Elysia + Eden Treaty.
- Bun sebagai runtime/package manager.
- Tidak ada fitur di luar PRD MVP fondasi ini.

---

### Task 1: Root monorepo scaffold

**Files:**
- Create: `package.json`
- Create: `turbo.json`
- Create: `bunfig.toml`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `docker-compose.yml`
- Create: `tsconfig.json`
- Create: `README.md` (modify/overwrite root readme bila ada)

**Interfaces:**
- Consumes: tidak ada.
- Produces: workspace `apps/*`, `packages/*`; scripts `dev`, `build`, `db:generate`, `db:push`.

- [ ] **Step 1: Tulis `package.json` root**

```json
{
  "name": "simahal",
  "private": true,
  "version": "0.0.1",
  "packageManager": "bun@1.4.0",
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "turbo run dev --parallel",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "db:generate": "turbo run db:generate",
    "db:push": "turbo run db:push",
    "db:migrate": "turbo run db:migrate",
    "db:studio": "turbo run db:studio"
  },
  "devDependencies": {
    "turbo": "^2.5.0",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 2: Tulis `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**", ".svelte-kit/**", "build/**"] },
    "dev": { "cache": false, "persistent": true },
    "lint": {},
    "typecheck": { "dependsOn": ["^build"] },
    "db:generate": { "cache": false },
    "db:push": { "cache": false },
    "db:migrate": { "cache": false },
    "db:studio": { "cache": false, "persistent": true }
  }
}
```

- [ ] **Step 3: Tulis file pendukung root**

`bunfig.toml`:
```toml
[install]
auto = "fallback"
```

`.gitignore`:
```gitignore
node_modules/
dist/
build/
.svelte-kit/
.turbo/
.env
.env.local
*.log
drizzle/*.snap
pgdata/
```

`.env.example`:
```env
DATABASE_URL=postgres://simahal:simahal@localhost:5432/simahal
BETTER_AUTH_SECRET=change-me-min-32-chars
PUBLIC_API_URL=http://localhost:3000
API_PORT=3000
```

`docker-compose.yml`:
```yaml
services:
  db:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_USER: simahal
      POSTGRES_PASSWORD: simahal
      POSTGRES_DB: simahal
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```

`tsconfig.json`:
```json
{ "extends": "./packages/config/tsconfig.base.json" }
```

- [ ] **Step 4: Commit**

```bash
git add package.json turbo.json bunfig.toml .gitignore .env.example docker-compose.yml tsconfig.json
git commit -m "chore: root monorepo scaffold (bun workspaces + turbo)"
```

### Task 2: packages/config + packages/shared

**Files:**
- Create: `packages/config/package.json`
- Create: `packages/config/tsconfig.base.json`
- Create: `packages/config/tailwind.preset.js`
- Create: `packages/shared/package.json`
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/src/tenant.ts`

**Interfaces:**
- Consumes: root tsconfig.
- Produces: `@simahal/config` (tsconfig path), `@simahal/shared` exports `ROLES`, `MUTABAAH_*`, `resolveTenantSlug()`.

- [ ] **Step 1: Tulis `packages/config/package.json`**

```json
{ "name": "@simahal/config", "version": "0.0.1", "private": true, "type": "module", "main": "./tailwind.preset.js" }
```

- [ ] **Step 2: Tulis `packages/config/tsconfig.base.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022", "module": "ESNext", "moduleResolution": "Bundler",
    "strict": true, "skipLibCheck": true, "esModuleInterop": true,
    "resolveJsonModule": true, "declaration": true, "sourceMap": true
  }
}
```

- [ ] **Step 3: Tulis `packages/config/tailwind.preset.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        emerald_deep: "#0B3D2E",
        ivory: "#FAF7F0",
        charcoal: "#1F2937",
        gold: "#C9A227"
      }
    }
  }
};
```

- [ ] **Step 4: Tulis `packages/shared`**

`packages/shared/package.json`:
```json
{
  "name": "@simahal/shared", "version": "0.0.1", "private": true, "type": "module",
  "main": "./src/index.ts", "types": "./src/index.ts"
}
```

`packages/shared/src/index.ts`:
```ts
export const ROLES = ["admin_pondok", "ustadz", "santri", "orang_tua"] as const;
export type Role = (typeof ROLES)[number];
export const MUTABAAH_JENIS = ["setoran", "murajaah"] as const;
export type MutabaahJenis = (typeof MUTABAAH_JENIS)[number];
export const MUTABAAH_STATUS = ["lulus", "perlu_murajaah", "mengulang"] as const;
export type MutabaahStatus = (typeof MUTABAAH_STATUS)[number];
export * from "./tenant.js";
```

`packages/shared/src/tenant.ts`:
```ts
export function resolveTenantSlug(input: { host?: string; path?: string; headerSlug?: string }): string | null {
  if (input.headerSlug) return input.headerSlug;
  if (input.path) {
    const m = input.path.match(/^\/p\/([a-z0-9-]+)/i);
    if (m) return m[1].toLowerCase();
  }
  if (input.host) {
    const sub = input.host.split(".")[0];
    if (sub && sub !== "www" && sub !== "simahal" && sub !== "localhost") return sub.toLowerCase();
  }
  return null;
}
```

- [ ] **Step 5: Commit**

```bash
git add packages/config packages/shared tsconfig.json
git commit -m "chore: add config and shared packages"
```

### Task 3: packages/db (Drizzle schema tenant-aware)

**Files:**
- Create: `packages/db/package.json`
- Create: `packages/db/drizzle.config.ts`
- Create: `packages/db/src/schema.ts`
- Create: `packages/db/src/client.ts`
- Create: `packages/db/src/index.ts`

**Interfaces:**
- Consumes: `@simahal/shared` types, `DATABASE_URL`.
- Produces: `db` (postgres-js + drizzle), `schema.*`, helper `tenantFilter(table, tenantId)` implisit via where clause.

- [ ] **Step 1: Tulis `packages/db/package.json`**

```json
{
  "name": "@simahal/db", "version": "0.0.1", "private": true, "type": "module",
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "drizzle-orm": "^0.36.0",
    "postgres": "^3.4.4"
  },
  "devDependencies": { "drizzle-kit": "^0.28.0" }
}
```

- [ ] **Step 2: Tulis `packages/db/drizzle.config.ts`**

```ts
import { defineConfig } from "drizzle-kit";
export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "postgres://simahal:simahal@localhost:5432/simahal" }
});
```

- [ ] **Step 3: Tulis schema lengkap (inti PRD §5)**

```ts
import { pgTable, text, uuid, timestamp, date, integer, jsonb, uniqueIndex } from "drizzle-orm/pg-core";

export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  nama: text("nama").notNull(),
  slug: text("slug").notNull().unique(),
  domain: text("domain"),
  status: text("status").notNull().default("active"),
  settings: jsonb("settings")
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  isSuperAdmin: text("is_super_admin").notNull().default("false"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const tenantMemberships = pgTable("tenant_memberships", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  role: text("role").notNull(),
  status: text("status").notNull().default("active"),
  joinedAt: timestamp("joined_at").defaultNow()
});

export const santri = pgTable("santri", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  userId: uuid("user_id").references(() => users.id),
  nis: text("nis").notNull(),
  nama: text("nama").notNull(),
  tanggalLahir: date("tanggal_lahir"),
  status: text("status").notNull().default("active")
}, (t) => [uniqueIndex("santri_tenant_nis").on(t.tenantId, t.nis)]);

export const ustadz = pgTable("ustadz", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  userId: uuid("user_id").references(() => users.id),
  nama: text("nama").notNull(),
  kontak: text("kontak")
});

export const orangTua = pgTable("orang_tua", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  userId: uuid("user_id").references(() => users.id),
  nama: text("nama").notNull(),
  kontak: text("kontak")
});

export const orangTuaSantri = pgTable("orang_tua_santri", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  orangTuaId: uuid("orang_tua_id").notNull().references(() => orangTua.id),
  santriId: uuid("santri_id").notNull().references(() => santri.id),
  hubungan: text("hubungan")
});

export const halaqah = pgTable("halaqah", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  nama: text("nama").notNull(),
  ustadzId: uuid("ustadz_id").references(() => ustadz.id),
  jadwal: text("jadwal"),
  status: text("status").notNull().default("active")
});

export const halaqahMembers = pgTable("halaqah_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  halaqahId: uuid("halaqah_id").notNull().references(() => halaqah.id),
  santriId: uuid("santri_id").notNull().references(() => santri.id),
  joinedAt: timestamp("joined_at").defaultNow(),
  status: text("status").notNull().default("active")
});

export const targetHafalan = pgTable("target_hafalan", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  santriId: uuid("santri_id").notNull().references(() => santri.id),
  periode: text("periode").notNull(),
  target: text("target").notNull(),
  progress: integer("progress").notNull().default(0),
  status: text("status").notNull().default("active")
});

export const mutabaah = pgTable("mutabaah", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  santriId: uuid("santri_id").notNull().references(() => santri.id),
  ustadzId: uuid("ustadz_id").references(() => ustadz.id),
  tanggal: date("tanggal").notNull(),
  jenis: text("jenis").notNull(),
  surah: text("surah").notNull(),
  ayatMulai: integer("ayat_mulai"),
  ayatSelesai: integer("ayat_selesai"),
  nilai: text("nilai"),
  status: text("status").notNull(),
  catatan: text("catatan")
});
```

- [ ] **Step 4: Tulis client + index**

`packages/db/src/client.ts`:
```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const url = process.env.DATABASE_URL ?? "postgres://simahal:simahal@localhost:5432/simahal";
const client = postgres(url);
export const db = drizzle(client, { schema });
```

`packages/db/src/index.ts`:
```ts
export * from "./schema.js";
export * from "./client.js";
```

- [ ] **Step 5: Commit**

```bash
git add packages/db
git commit -m "feat(db): drizzle schema tenant-aware simahal"
```

### Task 4: apps/api (Bun + Elysia + tenant plugin)

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/index.ts`
- Create: `apps/api/src/db.ts`
- Create: `apps/api/src/plugins/tenant.ts`
- Create: `apps/api/src/plugins/requireRole.ts`

**Interfaces:**
- Consumes: `@simahal/db` (`db`, `schema`), `@simahal/shared` (`resolveTenantSlug`).
- Produces: Elysia `app` (export type `App` untuk Eden Treaty), `GET /health`, `GET /api/health`, `GET /api/tenant`.

- [ ] **Step 1: Tulis `apps/api/package.json` + tsconfig**

```json
{
  "name": "@simahal/api", "version": "0.0.1", "private": true, "type": "module",
  "scripts": {
    "dev": "bun run src/index.ts",
    "build": "bun build src/index.ts --outdir dist --target bun",
    "lint": "bunx tsc --noEmit",
    "typecheck": "bunx tsc --noEmit"
  },
  "dependencies": {
    "@simahal/db": "workspace:*",
    "@simahal/shared": "workspace:*",
    "elysia": "^1.1.0"
  },
  "devDependencies": { "typescript": "^5.6.0" }
}
```

`apps/api/tsconfig.json`:
```json
{ "extends": "../../packages/config/tsconfig.base.json", "compilerOptions": { "outDir": "dist", "rootDir": "src", "types": ["bun"] }, "include": ["src"] }
```

- [ ] **Step 2: Tulis plugin tenant + guard**

`apps/api/src/plugins/tenant.ts`:
```ts
import { Elysia } from "elysia";
import { resolveTenantSlug } from "@simahal/shared";
import { db } from "@simahal/db";
import { tenants } from "@simahal/db";

export const tenantPlugin = new Elysia({ name: "tenant" })
  .derive(({ request }) => {
    const url = new URL(request.url);
    const slug = resolveTenantSlug({
      host: request.headers.get("host") ?? undefined,
      path: url.pathname,
      headerSlug: request.headers.get("x-tenant-slug") ?? undefined
    });
    return { tenantSlug: slug };
  })
  .resolve(async ({ tenantSlug, path }) => {
    if (path === "/health" || path === "/api/health") return {};
    if (!tenantSlug) return { tenant: null };
    const rows = await db.select().from(tenants).limit(1);
    const tenant = rows.find((t) => t.slug === tenantSlug) ?? null;
    return { tenant };
  });
```

`apps/api/src/plugins/requireRole.ts`:
```ts
export function requireRole(membershipRole: string | undefined, allowed: string[]) {
  if (!membershipRole || !allowed.includes(membershipRole)) {
    throw new Error("Forbidden: role tidak diizinkan");
  }
}
```

`apps/api/src/db.ts`:
```ts
export { db } from "@simahal/db";
```

- [ ] **Step 3: Tulis entry Elysia**

`apps/api/src/index.ts`:
```ts
import { Elysia } from "elysia";
import { tenantPlugin } from "./plugins/tenant.js";

export const app = new Elysia()
  .use(tenantPlugin)
  .get("/health", () => ({ ok: true }))
  .get("/api/health", () => ({ ok: true, service: "simahal-api" }))
  .get("/api/tenant", ({ tenant, tenantSlug }: any) => ({ slug: tenantSlug ?? null, tenant }))
  .listen(process.env.API_PORT ?? 3000);

export type App = typeof app;
```

- [ ] **Step 4: Commit**

```bash
git add apps/api
git commit -m "feat(api): elysia + tenant plugin skeleton + health"
```

### Task 5: apps/web (SvelteKit + Eden Treaty skeleton)

**Files:**
- Create via `bunx sv create` minimal ATAU tulis manual: `apps/web/package.json`, `apps/web/svelte.config.js`, `apps/web/vite.config.ts`, `apps/web/tsconfig.json`, `apps/web/src/routes/+page.svelte`, `apps/web/src/lib/api.ts`, `apps/web/src/app.css`, `apps/web/tailwind.config.js`
- Catatan: bila `sv create` interaktif gagal, gunakan file manual di bawah.

**Interfaces:**
- Consumes: `App` type dari `@simahal/api` via Eden Treaty (`elysia/client`), `PUBLIC_API_URL`.
- Produces: halaman `/` dan `/p/[slug]` yang fetch `/api/health` + `/api/tenant`.

- [ ] **Step 1: Scaffold manual minimal**

`apps/web/package.json`:
```json
{
  "name": "@simahal/web", "version": "0.0.1", "private": true, "type": "module",
  "scripts": {
    "dev": "vite dev --port 5173",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "svelte-check --tsconfig ./tsconfig.json",
    "typecheck": "svelte-check --tsconfig ./tsconfig.json"
  },
  "dependencies": { "elysia": "^1.1.0" },
  "devDependencies": {
    "@sveltejs/adapter-auto": "^3.0.0",
    "@sveltejs/kit": "^2.0.0",
    "@sveltejs/vite-plugin-svelte": "^3.0.0",
    "svelte": "^4.2.0",
    "svelte-check": "^4.0.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.6.0",
    "vite": "^5.0.0"
  }
}
```

`apps/web/src/lib/api.ts`:
```ts
import { treaty } from "@elysiajs/eden";
import type { App } from "@simahal/api";
const base = import.meta.env.PUBLIC_API_URL ?? "http://localhost:3000";
export const api = treaty<App>(base);
```

`apps/web/src/routes/+page.svelte`:
```svelte
<script lang="ts">
  import { api } from "$lib/api";
  let health: any = null;
  async function load() { health = await (await fetch("/api/health-proxy")).json().catch(() => null); }
</script>
<main class="min-h-screen bg-ivory text-charcoal">
  <h1 class="text-2xl font-bold text-emerald_deep">SIMAHAL</h1>
  <p>Sistem Manajemen Halaqah Al-Qur'an — skeleton multi-tenant.</p>
  <button on:click={load}>Cek API</button>
  <pre>{JSON.stringify(health, null, 2)}</pre>
</main>
```

- [ ] **Step 2: Commit**

```bash
git add apps/web
git commit -m "feat(web): sveltekit skeleton + eden treaty client"
```

### Task 6: Verifikasi akhir

**Files:** tidak ada file baru; hanya run commands.

- [ ] **Step 1: Install + generate + build**

```bash
bun install
bunx drizzle-kit check --config=packages/db/drizzle.config.ts
bunx turbo run build
```

Expected: install sukses, drizzle check tanpa error schema, build sukses (atau catat error SvelteKit/Bun bila ada).

- [ ] **Step 2: Smoke test API (tanpa docker bila docker tidak ada)**

```bash
bun run --filter @simahal/api dev
curl http://localhost:3000/health
curl -H "x-tenant-slug: pondokit" http://localhost:3000/api/tenant
```

Expected: `{ ok: true }`; tenant null bila DB belum jalan (acceptable untuk fondasi), tidak crash.

- [ ] **Step 3: Commit plan ini**

```bash
git add docs/superpowers/plans/2026-09-12-simahal-foundation.md
git commit -m "docs: simahal foundation implementation plan"
```
