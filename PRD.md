# PRD — SIMAHAL

**SIMAHAL (Sistem Manajemen Halaqah Al-Qur'an)** adalah aplikasi web untuk membantu PondokIT mengelola halaqah, santri, ustadz, target hafalan, dan mutabaah hafalan Al-Qur'an secara terpusat.

## 1. Tujuan

- Digitalisasi pencatatan mutabaah hafalan santri.
- Memudahkan ustadz mencatat dan memantau perkembangan hafalan.
- Memberikan santri akses untuk melihat progres dan target hafalannya.
- Memberikan orang tua akses untuk memantau perkembangan anak.
- Menyediakan data dan laporan untuk pengelola PondokIT.

## 2. Tech Stack

**Backend**
- Laravel
- PHP
- Eloquent ORM
- Laravel Authentication / Starter Kit
- PostgreSQL

**Frontend**
- Inertia.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide Icons

**Prinsip:** gunakan Eloquent, bukan Prisma. Jangan menambahkan framework frontend lain tanpa kebutuhan yang jelas.

## 3. Role Pengguna

### Admin
Mengelola seluruh data: user, santri, ustadz, orang tua, halaqah, target hafalan, mutabaah, dan laporan.

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

## 4. Core Data Model

```text
User
├── Admin
├── Ustadz
├── Santri
└── Orang Tua

Halaqah
├── Ustadz
└── Santri

Santri
├── Orang Tua
├── Halaqah
├── Target Hafalan
└── Mutabaah

Mutabaah
└── Santri
```

### Entity utama

**User**
- id
- name
- email
- password
- role

**Santri**
- id
- user_id
- nis
- nama
- tanggal_lahir
- status

**OrangTua**
- id
- user_id
- nama
- kontak

**Ustadz**
- id
- user_id
- nama
- kontak

**Halaqah**
- id
- nama
- ustadz_id
- jadwal
- status

**HalaqahMember**
- id
- halaqah_id
- santri_id
- joined_at
- status

**TargetHafalan**
- id
- santri_id
- periode
- target
- progress
- status

**Mutabaah**
- id
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

## 5. Core Flow

### Login

```text
Login
  ↓
Identifikasi Role
  ↓
Dashboard sesuai Role
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

## 6. MVP Scope

1. Authentication & role
2. Manajemen user
3. Manajemen santri
4. Manajemen ustadz
5. Manajemen orang tua
6. Manajemen halaqah
7. Pencatatan mutabaah
8. Target hafalan
9. Dashboard progres
10. Riwayat mutabaah
11. Parent monitoring

Di luar MVP:
- AI
- WhatsApp notification
- Payment
- Gamification kompleks
- Integrasi eksternal
- Mobile native app

## 7. UI Direction

SIMAHAL menggunakan **Modern Islamic Futurism**:
- Deep emerald sebagai warna utama
- Warm ivory/off-white sebagai background
- Charcoal untuk teks
- Gold sebagai aksen
- Minimal border dan shadow
- Clean typography
- Responsive
- Mobile-first untuk workflow mutabaah ustadz

Gunakan **shadcn/ui** sebagai fondasi komponen UI dan prioritaskan reusable components.

## 8. Prinsip Pengembangan

- Business logic di Laravel.
- Data access menggunakan Eloquent.
- UI menggunakan React + Inertia.
- Komponen UI reusable.
- Role-based authorization wajib diterapkan di backend.
- Validasi dilakukan di server dan frontend.
- Jangan membuat fitur di luar PRD tanpa alasan yang jelas.
