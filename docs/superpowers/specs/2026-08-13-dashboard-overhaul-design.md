# SIMAHAL — Dashboard Overhaul (Warna Brand Violet + Chart Distribusi)

**Tanggal:** 2026-08-13
**Status:** Approved (design)
**Basis:** permintaan pengguna untuk memperbagus tampilan dashboard — warna brand baru, chart untuk data (tidak hanya kartu statistik), hero greeting, struktur bagian yang rapi, dan penyempurnaan kartu statistik — tanpa backend tren (data tetap point-in-time).

---

## Ringkasan

Seluruh dashboard (admin, ustadz, santri, orang tua) dirombak tampilannya:

1. **Brand color baru: violet** — primary color seluruh app diubah dari hitam netral ke violet, konsisten light/dark.
2. **Chart distribusi** — data yang tadinya cuma angka/kartu ditampilkan sebagai donut chart berbasis agregasi kecil (bukan deret waktu).
3. **Layout lebih rapi** — hero greeting (sapaan + tanggal), section heading, dan kartu statistik dengan subtitle/delta.

Tidak ada backend tren/deret waktu; seluruh data tetap point-in-time.

---

## Bagian 1 — Tema & Warna Brand (Violet)

**Sasaran:** primary color seluruh app diubah ke **violet**; pola shadcn/ui tetap; dark mode tetap didukung.

Perubahan di `resources/css/app.css` (nilai oklch target, disetel halus saat implementasi):

- **Light:**
  - `--primary: oklch(0.541 0.245 293)` (violet pekat), `--primary-foreground: oklch(0.985 0 0)`.
  - `--ring` ikut primary agar fokus tombol/input violet.
  - Foreground di-tint halus ke arah violet (`oklch(0.125 0.03 293)`).
- **Dark:**
  - `--primary: oklch(0.686 0.246 293)` (violet lebih terang), `--primary-foreground: oklch(0.125 0.03 293)`.
- **Sidebar:** dari emerald-teal (`oklch(0.21 0.05 165)`) → **violet gelap** (`oklch(0.216 0.069 293)`), foreground putih, aktif di kedua mode.
- **`--chart-1..5`** (light & dark) disetel ulang ke palet harmonis keluarga violet:
  - chart-1 violet `oklch(0.541 0.245 293)`
  - chart-2 indigo `oklch(0.585 0.233 277)`
  - chart-3 fuchsia `oklch(0.647 0.267 307)`
  - chart-4 teal `oklch(0.69 0.17 165)` (aksen komplementer)
  - chart-5 amber `oklch(0.79 0.17 85)` (aksen hangat)
  - Dark: varian lebih terang dari hue yang sama.
- **Gradient dekoratif** `AppContent` (saat ini emerald/sky) → violet/indigo lembut.
- Tombol, link aktif, badge default mengikuti `--primary` secara otomatis.

**Dampak:** seluruh app (bukan hanya dashboard), sesuai pilihan "brand color baru".

---

## Bagian 2 — Data & Chart per Role

**Library chart:** tambah komponen shadcn `chart` (`npx shadcn@latest add chart`) → menginstal recharts + `components/ui/chart.tsx` (ChartContainer, ChartTooltip, ChartLegend) yang terintegrasi tema light/dark.

**Backend — payload agregasi (bukan tren)** di `app/Http/Controllers/DashboardController.php`:

Shape yang dikirim ke frontend: array `[{ key, label, count }]`. Warna di-map dari token `chart-1..5` di frontend.

| Dashboard | Chart | Sumber agregasi |
|---|---|---|
| Admin | Donut **status mutabaah** (lulus / perlu murajaah / mengulang) | `Mutabaah` groupBy `status` |
| Admin | Donut **jenis santri** (ikhwan / akhwat) | `Santri` groupBy `jenis`, `whereNotNull` |
| Ustadz | Donut **status mutabaah** (scoped halaqah) | `$ustadz->mutabaahs()` groupBy `status` |
| Santri | Donut **status mutabaah** milik santri | `$santri->mutabaahs()` groupBy `status` |
| Orang Tua | Donut **status progress anak** (berlangsung / selesai) | agregat `progressData()` per anak |

**Delta kecil kartu statistik** (tanpa time-series):
- Kartu Mutabaah (admin & ustadz): subtitle "X setoran bulan ini · ↑/↓ Y vs bulan lalu" — hitung `whereMonth`/`whereYear` bulan ini vs bulan lalu (dua count sederhana).
- Kartu Santri (admin): "X santri baru bulan ini" (count `created_at` bulan ini).

**Frontend chart components** di `resources/js/components/dashboard/charts/`:
- `mutabaah-status-donut.tsx` — donut status mutabaah, menerima `{ data }`.
- `santri-jenis-donut.tsx` — donut jenis santri.
- `children-progress-donut.tsx` — donut status progress anak (orang tua).
- Semua memakai primitives shadcn chart; reusable antar halaman.

---

## Bagian 3 — Komponen & Layout

**Komponen shared baru di `resources/js/components/dashboard/`:**

- **`DashboardHero`** — sapaan "Selamat datang, {nama}" + tanggal Indonesia (mis. "Kamis, 13 Agustus 2026") + subtitle per role:
  - admin: "Ringkasan data pesantren"
  - ustadz: "Ringkasan halaqah Anda"
  - santri: "Progres hafalan Anda"
  - orang tua: "Progres anak Anda"
- **`StatCard` di-upgrade** — tambah `subtitle`/`delta` opsional dan link opsional. Tone disetel ulang ke keluarga violet (violet, indigo, fuchsia, teal, amber) menggantikan tone lama (emerald/sky/violet/amber/rose).
- **`SectionHeading`** — judul + deskripsi konsisten untuk bagian per bagian.

**Struktur tiap dashboard:**

- **Admin:** Hero → grid 5 StatCard (dengan delta) → section "Mutabaah": grid chart (donut status mutabaah + donut jenis santri) → daftar Mutabaah Terbaru.
- **Ustadz:** Hero → grid 3 StatCard → section: donut status mutabaah + daftar Halaqah Saya (dengan tombol "Kelola Halaqah").
- **Santri:** Hero → progress hafalan (komponen `SantriProgressView` yang ada) + donut status mutabaah milik santri.
- **Orang Tua:** Hero → donut status progress anak → progress view per anak.

**Empty states:** bila chart tidak punya data, tampil pesan "Belum ada data" — bukan donut kosong.

---

## Bagian 4 — Error Handling

- Aggregasi adalah query count sederhana; tidak ada state baru yang bisa gagal di luar query yang sudah ada.
- Profil null-safe (`ustadz`/`santri`/`orang tua` belum terdaftar) tetap dijaga seperti sekarang (`progressData()` sudah null-safe).
- `jenis` santri nullable → donut jenis santri memakai `whereNotNull`; tidak error bila banyak santri belum berjenis.
- Chart tanpa data → empty state "Belum ada data".
- Tidak ada fetch async baru — semua data via props halaman, tidak ada skeleton/loading baru.

---

## Testing

- **Backend — perluas `tests/Feature/DashboardTest.php`** (sudah ada):
  - Admin: props `mutabaahByStatus` benar (lulus/perlu_murajaah/mengulang), `santriByJenis` (ikhwan/akhwat), delta bulan ini.
  - Ustadz: `mutabaahByStatus` scoped ke halaqahnya.
  - Santri: donut status mutabaah milik santri.
  - Orang tua: donut status progress anak.
  - Pakai `assertInertia` + factory; TDD (tulis test dulu).
- **Frontend:** `npx tsc --noEmit` bersih (recharts + shadcn chart tanpa error tipe).
- **Verifikasi akhir:** `php artisan test --compact`, `npx tsc --noEmit`, `vendor/bin/pint --dirty --format agent`.
- Route dashboard tidak berubah → tanpa `wayfinder:generate` (bila ada perubahan route tak sengaja: `php artisan wayfinder:generate --with-form`).

---

## Di Luar Scope

- Backend tren/deret waktu (chart tren per hari/bulan) — fase berikutnya bila diinginkan.
- Perubahan alur/fungsi di luar dashboard (mis. halaman CRUD admin, ustadz, santri).
- Logika `Mutabaah`, `TargetHafalan`, `MutabaahBulananCalculator` tidak diubah.
- Responsif mobile: hanya memastikan grid kartu/chart tetap rapi di layar kecil (pola `sm:`/`lg:` sudah ada).

---

## Kriteria Sukses

- Primary color dan sidebar seluruh app berwarna violet, konsisten light/dark, tanpa kontras bermasalah.
- Keempat dashboard menampilkan hero greeting, section heading, kartu statistik dengan delta, dan setidaknya satu chart donut distribusi.
- Chart menampilkan data nyata dari agregasi backend; empty state muncul saat tidak ada data.
- Seluruh test hijau; `tsc --noEmit` dan `pint` bersih.
