# SIMAHAL Foundation — Design Spec (2026-09-12)

Sumber: `docs/PRD.md`. Scope: setup fondasi monorepo (opsi A).

## 1. Keputusan
- Rebuild penuh: hapus sisa struktur lama (NestJS + Next.js + Prisma + pnpm), scaffold ulang sesuai PRD.
- Package manager/runtime: Bun workspaces. Fallback Node hanya bila SvelteKit/Bun bermasalah (dicatat sebagai risiko).
- DB dev lokal: Docker PostgreSQL 16.
- Auth awal: skeleton tenant-aware (Better Auth organization/multi-tenant plugin bila feasible, else session-based tenant-aware). Implementasi penuh menyusul plan berikutnya.

## 2. Struktur monorepo
```text
simahal/
├── apps/
│   ├── api/            # Bun + ElysiaJS + Eden Treaty server
│   │   └── src/{index.ts, db.ts, plugins/{tenant.ts, auth.ts}, modules/*, common/*}
│   └── web/            # SvelteKit + Tailwind + shadcn-svelte + Lucide + Eden Treaty client
├── packages/
│   ├── db/             # Drizzle ORM: drizzle.config.ts, src/schema/*, src/client.ts, migrations/
│   ├── shared/         # tipe role/status/jenis, konstanta, helper tenant
│   └── config/         # tsconfig.base.json, tailwind preset (Modern Islamic Futurism)
├── docker-compose.yml  # postgres:16
├── turbo.json          # pipeline build/dev/lint/typecheck/db:*
├── package.json        # scripts root (bun)
├── .env.example        # DATABASE_URL, BETTER_AUTH_SECRET, PUBLIC_API_URL
└── docs/superpowers/specs/2026-09-12-simahal-foundation-design.md (file ini)
```

## 3. Schema Drizzle (packages/db)
Tabel: tenants, users, tenant_memberships, santri, ustadz, orang_tua, orang_tua_santri, halaqah, halaqah_members, target_hafalan, mutabaah.
Aturan:
- Semua tabel operasional punya `tenant_id` (FK tenants.id, index).
- Unique composite: `(tenant_id, slug)` tenants, `(tenant_id, nis)` santri, `(tenant_id, santri_id, periode)` target contohnya.
- users global; role via tenant_memberships (`admin_pondok`, `ustadz`, `santri`, `orang_tua`); `is_super_admin` global flag.
- Enum: role, tenant status, mutabaah jenis (setoran, murajaah), mutabaah status (lulus, perlu_murajaah, mengulang).

## 4. Backend (apps/api)
- `GET /health`, `GET /api/health` untuk cek.
- Plugin tenant: resolve dari subdomain / custom domain / fallback `/p/:slug` (header `x-tenant-slug` untuk dev) → set `store.tenant`.
- Plugin auth skeleton: session → cek membership → `store.membership`; guard `requireRole(...)`.
- Semua query operasional filter `tenant_id` dari context; dilarang query tanpa tenant kecuali tabel global/super-admin.
- Eden Treaty export `app` type untuk web.

## 5. Frontend (apps/web)
- SvelteKit, Tailwind, shadcn-svelte init, Lucide.
- Eden Treaty client menunjuk `PUBLIC_API_URL`.
- Halaman awal: `/` landing tenant-aware skeleton, `/p/[slug]` fallback, dashboard skeleton per role + tenant switcher placeholder.
- Tema: deep emerald primer, ivory background, charcoal teks, gold aksen; mobile-first.

## 6. Tooling
- `turbo.json` tasks: build (dependsOn ^build), dev (persistent), lint, typecheck, `db:generate`, `db:push`, `db:migrate`, `db:studio`.
- Root scripts Bun: `dev`, `build`, `db:push`, dsb. via `turbo run`.
- `.gitignore`: node_modules, .svelte-kit, dist, .turbo, .env, drizzle/*.snap, pgdata.

## 7. Verifikasi
1. `bun install`
2. `docker compose up -d` + cek postgres
3. `bun db:generate && bun db:push` (atau migrate)
4. `bunx turbo run build`
5. `bun dev` → api :3000 health OK, web :5173 render OK, Eden Treaty fetch OK.

## 8. Non-goals (setup ini)
- CRUD penuh, mutabaah flow, laporan, billing, WA, AI, mobile native, RLS postgres (opsional defense-in-depth, ditunda).

## 9. Risiko
- SvelteKit di Bun: verifikasi `bun --bun run` vs node; bila gagal, web jalan via node tapi tetap managed Bun workspaces.
- Better Auth + Elysia + multi-tenant: spike kecil sebelum implementasi penuh.
- File lama yang terhapus di working tree (status D) akan digantikan total; tidak ada migrasi kode lama.
