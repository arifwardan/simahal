# Product Requirements Document (PRD)

# SiMahal (Sistem Manajemen Halaqah)

Version : 1.0.0
Status : Draft
Author : Arif Wardan
Target : SaaS Multi-Tenant Platform

---

# 1. Overview

## Product Name

SiMahal (Sistem Manajemen Halaqah)

## Product Type

Software as a Service (SaaS)

## Target Platform

- Web Application
- Progressive Web App (Future)

## Target Users

- Pondok Pesantren
- Rumah Tahfizh
- TPQ
- Lembaga Pendidikan Al-Qur'an

---

# 2. Vision

Menjadi platform SaaS terbaik untuk digitalisasi manajemen halaqah Al-Qur'an yang membantu pesantren mengelola santri, guru, hafalan, presensi, dan laporan secara real-time, aman, dan mudah digunakan.

---

# 3. Problem Statement

Saat ini sebagian besar pesantren masih menggunakan buku mutaba'ah fisik.

Hal ini menyebabkan:

- Riwayat hafalan mudah hilang
- Sulit membuat laporan
- Orang tua tidak mengetahui perkembangan anak
- Guru melakukan pencatatan berulang
- Tidak ada dashboard perkembangan santri
- Sulit memonitor banyak halaqah

---

# 4. Goals

## Business Goals

- Membangun SaaS untuk banyak pesantren
- Mengurangi proses administrasi manual
- Mempermudah monitoring tahfizh
- Menjadi platform standar manajemen halaqah di Indonesia

---

## Product Goals

- Digital Mutaba'ah
- Dashboard Real-time
- Multi Tenant
- Mobile Friendly
- Mudah digunakan oleh Guru

---

# 5. Non Goals

Versi pertama TIDAK mencakup:

- Keuangan Pondok
- Inventaris Pondok
- Sistem Akademik Sekolah
- E-Learning
- CBT
- Perpustakaan

SiMahal fokus pada manajemen halaqah.

---

# 6. User Roles

## Admin

Mengelola seluruh sistem pesantren.

Hak akses:

- Kelola Guru
- Kelola Santri
- Kelola Orang Tua
- Kelola Halaqah
- Kelola Tahun Akademik
- Melihat seluruh laporan

---

## Guru

Mengelola halaqah.

Hak akses:

- Presensi
- Input Setoran
- Input Nilai
- Catatan Hafalan

---

## Orang Tua

Memantau perkembangan anak.

Hak akses:

- Dashboard
- Riwayat Hafalan
- Laporan
- Notifikasi

---

## Murid

Melihat perkembangan pribadi.

Hak akses:

- Progress Hafalan
- Riwayat Setoran
- Target Semester

---

# 7. SaaS Architecture

SiMahal menggunakan arsitektur Multi Tenant.

Setiap pesantren merupakan satu Tenant.

Contoh

alishlah.simahal.id

annur.simahal.id

alfalah.simahal.id

Setiap tenant memiliki:

- User
- Guru
- Murid
- Orang Tua
- Halaqah
- Data Hafalan

yang terisolasi sepenuhnya.

---

# 8. Core Modules

## Tenant Management

- Tenant
- Branding
- Subscription
- Status
- Domain

---

## Authentication

- Login
- Logout
- JWT
- Refresh Token
- Reset Password

---

## Authorization

Role Based Access Control (RBAC)

Role:

- Admin
- Guru
- Orang Tua
- Murid

---

## Academic

- Tahun Akademik
- Semester
- Level Tahfizh

---

## Halaqah

- Kelompok
- Jadwal
- Guru
- Target
- Lokasi

---

## Student

- Biodata
- Status
- Orang Tua
- Halaqah

---

## Teacher

- Biodata
- Halaqah
- Jadwal

---

## Attendance

- Presensi
- Rekap
- Statistik

---

## Mutaba'ah

Input:

- Ziyadah
- Murajaah

Data:

- Surah
- Ayat
- Juz
- Nilai
- Catatan

---

## Dashboard

Admin

- Total Santri
- Total Guru
- Total Halaqah
- Setoran Hari Ini
- Kehadiran

Guru

- Santri Hari Ini
- Presensi
- Setoran

Orang Tua

- Progress Anak
- Hafalan Terbaru

Murid

- Progress
- Target

---

## Reporting

- Rekap Hafalan
- Rekap Presensi
- PDF
- Excel

---

# 9. Future Modules

- WhatsApp Gateway
- Push Notification
- AI Recommendation
- Heatmap 30 Juz
- Gamification
- Achievement
- Offline Mode (PWA)

---

# 10. Functional Requirements

## Admin

- CRUD Guru
- CRUD Santri
- CRUD Orang Tua
- CRUD Halaqah
- Import Excel
- Export Excel

---

## Guru

- Presensi
- Setoran
- Catatan
- Nilai

---

## Orang Tua

- Monitoring
- Riwayat
- Download Laporan

---

## Murid

- Progress
- Target
- Riwayat

---

# 11. Non Functional Requirements

Performance

Dashboard < 2 detik

Availability

99.5%

Security

- JWT
- Bcrypt / Argon2
- HTTPS
- RBAC
- Tenant Isolation

Responsive

Desktop

Tablet

Mobile

---

# 12. Tech Stack

Frontend

- Next.js
- React 19
- TailwindCSS
- shadcn/ui
- TanStack Query

Backend

- NestJS
- Prisma
- PostgreSQL

Authentication

- JWT
- Refresh Token

Infrastructure

- Docker
- Turborepo
- pnpm Workspace

Deployment

Frontend

- Vercel

Backend

- VPS / Railway / Coolify

---

# 13. MVP

Sprint 1

- Monorepo
- Docker
- PostgreSQL
- Prisma
- Tenant Module

Sprint 2

- Authentication
- RBAC
- User Module

Sprint 3

- Teacher
- Student
- Parent

Sprint 4

- Halaqah
- Academic

Sprint 5

- Attendance
- Mutaba'ah

Sprint 6

- Dashboard
- Reporting

---

# 14. Success Metrics

- 80% Guru aktif setiap minggu
- 70% Orang Tua membuka dashboard minimal 1 kali per minggu
- Rekap laporan selesai dalam hitungan detik
- Mendukung minimal 100 Tenant
- Mendukung minimal 100.000 data santri

---

# 15. Future Roadmap

Phase 1

Digital Mutaba'ah

Phase 2

Dashboard & Reporting

Phase 3

WhatsApp Integration

Phase 4

Subscription & Billing

Phase 5

AI Assistant

Phase 6

PWA Offline
