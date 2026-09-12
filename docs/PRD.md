# PRD — SIMAHAL

**SIMAHAL (Sistem Manajemen Halaqah Al-Qur'an)** adalah aplikasi web **multi-tenant** untuk membantu pondok pesantren mengelola halaqah, santri, ustadz, target hafalan, dan mutabaah hafalan Al-Qur'an secara terpusat. PondokIT menjadi salah satu tenant pertama, tetapi sistem dirancang untuk mendukung banyak pondok dengan isolasi data yang aman.

## 1. Tujuan

- Digitalisasi pencatatan mutabaah hafalan santri.
- Memudahkan ustadz mencatat dan memantau perkembangan hafalan.
- Memberikan santri akses untuk melihat progres dan target hafalannya.
- Memberikan orang tua akses untuk memantau perkembangan anak.
- Menyediakan data dan laporan untuk pengelola pondok.
- Mendukung banyak pondok dalam satu aplikasi dengan data yang terisolasi.
- Memungkinkan Super Admin mengelola tenant/pondok, domain, dan admin pondok.

## 2. Tech Stack

**Backend**
- Bun sebagai runtime, package manager, test runner, dan bundler.
- ElysiaJS sebagai framework backend.
- TypeScript.
- Drizzle ORM.
- PostgreSQL.
- Better Auth dengan organization/multi-tenant plugin, atau session-based auth yang tenant-aware.
- Eden Treaty untuk komunikasi type-safe antara backend dan frontend.
- Turborepo

**Frontend**
- SvelteKit.
- Svelte.
- TypeScript.
- Tailwind CSS.
- shadcn-svelte.
- Lucide Icons.
- Eden Treaty sebagai API client.

**Prinsip:**
- Gunakan Drizzle ORM, bukan Prisma.
- Jangan menambahkan framework frontend lain tanpa kebutuhan yang jelas.
- Inertia.js tidak lagi digunakan. Komunikasi frontend-backend menggunakan Elysia API + Eden Treaty.
- Semua akses data wajib melalui service/repository yang tenant-aware.

## 3. Multi-Tenancy

**Tenant = Pondok.**

Model tenancy:
- Shared database, shared schema.
- Setiap tabel operasional memiliki `tenant_id`.
- Isolasi data dilakukan di backend, bukan hanya di frontend.
- Setiap request wajib melewati proses resolusi tenant dan otorisasi membership.

**Resolusi tenant:**
- Subdomain: `pondokit.simahal.app`, `alhikmah.simahal.app`.
- Custom domain opsional.
- Fallback path `/p/:slug` untuk development.

**Request lifecycle:**
```text
Request
  ↓
Resolve tenant dari subdomain/domain/path
  ↓
Auth session
  ↓
Cek TenantMembership
  ↓
Set tenant context
  ↓
Authorize role
  ↓
Query otomatis difilter tenant_id
```

**Aturan isolasi:**
- Semua tabel operasional wajib memiliki `tenant_id`.
- Unique constraint harus composite, misalnya `(tenant_id, nis)`.
- User bersifat global.
- Role user ditentukan melalui `TenantMembership`.
- Super Admin bersifat global.
- Admin Pondok hanya bisa mengakses tenant-nya.
- PostgreSQL Row Level Security opsional untuk defense-in-depth.

## 4. Role Pengguna

### Super Admin
- Mengelola tenant/pondok.
- Mengelola domain/subdomain.
- Mengatur status aktif pondok.
- Membuat Admin Pondok.
- Tidak mengakses data operasional tenant kecuali untuk support.

### Admin Pondok
- Mengelola seluruh data di pondoknya.
- Mengelola user, santri, ustadz, orang tua, halaqah, target hafalan, dan mutabaah.
- Melihat laporan pondok.

### Ustadz
- Melihat halaqah yang diampu.
- Melihat santri.
- Mencatat mutabaah.
- Melihat riwayat dan progres hafalan.
- Memantau target hafalan.

### Santri
- Melihat halaqah.
- Melihat target hafalan.
- Melihat riwayat mutabaah.
- Melihat progres hafalan.

### Orang Tua
- Melihat anak yang terhubung.
- Melihat progres.
- Melihat target.
- Melihat riwayat mutabaah.

## 5. Core Data Model

```text
Tenant/Pondok
├── TenantMembership
├── Santri
├── Ustadz
├── OrangTua
├── Halaqah
├── TargetHafalan
└── Mutabaah

User
└── TenantMembership

Santri
├── OrangTuaSantri
├── HalaqahMember
├── TargetHafalan
└── Mutabaah

Halaqah
├── Ustadz
└── HalaqahMember

Mutabaah
└── Santri
```

### Entity utama

**Tenant / Pondok**
- id
- nama
- slug
- domain
- status
- settings

**User**
- id
- name
- email
- password
- is_super_admin
- created_at
- updated_at

**TenantMembership**
- id
- tenant_id
- user_id
- role: `admin_pondok`, `ustadz`, `santri`, `orang_tua`
- status
- joined_at

**Santri**
- id
- tenant_id
- user_id
- nis
- nama
- tanggal_lahir
- status

**OrangTua**
- id
- tenant_id
- user_id
- nama
- kontak

**Ustadz**
- id
- tenant_id
- user_id
- nama
- kontak

**OrangTuaSantri**
- id
- tenant_id
- orang_tua_id
- santri_id
- hubungan

**Halaqah**
- id
- tenant_id
- nama
- ustadz_id
- jadwal
- status

**HalaqahMember**
- id
- tenant_id
- halaqah_id
- santri_id
- joined_at
- status

**TargetHafalan**
- id
- tenant_id
- santri_id
- periode
- target
- progress
- status

**Mutabaah**
- id
- tenant_id
- santri_id
- ustadz_id
- tanggal
- jenis
- surah
- ayat_mulai
- ayat_selesai
- nilai
- status
- catatan

Jenis mutabaah:
- Setoran
- Murajaah

Status:
- Lulus
- Perlu Murajaah
- Mengulang

## 6. Core Flow

### Login

```text
Request ke subdomain pondok
  ↓
Resolve tenant
  ↓
Login / session
  ↓
Cek TenantMembership
  ↓
Jika Super Admin → Dashboard Super Admin
  ↓
Jika user multi-tenant → Pilih Pondok
  ↓
Dashboard sesuai role
```

### Super Admin membuat pondok

```text
Dashboard Super Admin
  ↓
Tambah Pondok
  ↓
Isi nama, slug, domain
  ↓
Simpan
  ↓
Buat Admin Pondok
  ↓
Pondok siap digunakan
```

### Ustadz mencatat mutabaah

```text
Dashboard
  ↓
Halaqah Saya
  ↓
Pilih Santri
  ↓
Input Mutabaah
  ↓
Jenis → Surah → Ayat
  ↓
Nilai + Status + Catatan
  ↓
Simpan
  ↓
Progress Santri diperbarui
```

### Santri melihat progres

```text
Dashboard
  ↓
Progress Hafalan
  ↓
Target
  ↓
Riwayat Mutabaah
```

### Orang tua memantau anak

```text
Dashboard
  ↓
Pilih Anak
  ↓
Progress Hafalan
  ↓
Target
  ↓
Riwayat Mutabaah
```

## 7. MVP Scope

1. Multi-tenant management.
2. Authentication & role per tenant.
3. Manajemen user & membership.
4. Manajemen santri.
5. Manajemen ustadz.
6. Manajemen orang tua.
7. Manajemen halaqah.
8. Pencatatan mutabaah.
9. Target hafalan.
10. Dashboard progres.
11. Riwayat mutabaah.
12. Parent monitoring.
13. Tenant onboarding & isolasi data.

Di luar MVP:
- AI.
- WhatsApp notification.
- Payment/billing.
- Gamification kompleks.
- Integrasi eksternal.
- Mobile native app.

## 8. UI Direction

SIMAHAL menggunakan **Modern Islamic Futurism**:
- Deep emerald sebagai warna utama.
- Warm ivory/off-white sebagai background.
- Charcoal untuk teks.
- Gold sebagai aksen.
- Minimal border dan shadow.
- Clean typography.
- Responsive.
- Mobile-first untuk workflow mutabaah ustadz.
- Tenant switcher untuk user yang tergabung di lebih dari satu pondok.
- Branding tenant minimal: nama pondok dan logo.

Gunakan **shadcn-svelte** sebagai fondasi komponen UI dan prioritaskan reusable components.

## 9. Prinsip Pengembangan

- Business logic di ElysiaJS.
- Data access menggunakan Drizzle ORM.
- UI menggunakan SvelteKit + Svelte.
- Komponen UI reusable.
- Role-based authorization wajib diterapkan di backend.
- Tenant isolation wajib diterapkan di backend.
- Validasi dilakukan di server dan frontend.
- Type safety end-to-end menggunakan Eden Treaty.
- Semua query operasional wajib difilter `tenant_id`.
- Jangan membuat fitur di luar PRD tanpa alasan yang jelas.
```