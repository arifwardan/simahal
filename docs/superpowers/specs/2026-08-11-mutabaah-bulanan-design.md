# SIMAHAL Phase 5 — Mutaba'ah Bulanan (Pengganti Excel Hafalan)

**Tanggal:** 2026-08-11
**Status:** Approved (design)
**Lampiran sumber:** `Mutabaah_Hafalan_Santri.xlsx` — workbook Mutaba'ah Hafalan Santri Pondok IT Indonesia 2026.

---

## Ringkasan

Menggantikan workbook Excel mutaba'ah hafalan santri dengan modul web dalam SIMAHAL: ustadz mengisi rekapitulasi bulanan per santri di halaqah-nya (halaman kumulatif, juz yang dihafal, nilai tasmi' pekan 1–5, nilai ujian bulanan soal 1–5), seluruh perhitungan turunan (tambah halaman/juz, kategori pencapaian, keterangan capaian, rata-rata) dihitung on-the-fly persis mengikuti rumus Excel, dan admin melihat dashboard ringkasan per kelompok + distribusi kategori. Modul ini hidup **berdampingan** dengan modul setoran harian (`Mutabaah`, `TargetHafalan`) yang sudah ada di Phase 3 — tidak mengubah logika progress ayat.

Aplikasi: Laravel 13, Inertia v3 + React 19 + TypeScript, shadcn/ui, Wayfinder, Pest.

---

## Konteks & Aturan Excel yang Direplikasi

Dari ekstraksi workbook:

- **Konfigurasi** (sheet Dashboard): `1 Juz = 20 halaman` (B2), `ambang hadiah = 1.5 juz` (D2), semua bisa diubah admin.
- **Per baris santri per bulan** (sheet Januari..Desember):
  - Input: `Jumlah Halaman (Kumulatif)` (G), `Juz yang Dihafal` (J), `Tasmi' Pekan 1..5` (M..Q, 10–100), `Ujian Bulanan Soal 1..5` (S..W, 10–100).
  - Turunan: `Halaman Awal Bulan` (F) = Jan: nilai "Halaman Awal Sebelum Program" (sheet Data Kelompok); Feb–Des: `G` bulan sebelumnya.
  - `Tambah Halaman` (H) = `G − F`.
  - `Tambah Juz` (I) = `H ÷ konversi_juz`.
  - `Kategori` (K) = VLOOKUP(`G ÷ konversi_juz`, tabel Referensi, kolom 2, TRUE) — bin terbesar ≤ total juz.
  - `Keterangan` (L):
    ```
    IF(G="","Belum Diisi",
       IF(I>=ambang_hadiah, "Berprestasi (Hadiah)",
          IF(I<0.25, "Di Bawah Target",
             "Sesuai Target")))
    ```
  - `Rata² Tasmi'` (R) = `AVERAGE(M:Q)`; `Nilai Ujian Bulanan` (X) = `AVERAGE(S:W)`; keduanya `null` bila seluruh input kosong.
- **Tabel Referensi** (sheet Referensi, 22 bin): `0, 0.25, 1/3, 0.5, 1, 1.5, 2, 2.5, … 9.5` → label "Belum Mencapai 1/4 Juz", "1/4 Juz", "1/3 Juz", dst.
- **Dashboard** (sheet Dashboard): dropdown "Pilih Bulan Analisis"; ringkasan per kelompok (jenis Ikhwan/Akhwat, kelompok, muhafidz, jumlah santri, rata² halaman kumulatif, rata² tambah juz, rata² tasmi', rata² ujian, jumlah santri berprestasi); distribusi jumlah santri per kategori juz (Ikhwan vs Akhwat).
- **Data master** (sheet Data Kelompok): 155 santri (96 Ikhwan, 60 Akhwat), kelompok, muhafidz/muhafidzah, halaman awal sebelum program.

---

## Keputusan Desain (dari brainstorming, disetujui user)

1. **Tujuan:** ganti Excel dengan aplikasi (input + kalkulasi + dashboard), bukan sekadar impor.
2. **Co-existence:** modul bulanan baru berdampingan dengan setoran harian; tidak mengubah `TargetHafalan`/`RecalculateTargetProgress`.
3. **Role & pemetaan:** ustadz (muhafidz) mengisi data bulanan santri di halaqah milik mereka (= kelompok); admin melihat dashboard global & mengelola konfigurasi. Kelompok Excel ≡ `Halaqah` SIMAHAL; muhafidz ≡ `Ustadz`.
4. **Penyimpanan:** simpan input mentah; semua nilai turunan dihitung on-the-fly (tidak ada snapshot), seperti rumus Excel yang live.
5. **Konfigurasi & periode:** `konversi_juz_halaman`, `ambang_hadiah_juz`, `tahun_aktif` tersimpan di DB dan editable admin; periode = tahun (2026, dst.) dengan 12 bulan per tahun.
6. **Data master:** memakai data `Santri`/`Halaqah` SIMAHAL yang sudah ada dari Phase 2; tambah field `santris.halaman_awal` (nullable) untuk nilai "Halaman Awal Sebelum Program".
7. **Dashboard:** lengkap mirip Excel — dropdown bulan/tahun, ringkasan per kelompok, distribusi kategori per jenis.
8. **UI konsistensi:** unifikasi ke palet shadcn dengan aksen emerald; komponen `PageContainer` untuk spacing kartu vs sidebar yang konsisten; `welcome.tsx` dialihkan ke token shadcn.

---

## Architecture

### Skema Data (migration)

**Tabel `mutabaah_bulanans`** — 1 baris per santri per (tahun, bulan):

| kolom | tipe | catatan |
|---|---|---|
| `id` | integer | PK |
| `santri_id` | FK | → `santris.id` |
| `tahun` | int | mis. 2026 |
| `bulan` | int | 1..12 |
| `halaman_awal_bulan` | int | Jan: `santris.halaman_awal`; Feb–Des: `halaman_kumulatif` bulan sebelumnya |
| `halaman_kumulatif` | int | input (G) |
| `juz_dihafal` | string\|null | input (J) |
| `tasmi_pekan_1..5` | int\|null | input (M..Q), nullable |
| `ujian_soal_1..5` | int\|null | input (S..W), nullable |
| `created_at` / `updated_at` | | |

- Unique index `(santri_id, tahun, bulan)` — upsert.
- `halaman_awal_bulan` dihitung saat simpan (di controller/action) — mewakili rumus F Excel.

**Tabel `mutabaah_settings`** — 1 baris config:

| kolom | tipe | default |
|---|---|---|
| `id` | integer | PK |
| `konversi_juz_halaman` | int | 20 |
| `ambang_hadiah_juz` | float | 1.5 |
| `tahun_aktif` | int | 2026 |
| `updated_at` | | |

**Tabel `santris`** — tambah kolom `halaman_awal` int nullable (editable admin, via admin CRUD santri), dipakai sebagai dasar bulan Januari.

### Model & Enums

- `MutabaahBulanan` — belongsTo `Santri`; kast `tahun`/`bulan` int, `halaman_awal_bulan`/`halaman_kumulatif` int, tasmi/ujian int nullable.
- `MutabaahSetting` — singleton (ambil/firstOrCreate).
- Enum `MutabaahKategori` (string-backed): value = batas bawah juz (float), label = nama kategori (22 bin mengikuti Referensi).

### Kalkulator — `app/Actions/MutabaahBulanan/MutabaahBulananCalculator`

Pure class; semua metode terima `MutabaahBulanan` (+ config sebagai argumen):

- `tambahHalaman(mb): int` = `halaman_kumulatif − halaman_awal_bulan`
- `tambahJuz(mb, konversi): float` = `tambahHalaman ÷ konversi` (round 2)
- `totalJuz(mb, konversi): float` = `halaman_kumulatif ÷ konversi`
- `kategori(mb, konversi): ?MutabaahKategori` — bin terbesar dengan `value <= totalJuz`; `null` bila record kosong (`halaman_kumulatif` null/kosong)
- `keterangan(mb, konversi, ambang): string` — rumus L Excel
- `rataTasmi(mb): ?float` — rata² `tasmi_pekan_1..5` terisi; semua kosong → `null`
- `rataUjian(mb): ?float` — sama untuk `ujian_soal_1..5`

Rasio juz kategori memakai `halaman_kumulatif ÷ konversi` (persis Excel `G/Dashboard!B$2`); tambah juz memakai `tambahHalaman ÷ konversi`.

### Routes

**Ustadz** (`routes/ustadz.php`, middleware `['auth','verified','role:ustadz']`):
- `GET  /ustadz/mutabaah-bulanan/{bulan}` → `Ustadz\MutabaahBulananController@edit`
- `POST /ustadz/mutabaah-bulanan/{bulan}` → `@update` (batch upsert)

Prop `edit`: `bulan`, `tahun` (dari setting tahun_aktif), `halaqahs` (milik ustadz + santri anggota dengan record bulanan/`halaman_awal_bulan`), `settings` ({konversi, ambang, tahun}), nilai terisi existing.

**Admin:**
- `GET /admin/mutabaah-bulanan` → `Admin\MutabaahBulananDashboardController@index` — dropdown bulan/tahun (default `tahun_aktif`, bulan terakhir terisi), ringkasan per kelompok + distribusi per jenis.
- `GET /admin/mutabaah-settings` → `Admin\MutabaahSettingController@edit`
- `PUT /admin/mutabaah-settings` → `@update`

### Controller concern

- Ustadz: resolusi `$request->user()->ustadz`; `abort_unless($ustadz !== null, 403)`; scoping santri via `$ustadz->halaqahs()->with('santris')` — `abort_unless` untuk santri bukan anggota halaqah ustadz.
- Admin: `role:admin` middleware.
- Authorization terapkan di backend (PRD §8).

### Frontend

- `resources/js/pages/ustadz/mutabaah-bulanan/edit.tsx` — tabel per santri (kolom halaman kumulatif, juz, tasmi 1–5, ujian 1–5), preview turunan (tambah halaman/juz, kategori, keterangan, rata²) yang live via kalkulator hasil render awal, submit batch (Form + wayfinder `.form()`), toast sukses.
- `resources/js/pages/admin/mutabaah-bulanan/index.tsx` — dropdown bulan+tahun, ringkasan per kelompok (jenis, kelompok, muhafidz, jumlah santri, rata² halaman, rata² tambah juz, rata² tasmi', rata² ujian, jumlah berprestasi), distribusi kategori per jenis (Ikhwan/Akhwat/total).
- `resources/js/pages/admin/mutabaah-settings.tsx` — form konfigurasi (konversi, ambang, tahun aktif).

Semua halaman memakai `page.layout = { breadcrumbs }`, Indonesian copy, komponen shadcn/ui.

### UI Konsistensi (bundled task)

1. **`PageContainer`** (`resources/js/components/page-container.tsx`) — wrapper `px-4 md:px-6 pb-8 pt-4` (atau setara) untuk semua halaman app; rapikan spacing kartu vs sidebar. Terapkan di halaman dashboard + admin/ustadz yang ada agar seragam.
2. **Welcome → shadcn** — ganti token custom `ivory/ink/sand/gold/emerald-soft/deep` di `welcome.tsx` dengan token shadcn (`background`, `foreground`, `primary`, `card`, `muted`, `accent`) + aksen emerald sebagai warna brand; pertahanakan light/dark.
3. **Verifikasi visual** — cek halaman dashboard & modul baru di mode light/dark, spacing kartu vs sidebar, dan keselarasan welcome.

> Catatan: aksen emerald sudah ada sebagai token `--color-emerald-deep`/`emerald`/`emerald-soft` di `app.css`; dipakai melalui varian shadcn agar konsisten.

---

## Data Flow

1. **Input (ustadz):** open edit → props (bulan, tahun, santri + existing record). Ustadz isi kolom per santri → submit batch → controller validasi → hitung `halaman_awal_bulan` (Jan: `santris.halaman_awal`; lain: record bulan sebelumnya, bila ada) → upsert tiap santri → toast.
2. **Baca (ustadz/konsumen):** kalkulator menghitung turunan on-the-fly.
3. **Dashboard (admin):** query agregat (avg halaman kumulatif, avg tambah juz via kalkulator per baris lalu rata², avg tasmi, avg ujian, berprestasi = `keterangan = Berprestasi (Hadiah)`) + distribusi kategori per jenis.

---

## Error Handling

- **FormRequest:** `halaman_kumulatif` `required|integer|min:0`; `halaman_kumulatif >= halaman_awal_bulan`; tasmi/ujian `nullable|integer|between:10,100`; `juz_dihafal` nullable string; bulan/tahun diperiksa.
- **403:** ustadz non-pemilik halaqah / santri di luar halaqah ustadz; role salah.
- **404:** config belum ada → 404 dengan pesan; record bulanan santri optional.
- **Kalkulator toleran:** field null → hasil null (bukan exception); tidak ada pembagian dengan nol (konversi divalidasi > 0).

---

## Testing

- **Unit `MutabaahBulananCalculatorTest`** — bandingkan dengan nilai Excel nyata: tambah halaman/juz (17 halaman), kategori (17→1/2 Juz; 40→2 Juz), keterangan (threshold 1.5 & 0.25, kosong→Belum Diisi), rata² tasmi/ujian, boundary bin kategori.
- **Unit enum `MutabaahKategori`** — lookup boundary.
- **Feature `UstadzMutabaahBulananTest`** — scoping halaqah (403 santri asing), validasi, batch upsert (tahun/bulan unik), `halaman_awal_bulan` Jan vs Feb.
- **Feature `AdminMutabaahBulananDashboardTest`** — ringkasan per kelompok (avg, jumlah berprestasi), distribusi per jenis, 403 non-admin.
- **Feature `AdminMutabaahSettingTest`** — update config; 403 non-admin.
- **Konvensi:** TDD (test dulu), `php artisan test --compact`, `types:check`, `vendor/bin/pint --dirty --format agent`, Wayfinder regenerate setelah route baru.

---

## Di Luar Scope (Fase Ini)

- Tidak mengubah `Mutabaah`/`TargetHafalan`/`RecalculateTargetProgress` (modul setoran harian tetap).
- Tidak mengimpor data Excel 155 santri secara masal — data master tetap dari admin CRUD SIMAHAL.
- Tidak ada fitur detail santri per-bulan dari sisi santri/orang tua (bisa fase berikutnya).
- Tidak mengganti tema global ke warna welcome untuk seluruh app (hanya unifikasi token + aksen).

---

## Kriteria Sukses

- Ustadz dapat mengisi/update rekapitulasi bulanan santri di halaqah-nya dengan semua perhitungan turunan benar (sesuai Excel).
- Admin melihat dashboard ringkasan + distribusi per bulan/tahun.
- Simpan & baca konsisten: mengubah input atau konfigurasi langsung mengubah turunan (no stale snapshot).
- Seluruh test hijau; UI konsisten (spacing, tema) di light & dark.