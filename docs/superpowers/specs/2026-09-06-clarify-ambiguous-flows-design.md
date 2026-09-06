# Clarify Ambiguous Flows — Design

**Date:** 2026-09-06
**Status:** Approved (5/5 sections)
**Context:** SIMAHAL PondokIT — 4 roles (admin, muhafidz, santri, orang_tua), Inertia+React, 5-panel Setoran (harian pekan Senin-Ahad)

## 1. Principles & Naming

- Single term `muhafidz` everywhere. Rename `muhafidz` in `docs/`, `.ai/rules/`, `README`, comments. No DB rename (table `muhafidzs` already).
- Canonical units: `TargetHafalan.target` = Juz (1-30, `max:30`), `progress` = Halaman (0-600). `progressPercent = floor(progress / (target*20) *100)` using `MutabaahSetting.konversi_juz_halaman=20`. Display always `X/Y Juz · A/B hal` (e.g., `0.1/6 Juz · 2/120 hal`).
- Target ownership: both `santri` (own `santri_id`) and `muhafidz` (only santri in his `halaqahs`) can `create/update/delete`. No approval workflow; last-write wins with toast indicating actor.

## 2. Single Mutabaah Flow

- **Primary:** `muhafidz/setoran` 5-panel (7 daily halaman 0-20, Total Sepekan auto, Tasmi Pekan 0-100, Total Bulanan auto, Ujian 0-100). Only entry in sidebar `Halaqah Saya → Input Setoran`.
- **Legacy hidden:** `POST mutabaah` (surah/ayat/nilai) stays for backward compat but removed from sidebar/dashboard. Old rows remain readable in `muhafidz/mutabaahs/history` Harian tab (read-only).
- **Progress source:** `TargetHafalan.progress` derived solely from `SUM(mutabaahs.halaman WHERE jenis=setoran AND status=lulus)` via `RecalculateTargetProgress` (patched to halaman, `min(sum, target*20)`). `mutabaah_bulanans.halaman_kumulatif` not counted toward target — only for Rekap/Hadiah.

## 3. Pekan Strict Senin

- Rule: pekan N belongs to **month of its Monday**. Example 30 Sep (Mon) – 5 Oct (Sun) → `tasmi_pekan_5` stored with `bulan=9` (September). `totalBulanan` sums `mutabaahs` where `month(tanggal)=bulanSenin`.
- UI: pekan picker Prev/Next Monday, badge `⚠ Pekan nyebrang bulan — tercatat di September` when `weekEnd.month != weekStart.month`. Rekap filter uses Monday month.
- Implementation: `SetoranController@store` + `PekanHelper::pekanKe` already; ensure `updateOrCreate mutabaah_bulanans` uses Monday's `tahun/bulan`.

## 4. Prestasi & Share

- Pages: `santri/prestasi` (self) and `orang-tua/prestasi` (per child). Scoped server-side to own santri/children.
- Criteria: `keterangan = Berprestasi (Hadiah)` if `tambah_juz >= ambang_hadiah_juz (1.5)` via `MutabaahBulananCalculator`. Badge `★ Berprestasi` + `TOP #rank` (rank by `progressPercent` vs all santri).
- Share: `buildCanvas(1080×1350)` → `toBlob PNG` → `navigator.share({files})` fallback download `prestasi-NAMA.png`. Public image, no auth needed to view file. Removed `Tips Memotivasi` card per request.

## 5. Onboarding, Migration, Testing

- **Onboarding tour** (4 steps, `localStorage onboarding_done`): 1) Complete profile & halaqah assignment → 2) Create Target 1-30 Juz → 3) Input first Setoran week (Monday) → 4) View Prestasi & Share. Checklist bar on `dashboard/santri` and `dashboard/muhafidz`.
- **Migration:** existing `target>30` clamped to 30, `progress` juz→halaman (`*20`), `muhafidz`→`muhafidz` docs rename. Already applied via `migrate:fresh --seed` (Budi now `6 Juz/2 hal=1%` not `1140`).
- **Error handling:** validations `halaman 0-20`, `tasmi 10-100`, `ujian 0-100`, `target 1-30`, `unique santri_id+tanggal`. Cross-month pekan shows warning, not error.
- **Tests:** Feature: santri can create target, muhafidz can create target for his santri, pekan cross-month stored in Monday month, prestasi share scoped. Manual: verify `0/6 Juz` not `0/1140`.

## Out of Scope

- Multi-parent pivot (stay single `orang_tua_id`).
- Deleting legacy `mutabaahs` table.
- Changing DB schema for `target`/`progress` types.

## References

- `DashboardController`, `SetoranController`, `TargetHafalan`, `MutabaahBulananCalculator`, `app-sidebar.tsx`, `santri/prestasi.tsx`, `orang-tua/prestasi.tsx`
