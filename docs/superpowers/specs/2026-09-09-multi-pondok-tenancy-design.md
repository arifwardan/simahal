# Design Spec — Multi-Pondok: Satu DB + Registrasi Mandiri + Branding per Pondok

**Tanggal:** 2026-09-09
**Status:** Approved — siap implementation plan
**Opsi dipilih:** Opsi A (shared DB + `pondok_id` + global scope + registrasi mandiri dua jalur)
**Fitur:** Tiap pondok punya ruang sendiri (data terisolasi), registrasi pondok baru + gabung (approval admin), logo + nama yayasan di sidebar & login

---

## 1. Ringkasan & Scope

**Masalah:** Aplikasi single-tenant — semua data global, branding SIMAHAL hardcode. Pondok lain tidak bisa pakai tanpa mencampur data PondokIT.

**Solusi:** `pondoks` + `pondok_id` di semua tabel data + global scope otomatis; registrasi dua jalur (daftarkan pondok / gabung pondok + approval); logo + nama yayasan per pondok di sidebar & login.

**Di luar scope:** Subdomain per pondok (slug disiapkan untuk itu), superadmin pusat, hapus pondok, billing/langganan, custom domain.

---

## 2. Data Model & Migrasi (Opsi A)

### 2.1 Tabel baru `pondoks`
- `nama_yayasan VARCHAR`, `slug VARCHAR unique` (lowercase, alpha-dash; terkunci setelah dibuat), `logo_path VARCHAR nullable`, timestamps.

### 2.2 `pondok_id` di tabel tenant
- Tambah `pondok_id FK → pondoks ON DELETE RESTRICT` (tetap NULLABLE di DB untuk kompatibilitas SQLite-test/Postgres; non-null ditegakkan di aplikasi oleh trait: auto-fill dari auth, throw bila kosong di luar console/testing) ke: users, santris, muhafidzs, orang_tuas, halaqahs, mutabaahs, mutabaah_bulanans, target_hafalans, setoran_details, mutabaah_settings.
- `surahs` tetap GLOBAL (referensi bersama, tanpa pondok_id).

### 2.3 Trait `BelongsToPondok`
- Global scope: semua query otomatis `WHERE pondok_id = auth()->user()->pondok_id` (console/seeder: tanpa auth = tanpa scope, eksplisit).
- Auto-fill `pondok_id` saat create dari user auth.
- Dipakai semua model tenant di §2.2.

### 2.4 Backfill data lama
- Migrasi buat pondok "PondokIT" (slug `pondokit`) dan isi `pondok_id` semua baris existing ke sana. Nol data hilang.

---

## 3. Backend — Registrasi & Auth

### 3.1 Jalur 1: Daftarkan Pondok (pendaftar = admin)
**POST** `/register-pondok`: `nama_yayasan, slug (unique), nama admin, email (unique), password (+konfirmasi)`.
- Transaksi: buat `pondok` + `user` (role admin, `pondok_id`, status `active`) → auto-login → dashboard.

### 3.2 Jalur 2: Gabung Pondok (muhafidz/santri, approval)
**GET** `/register-gabung`: list pondok searchable (id, nama_yayasan, slug).
**POST** `/register-gabung`: `pondok_id exists, role (muhafidz|santri), nama, email, password` → akun status `pending`.
- Login akun `pending` ditolak dengan pesan "Akun menunggu persetujuan admin pondok."
- Admin pondok: daftar pengajuan di dashboard → setujui (`active`) / tolak (hapus atau `rejected`; MVP: hapus + info). Menyetujui muhafidz otomatis buat row `muhafidz`; santri otomatis buat row `santri`.

### 3.3 Login & otorisasi
- Login email + password tidak berubah; 1 akun = 1 pondok → langsung masuk ruangnya, tanpa pemilih pondok.
- Semua policy/ownership check existing dipertahankan, ditambah scope pondok via trait (lapis ganda).

---

## 4. Frontend — Branding & Halaman

- **Pengaturan Pondok** (admin): form nama yayasan + upload logo (max 2MB jpg/png, `storage/logos`, `php artisan storage:link` sudah/akan ada) + daftar persetujuan gabung + daftar user pondok.
- **Sidebar**: AppLogo statis → dinamis (logo pondok + nama yayasan; fallback ikon default bila tanpa logo).
- **Login**: kartu identitas pondok? TIDAK — login bersifat global (belum tahu pondok sebelum auth). Branding pondok tampil SETELAH login (sidebar + dashboard hero). Logo generik SIMAHAL tetap di halaman login/landing publik.
- Props Inertia: `pondok {nama_yayasan, slug, logo_url}` dishare global via middleware (seperti `auth`, `sidebarOpen`).

---

## 5. Validasi, Error & Edge

- Slug: `required, alpha_dash, unique:pondoks`, min 3; email unique global (satu akun satu pondok, cegah duplikat lintas pondok).
- Logo: `nullable, image, mimes:jpg,jpeg,png, max:2048`.
- Akun pending: middleware/gate tolak semua route auth kecuali logout.
- User tanpa `pondok_id` (tidak mungkin normal): abort 403 global.
- Hapus pondok: tidak didukung MVP (RESTRICT cegah yatim data).
- Data lama tanpa details/pondok tetap terbaca setelah backfill.

---

## 6. Testing

- **Feature (Pest):** register pondok → admin auto-login + pondok terisi; gabung → pending → login ditolak → approve → aktif; tolak → terhapus; isolasi A/B (list, detail by ID, POST silang → 403/404); logo upload + `logo_url` di props; backfill PondokIT (data lama dapat pondok_id); slug duplikat & email duplikat rejected.
- **Unit:** trait scope memfilter, auto-fill create.

---

## 7. File Terdampak

- Migration: `create_pondoks_table`, `add_pondok_id_to_*` + backfill PondokIT.
- Model: `Pondok`, trait `BelongsToPondok`, semua model tenant + `User` (status enum: active/pending).
- Controller: `RegisterPondokController`, `JoinPondokController`, `PondokSettingsController`, `ApprovalController` (atau gabung settings), penyesuaian user-management existing (scope + buat row peran saat approve).
- Middleware: share `pondok` props + tolak pending.
- Frontend: halaman register-pondok, gabung-pondok, pengaturan pondok (+ approval list), sidebar dinamis, (login tidak berubah).
- Seeder/factory: `pondok_id` di factory tenant; `DatabaseSeeder` buat PondokIT bila kosong.

---

## 8. Alternatif Dipertimbangkan (ditolak)

- Opsi B (package tenancy, DB terpisah) — isolasi maksimal tapi operasional berat, bertentangan pilihan satu DB.
- Opsi C (pondok_id hanya di users + branding) — cepat tapi data bocor antar pondok.
