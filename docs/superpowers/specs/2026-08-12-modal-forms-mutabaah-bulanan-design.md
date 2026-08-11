# SIMAHAL — Form Input via Modal + Mutaba'ah Bulanan Terintegrasi

**Tanggal:** 2026-08-12
**Status:** Approved (design)
**Basis:** desain `docs/superpowers/specs/2026-08-11-mutabaah-bulanan-design.md` (Phase 5), diperluas: semua form create/edit jadi modal, setoran harian memakai jumlah halaman, dan integrasi prefill otomatis harian↔bulanan.

---

## Ringkasan

1. **Konversi modal**: seluruh form create (dan form edit admin yang belum ada UI-nya) dirender dalam komponen `Dialog` (shadcn, sudah tersedia). Satu komponen form per entitas dipakai ulang untuk create (kosong) dan edit (nilai awal).
2. **Setoran harian memakai halaman**: tabel `mutabaahs` ditambah kolom `halaman` (int nullable) — jumlah halaman disetor per hari, sesuai prinsip Excel (bukan hitung ayat, karena panjang ayat antar-surah tidak seragam).
3. **Modul Mutaba'ah Bulanan (Phase 5) penuh**: input batch ustadz per bulan dalam modal (bukan halaman terpisah), dashboard admin + settings, kalkulator rumus Excel.
4. **Integrasi harian↔bulanan**: modal rekap bulanan menampilkan `halaman_kumulatif` **terisi otomatis** (prefill) dari Σ `halaman` setoran harian santri pada bulan itu, sehingga ustadz yang rutin setoran harian tidak perlu mengisi bulanan dari nol; yang lupa berhari-hari tetap bisa isi manual/rekap akhir bulan.

---

## Konteks & Aturan Excel yang Direplikasi

(Identik dengan desain Phase 5 — disalin ringkas)

- **Konfigurasi** (sheet Dashboard): `1 Juz = 20 halaman` (B2), `ambang hadiah = 1.5 juz` (D2), editable admin.
- **Per baris santri per bulan** (sheet Januari..Desember):
  - Input: `Jumlah Halaman (Kumulatif)` (G), `Juz yang Dihafal` (J), `Tasmi' Pekan 1..5` (M..Q, 10–100), `Ujian Bulanan Soal 1..5` (S..W, 10–100).
  - Turunan: `Halaman Awal Bulan` (F) = Jan: "Halaman Awal Sebelum Program" (`santris.halaman_awal`); Feb–Des: `G` bulan sebelumnya.
  - `Tambah Halaman` (H) = `G − F`.
  - `Tambah Juz` (I) = `H ÷ konversi_juz`.
  - `Kategori` (K) = VLOOKUP(`G ÷ konversi_juz`, tabel Referensi, kolom 2, TRUE) — bin terbesar ≤ total juz.
  - `Keterangan` (L) = `IF(G="","Belum Diisi", IF(I>=ambang_hadiah,"Berprestasi (Hadiah)", IF(I<0.25,"Di Bawah Target","Sesuai Target")))`.
  - `Rata² Tasmi'` (R) = `AVERAGE(M:Q)`; `Nilai Ujian Bulanan` (X) = `AVERAGE(S:W)`; keduanya `null` bila seluruh input kosong.
- **Tabel Referensi** (sheet Referensi, 22 bin): `0, 0.25, 1/3, 0.5, 1, 1.5, 2, 2.5, … 9.5`.
- **Dashboard** (sheet Dashboard): dropdown bulan/tahun; ringkasan per kelompok (jenis, kelompok, muhafidz, jumlah santri, rata² halaman kumulatif, rata² tambah juz, rata² tasmi', rata² ujian, jumlah berprestasi); distribusi per kategori (Ikhwan vs Akhwat).

---

## Keputusan Desain

1. **Semua form input → modal.** Halaman index tetap menampilkan tabel/daftar; tombol aksi membuka modal. Create & edit memakai komponen form yang sama (prop nilai awal opsional).
2. **Hapus halaman `ustadz/mutabaahs/create.tsx`** — diganti modal harian yang dibuka dari baris santri.
3. **Setoran harian mencatat `halaman`** (jumlah halaman), bukan menghitung dari `ayat_mulai`–`ayat_selesai`.
4. **Co-existence + fleksibilitas**: input harian rutin → rekap bulanan terbantu prefill; input bulanan akhir bulan → tanpa perlu setoran harian harian. `Mutabaah`/`TargetHafalan` yang ada tidak diubah logikanya.
5. **Prefill, bukan snapshot**: nilai turunan selalu dihitung live oleh kalkulator; rekap bulanan (`halaman_kumulatif`) adalah input ustadz yang tidak otomatis ditimpa oleh perubahan setoran harian berikutnya.
6. **Sisi admin**: dashboard + settings sebagai halaman biasa (bukan modal), sesuai desain Phase 5.

---

## Architecture

### Skema Data (migration)

**1. `mutabaahs` — tambah kolom `halaman`** (int nullable, after `ayat_selesai`). Wajib diisi pada setoran baru (validasi `required|integer|min:1`); data lama `null`.

**2. `mutabaah_bulanans`** (baru) — 1 baris per santri per (tahun, bulan):

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
- `halaman_awal_bulan` dihitung saat simpan (di action/controller) — mewakili rumus F Excel.

**3. `mutabaah_settings`** (baru) — 1 baris config:

| kolom | tipe | default |
|---|---|---|
| `id` | integer | PK |
| `konversi_juz_halaman` | int | 20 |
| `ambang_hadiah_juz` | float | 1.5 |
| `tahun_aktif` | int | 2026 |
| `updated_at` | | |

**4. `santris` — tambah kolom `halaman_awal`** int nullable (dasar bulan Januari; editable via form santri admin).

### Model & Enums

- `MutabaahBulanan` — belongsTo `Santri`; kast int untuk `tahun`/`bulan`/`halaman_*`; int nullable tasmi/ujian.
- `MutabaahSetting` — singleton (`firstOrCreate`).
- Enum `MutabaahKategori` (string-backed): value = batas bawah juz (float), label = nama kategori (22 bin mengikuti Referensi).

### Kalkulator — `app/Actions/MutabaahBulanan/MutabaahBulananCalculator`

Pure class; metode terima `MutabaahBulanan` (+ config):

- `tambahHalaman(mb): int` = `halaman_kumulatif − halaman_awal_bulan`
- `tambahJuz(mb, konversi): float` = `tambahHalaman ÷ konversi` (round 2)
- `totalJuz(mb, konversi): float` = `halaman_kumulatif ÷ konversi`
- `kategori(mb, konversi): ?MutabaahKategori` — bin terbesar dengan `value <= totalJuz`; `null` bila record kosong
- `keterangan(mb, konversi, ambang): string` — rumus L Excel
- `rataTasmi(mb): ?float`, `rataUjian(mb): ?float`

**Prefill (fungsi baru, `MutabaahBulananCalculator::prefillKumulatif(santri, bulan, tahun): ?int`):**
- `halaman_awal` = Jan: `santris.halaman_awal`; lain: `halaman_kumulatif` bulan sebelumnya (record `mutabaah_bulanans`), fallback `santris.halaman_awal`.
- `Σ halaman` = SUM `halaman` setoran harian (`mutabaahs`) santri pada `tahun-bulan` tsb.
- Return `halaman_awal + Σ halaman` bila `Σ halaman > 0`; `null` bila tidak ada setoran harian.

### Routes

**Ustadz** (`routes/ustadz.php`, middleware `['auth','verified','role:ustadz']`):

| method | path | controller@method | keterangan |
|---|---|---|---|
| GET | `halaqah-saya` | `HalaqahController@index` | (ada) |
| GET | `halaqah-saya/{halaqah}/santri` | `HalaqahController@santris` | (ada) |
| POST | `mutabaah` | `MutabaahController@store` | (ada; validasi + `halaman`) |
| ~~GET~~ | ~~`mutabaah/{santri}/baru`~~ | ~~`MutabaahController@create`~~ | **hapus** (modal) |
| GET | `mutabaah/riwayat` | `MutabaahHistoryController@index` | (ada) |
| POST | `target-hafalan` | `TargetHafalanController@store` | (ada) |
| PATCH | `target-hafalan/{targetHafalan}` | `TargetHafalanController@update` | (ada) |
| DELETE | `target-hafalan/{targetHafalan}` | `TargetHafalanController@destroy` | (ada) |
| **GET** | **`mutabaah-bulanan/{bulan}`** | **`Ustadz\MutabaahBulananController@edit`** | props: bulan, tahun, halaqahs+santri, settings, existing + prefill |
| **POST** | **`mutabaah-bulanan/{bulan}`** | **`@update`** | batch upsert |

**Admin** (`routes/admin.php`, middleware `['auth','verified','role:admin']`):

| method | path | controller@method |
|---|---|---|
| GET | `mutabaah-bulanan` | `Admin\MutabaahBulananDashboardController@index` |
| GET | `mutabaah-settings` | `Admin\MutabaahSettingController@edit` |
| PUT | `mutabaah-settings` | `@update` |

Route admin create/update santri tetap (form santri ditambah `halaman_awal`).

### Controller concern

- Ustadz: resolusi `$request->user()->ustadz`; `abort_unless($ustadz !== null, 403)`; scoping santri via `$ustadz->halaqahs()->with('santris')`; `abort_unless` untuk santri bukan anggota halaqah ustadz. Prefill dihitung per santri.
- Admin: `role:admin` middleware.
- Authorization terapkan di backend.

### Frontend

**Konversi modal — admin (5 halaman):** `admin/users`, `admin/santris`, `admin/ustadzs`, `admin/orang-tuas`, `admin/halaqahs`.
- Komponen `Dialog` (dari `@/components/ui/dialog`) membungkus form; blok inline `{showForm && ...}` dihapus.
- **Reuse form**: tiap entitas punya komponen form (`*Form.tsx`) dengan prop `nilaiAwal?`; edit via tombol baris → modal yang sama dengan `defaultValue` dari data; submit `PATCH /admin/{entity}/{id}` (`_method=PATCH`).
- Form santri bertambah field `halaman_awal` (int nullable).
- `onSuccess` → tutup modal; `errors` dari Inertia tampil via `InputError` di dalam modal.

**Modal harian (ustadz):** hapus `ustadz/mutabaahs/create.tsx`. Di `ustadz/halaqahs/santris.tsx`, tombol "Catat Mutabaah" per baris santri membuka `Dialog` berisi form harian (`halaman` field baru wajib). `santri_id` terisi dari baris.

**Modal targets (ustadz):** `ustadz/targets/index.tsx` — create + edit di dalam modal (reuse `TargetForm`).

**Modal bulanan (ustadz) — batch:** tombol "Rekap Bulanan" (di halaman halaqah santri) membuka `Dialog` lebar scrollable berisi tabel batch: tiap baris santri = kolom `halaman_kumulatif` (prefill), `juz_dihafal`, `tasmi_pekan_1..5`, `ujian_soal_1..5`. Satu submit → POST batch. Live preview turunan (tambah juz, kategori, keterangan) via nilai yang diketik, sesuai kalkulator.

**Admin modul bulanan:** `admin/mutabaah-bulanan/index.tsx` (dropdown bulan/tahun, ringkasan per kelompok, distribusi per jenis) dan `admin/mutabaah-settings.tsx` (form konfigurasi) — sebagai halaman, bukan modal.

Semua halaman memakai `page.layout = { breadcrumbs }`, Indonesian copy, shadcn/ui, `PageContainer` (sudah ada), aksen emerald (sudah diterapkan).

---

## Data Flow

1. **Setoran harian:** ustadz isi modal harian (termasuk `halaman`) → POST `mutabaahs.store` → riwayat & progress ayat tetap seperti sekarang (field `halaman` hanya data tambahan untuk bulanan).
2. **Rekap bulanan:** buka modal batch bulan → backend menghitung `halaman_awal_bulan` (Jan/Feb–Des) dan `prefill halaman_kumulatif` (dari Σ setoran harian bulan tsb) → ustadz lengkapi tasmi'/ujian (atau sesuaikan kumulatif) → submit batch upsert.
3. **Baca:** kalkulator menghitung turunan on-the-fly; dashboard admin mengagregasi.
4. **Konsistensi:** rekap yang sudah disimpan tidak otomatis ditimpa setoran harian berikutnya; prefill lain waktu memakai Σ terkini sebagai dasar.

---

## Error Handling

- **FormRequest mutabaah harian:** `tanggal` required date; `surah` required; `ayat_mulai`/`ayat_selesai` required integer; **`halaman` required integer min:1**; `nilai` nullable; `status` in:lulus/mengulang/dll.
- **FormRequest bulanan:** `halaman_kumulatif` required integer min:0; `halaman_kumulatif >= halaman_awal_bulan`; tasmi/ujian `nullable|integer|between:10,100`; `juz_dihafal` nullable string; `bulan` 1..12.
- **403:** ustadz non-pemilik halaqah / santri di luar halaqah; role salah.
- **404:** config belum ada → 404 dengan pesan; record bulanan santri optional.
- **Kalkulator toleran:** field null → hasil null (bukan exception); tidak ada pembagian dengan nol (konversi divalidasi > 0).

---

## Testing

- **Unit `MutabaahBulananCalculatorTest`** — bandingkan dengan nilai Excel nyata: tambah halaman/juz (17 halaman), kategori (17→1/2 Juz; 40→2 Juz), keterangan (threshold 1.5 & 0.25, kosong→Belum Diisi), rata² tasmi/ujian, boundary bin, **prefillKumulatif (dengan/ tanpa setoran harian, Jan vs Feb)**.
- **Unit `MutabaahKategoriTest`** — lookup boundary.
- **Feature `AdminSantriTest`** (extend) — field `halaman_awal` di create/update.
- **Feature `UstadzMutabaahTest`** (extend) — `halaman` wajib pada setoran harian.
- **Feature `UstadzMutabaahBulananTest`** — scoping halaqah (403 santri asing), validasi, batch upsert (unik santri/tahun/bulan), `halaman_awal_bulan` Jan vs Feb, prefill dari Σ setoran harian.
- **Feature `AdminMutabaahBulananDashboardTest`** — ringkasan per kelompok (avg, jumlah berprestasi), distribusi per jenis, 403 non-admin.
- **Feature `AdminMutabaahSettingTest`** — update config; 403 non-admin.
- Konversi modal = murni frontend: validasi via `types:check` + build + smoke test manual.

**Konvensi:** TDD (test dulu), `php artisan test --compact`, `npx tsc --noEmit` (`types:check`), `vendor/bin/pint --dirty --format agent`, Wayfinder regenerate setelah route berubah.

---

## Di Luar Scope

- Tidak mengimpor data Excel 155 santri secara masal.
- Tidak ada detail santri per-bulan dari sisi santri/orang tua.
- Tidak menambah konversi otomatis ayat→halaman (tetap input manual `halaman`).
- Tidak mengubah logika `Mutabaah`/`TargetHafalan`/`RecalculateTargetProgress` selain menambah field `halaman`.

---

## Kriteria Sukses

- Semua form create/edit (admin & ustadz) dirender sebagai modal; halaman `mutabaahs/create` dihapus.
- Setoran harian mencatat jumlah halaman; rekap bulanan ter-prefill dari Σ halaman setoran harian (jika ada), atau diisi manual.
- Input rutin harian → tidak perlu mengisi bulanan dari nol; input akhir bulan → tidak perlu setoran harian per hari.
- Dashboard admin + settings sesuai Phase 5; seluruh test hijau; UI konsisten light/dark.
