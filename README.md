# SIMAHAL

> **Sistem Manajemen Halaqah Al-Qur'an**

SIMAHAL adalah aplikasi manajemen halaqah Al-Qur'an untuk membantu PondokIT mengelola aktivitas hafalan santri secara terstruktur, modern, dan terintegrasi.

SIMAHAL menghubungkan **Admin, Muhafidz/Musyrif, Santri, dan Orang Tua** dalam satu ekosistem sehingga proses pencatatan mutabaah, pemantauan hafalan, target, evaluasi, dan perkembangan santri dapat dilakukan secara digital.

---

## 1. Vision

SIMAHAL dibangun dengan visi:

> **Membangun ekosistem digital modern untuk membantu manusia menjaga, mengelola, dan meningkatkan perjalanan hafalan Al-Qur'an.**

SIMAHAL bukan sekadar aplikasi CRUD untuk mencatat setoran hafalan.

Sistem harus mampu menjadi pusat informasi perjalanan hafalan santri:

```text
Target
   ↓
Hafalan
   ↓
Mutabaah
   ↓
Evaluasi
   ↓
Progress
   ↓
Insight
```

Informasi tersebut kemudian dapat digunakan oleh:

* Muhafidz untuk membimbing santri.
* Santri untuk memahami perkembangan hafalannya.
* Orang tua untuk memantau perkembangan anak.
* Admin untuk mengelola ekosistem halaqah.

---

# 2. Product Philosophy

SIMAHAL memiliki tiga prinsip utama:

### Simple

Penggunaan aplikasi harus mudah dipahami bahkan oleh pengguna yang tidak terbiasa dengan aplikasi administrasi.

### Meaningful

Setiap data yang dicatat harus memiliki tujuan yang jelas terhadap proses pembinaan hafalan.

### Modern

SIMAHAL harus terasa seperti produk digital modern, bukan aplikasi administrasi sekolah generasi lama.

---

# 3. Design Direction

## Modern Islamic Futurism

Arah visual SIMAHAL adalah:

> **Modern + Futuristic + Calm + Islamic**

SIMAHAL harus terlihat modern dan memiliki teknologi yang kuat, tetapi tetap memiliki identitas sebagai aplikasi yang berhubungan dengan Al-Qur'an.

### Visual Keywords

```text
Modern
Minimal
Elegant
Futuristic
Calm
Premium
Islamic
Trustworthy
Human
Spiritual
Data-driven
```

### Hindari

Jangan menggunakan desain yang:

* Terlalu banyak ornamen Islam.
* Terlalu banyak pattern Arab.
* Menggunakan bulan sabit secara berlebihan.
* Menggunakan warna hijau secara berlebihan.
* Terlihat seperti website sekolah lama.
* Terlihat seperti template admin generik.
* Terlalu banyak gradient.
* Terlalu banyak glassmorphism.
* Menggunakan dekorasi yang tidak memiliki fungsi.

Identitas Islam harus terasa melalui **nuansa, typography, warna, whitespace, terminology, dan visual language**, bukan melalui ornamen berlebihan.

---

# 4. Visual Identity

SIMAHAL harus menggunakan visual identity yang bersih dan konsisten.

## Color Direction

Warna utama dapat menggunakan keluarga warna yang terinspirasi dari:

* Deep Emerald
* Islamic Green
* Dark Forest
* Warm Ivory
* Soft Sand
* Charcoal
* White

Namun warna hijau tidak boleh mendominasi seluruh interface.

Contoh konsep:

```text
Primary
Deep Emerald

Secondary
Warm Gold / Sand

Background
Soft Ivory / White

Foreground
Deep Charcoal

Accent
Emerald

Success
Natural Green

Warning
Warm Amber

Danger
Muted Red
```

Warna harus terasa:

> **calm, premium, trustworthy**

bukan seperti aplikasi edukasi anak.

---

# 5. Typography

Typography harus modern dan sangat readable.

Gunakan maksimal dua keluarga font.

### UI Font

Gunakan sans-serif modern untuk:

* Dashboard
* Navigation
* Table
* Form
* Button
* Data visualization

### Islamic / Quranic Typography

Font dengan karakter Arabic dapat digunakan secara terbatas untuk:

* Nama surah.
* Kutipan ayat.
* Detail Al-Qur'an.
* Elemen spiritual tertentu.

Arabic typography tidak boleh digunakan sebagai dekorasi berlebihan.

---

# 6. UI Principles

SIMAHAL harus mengikuti prinsip:

### Hierarchy

Informasi paling penting harus terlihat terlebih dahulu.

### Whitespace

Gunakan ruang kosong secara agresif untuk membuat interface terasa premium.

### Consistency

Komponen yang sama harus memiliki perilaku dan visual yang sama di seluruh aplikasi.

### Progressive Disclosure

Jangan menampilkan semua informasi sekaligus.

Informasi kompleks ditampilkan secara bertahap.

### Data First

Data hafalan harus mudah dibaca dan dipahami.

### Mobile Friendly

Muhafidz kemungkinan besar menggunakan smartphone ketika melakukan mutabaah.

Oleh karena itu workflow mutabaah harus nyaman digunakan pada mobile.

---

# 7. User Roles

SIMAHAL memiliki empat role utama.

```text
ADMIN
MUHAFIDZ
SANTRI
PARENT
```

Sistem harus mendukung kemungkinan satu user memiliki lebih dari satu role.

Contoh:

```text
User
├── MUHAFIDZ
└── PARENT
```

---

# 8. Admin

Admin bertanggung jawab terhadap konfigurasi dan operasional sistem.

### Admin dapat:

* Mengelola user.
* Mengelola santri.
* Mengelola muhafidz.
* Mengelola orang tua.
* Menghubungkan orang tua dengan santri.
* Membuat periode akademik.
* Membuat halaqah.
* Menentukan muhafidz halaqah.
* Menempatkan santri ke halaqah.
* Mengelola target.
* Melihat laporan.
* Mengelola konfigurasi sistem.

### Admin Dashboard

Dashboard harus memberikan overview:

```text
Total Santri
Total Muhafidz
Total Halaqah

Active Halaqah

Average Memorization Progress

Today's Memorization Activity

Students Needing Attention

Recent Activity
```

---

# 9. Muhafidz / Musyrif

Muhafidz adalah pengguna utama dalam workflow mutabaah.

### Muhafidz dapat:

* Melihat halaqah yang dibimbing.
* Melihat daftar santri.
* Melihat detail santri.
* Mencatat mutabaah.
* Mencatat ziyadah.
* Mencatat murajaah.
* Memberikan nilai.
* Memberikan status evaluasi.
* Memberikan catatan.
* Melihat target santri.
* Melihat progress santri.
* Melihat histori hafalan.

### Core Workflow

Workflow utama harus sangat cepat:

```text
Halaqah
   ↓
Santri
   ↓
Input Mutabaah
   ↓
Pilih Ziyadah / Murajaah
   ↓
Surah
   ↓
Ayat
   ↓
Nilai
   ↓
Status
   ↓
Catatan
   ↓
Simpan
```

Jumlah interaksi harus diminimalkan.

---

# 10. Santri

Santri berfokus pada perjalanan hafalannya sendiri.

### Santri dapat:

* Melihat dashboard pribadi.
* Melihat progress hafalan.
* Melihat target.
* Melihat histori mutabaah.
* Melihat nilai.
* Melihat evaluasi.
* Melihat catatan muhafidz.
* Melihat perkembangan target.

Dashboard santri harus menjawab:

```text
Saya sudah sampai mana?

Target saya apa?

Progress saya berapa?

Setoran terakhir saya bagaimana?

Apa yang harus saya perbaiki?
```

---

# 11. Parent

Orang tua memiliki akses read-only terhadap perkembangan anak, kecuali fitur tertentu yang nantinya ditentukan.

Parent dapat:

* Melihat anak.
* Melihat progress hafalan.
* Melihat target.
* Melihat setoran terbaru.
* Melihat nilai.
* Melihat evaluasi.
* Melihat catatan muhafidz.
* Melihat histori perkembangan.

Satu parent dapat memiliki lebih dari satu anak.

```text
Parent
├── Ahmad
├── Aisyah
└── Fatimah
```

Parent hanya boleh mengakses data anak yang terhubung dengan akunnya.

---

# 12. Core Modules

SIMAHAL terdiri dari beberapa domain utama.

```text
Identity
│
├── Users
├── Roles
└── Permissions

People
│
├── Students
├── Teachers
└── Parents

Academic
│
├── Academic Period
├── Halaqah
├── Halaqah Teacher
└── Halaqah Membership

Quran
│
├── Surah
└── Ayah

Memorization
│
├── Ziyadah
├── Murajaah
├── Evaluation
└── Progress

Target
│
└── Memorization Target

Communication
│
├── Notification
└── Announcement

Reporting
│
├── Student Report
├── Halaqah Report
└── Parent Report
```

---

# 13. Memorization

Mutabaah merupakan core domain SIMAHAL.

Jenis mutabaah:

```text
ZIYADAH
MURAJAAH
```

Setiap record mutabaah minimal memiliki:

```text
Student
Teacher
Halaqah
Date
Type
Surah
Start Ayah
End Ayah
Score
Status
Notes
```

Status:

```text
PASSED
REVISION
REPEAT
```

Contoh:

```text
Student:
Ahmad Fauzan

Type:
ZIYADAH

Surah:
Al-Baqarah

Ayah:
1 - 10

Score:
90

Status:
PASSED

Notes:
Hafalan lancar dengan sedikit kesalahan pada ayat 7.
```

---

# 14. Target

Target merupakan tujuan hafalan, bukan histori aktivitas.

```text
Target != Mutabaah
```

Target dapat digunakan untuk:

```text
Daily
Weekly
Monthly
Academic Period
```

Target harus dapat digunakan untuk menghitung progress.

Contoh:

```text
Target:
20 Juz

Achievement:
16 Juz

Progress:
80%
```

Unit target akan dikembangkan berdasarkan kebutuhan PondokIT.

---

# 15. Progress

Progress tidak boleh menjadi sumber data utama.

Progress harus dihitung berdasarkan data aktual.

```text
Mutabaah Records
       ↓
Aggregation
       ↓
Progress
```

Jangan menyimpan data seperti:

```text
student.progress = 82
```

sebagai sumber kebenaran jika nilai tersebut dapat dihitung dari data mutabaah.

---

# 16. Parent Notification

SIMAHAL dapat memberikan notifikasi kepada orang tua ketika terdapat aktivitas penting.

Contoh:

```text
Mutabaah berhasil dicatat.

Ahmad Fauzan
Al-Baqarah 1-10
Nilai 90
Status Lulus
```

Notifikasi dapat dikembangkan menjadi:

```text
Memorization Notification
Target Notification
Announcement
System Notification
```

---

# 17. Database Architecture

Database menggunakan:

```text
PostgreSQL
```

ORM:

```text
Laravel Eloquent
```

Database dikelola menggunakan:

```text
Laravel Migrations
Laravel Seeders
Laravel Factories
```

Core entities:

```text
users
roles
user_roles

students
teachers
parents
parent_students

academic_periods

halaqahs
halaqah_teachers
halaqah_memberships

surahs
ayahs

memorization_records
memorization_targets

notifications
```

---

# 18. Data Ownership

Data harus memiliki ownership yang jelas.

### Admin

Global access sesuai permission.

### Muhafidz

Hanya dapat mengelola data halaqah yang menjadi tanggung jawabnya.

### Santri

Hanya dapat melihat data dirinya sendiri.

### Parent

Hanya dapat melihat data anak yang terhubung melalui `parent_students`.

Authorization tidak boleh hanya bergantung pada frontend.

Semua akses sensitif harus divalidasi pada server.

---

# 19. Architecture

SIMAHAL menggunakan Laravel sebagai core application.

```text
Laravel
│
├── HTTP Layer
│   ├── Controllers
│   ├── Requests
│   └── Middleware
│
├── Domain / Business Logic
│
├── Models
│   └── Eloquent
│
├── Policies
│
├── Notifications
│
├── Jobs
│
└── Database
    └── PostgreSQL
```

Frontend:

```text
React
│
├── TypeScript
├── Inertia.js
└── Tailwind CSS
```

UI component system dapat menggunakan:

```text
shadcn/ui
```

atau sistem komponen headless/custom yang sesuai dengan design system SIMAHAL.

---

# 20. Frontend Philosophy

Frontend tidak boleh bergantung sepenuhnya pada template dashboard.

Template hanya digunakan sebagai foundation apabila diperlukan.

SIMAHAL harus memiliki:

```text
SIMAHAL Design System
```

yang mencakup:

```text
Colors
Typography
Spacing
Radius
Buttons
Inputs
Cards
Tables
Dialogs
Navigation
Charts
Status
Empty States
Loading States
Error States
```

Komponen harus reusable.

Hindari membuat komponen yang hanya digunakan satu kali jika pola tersebut dapat digunakan kembali.

---

# 21. Dashboard Philosophy

Dashboard bukan tempat untuk menampilkan semua data.

Dashboard harus memberikan:

```text
Overview
Insight
Action
```

Contoh:

```text
Overview
15 Santri

Insight
3 Santri mengalami penurunan progress

Action
Lihat Santri yang Membutuhkan Perhatian
```

Dashboard harus membantu user mengambil keputusan, bukan sekadar melihat angka.

---

# 22. Responsive Design

SIMAHAL harus responsive.

Prioritas:

```text
Desktop
Tablet
Mobile
```

Tetapi workflow tertentu harus mobile-first.

Terutama:

```text
Input Mutabaah
Melihat Santri
Melihat Setoran
```

Karena muhafidz dapat menggunakan SIMAHAL langsung ketika kegiatan halaqah berlangsung.

---

# 23. Accessibility

Interface harus memperhatikan:

* Keyboard navigation.
* Semantic HTML.
* Focus state.
* Color contrast.
* Form labels.
* Error messages.
* Screen reader compatibility.

Jangan menggunakan warna sebagai satu-satunya indikator status.

Contoh:

```text
✓ PASSED
↻ REVISION
! REPEAT
```

bukan hanya perbedaan warna.

---

# 24. AI Development Rules

AI coding agent yang mengerjakan SIMAHAL harus mengikuti aturan:

### Jangan langsung membuat kode sebelum memahami domain.

Urutan:

```text
Understand
   ↓
Plan
   ↓
Implement
   ↓
Test
   ↓
Review
```

### Jangan membuat tabel tanpa alasan domain.

Setiap model harus memiliki tujuan yang jelas.

### Jangan membuat duplicate source of truth.

Data transaksi harus menjadi sumber kebenaran.

### Jangan menaruh business logic kompleks di Controller.

Controller harus tetap tipis.

```text
Request
   ↓
Controller
   ↓
Action / Service
   ↓
Model
```

### Jangan mengandalkan frontend untuk authorization.

Authorization harus dilakukan server-side.

### Jangan melakukan premature optimization.

Prioritaskan:

```text
Correctness
Maintainability
Security
UX
Performance
```

---

# 25. Coding Standards

Gunakan:

```text
PSR-12
Laravel conventions
TypeScript strict mode
ESLint
Prettier
```

Gunakan penamaan yang eksplisit.

Contoh:

```text
MemorizationRecord
MemorizationTarget
HalaqahMembership
```

Hindari:

```text
Record
Target
Member
Data
Info
```

jika konteksnya ambigu.

---

# 26. Security

SIMAHAL menyimpan data santri sehingga security menjadi prioritas.

Wajib:

* Authentication.
* Authorization.
* Policy.
* Input validation.
* CSRF protection.
* Password hashing.
* Rate limiting.
* Secure session management.
* Server-side authorization.
* Auditability untuk aktivitas penting.

Data orang tua tidak boleh melihat data santri lain.

Data santri tidak boleh melihat data santri lain.

Muhafidz tidak boleh mengubah mutabaah dari halaqah yang bukan tanggung jawabnya kecuali memiliki permission khusus.

---

# 27. Development Phases

Development dilakukan bertahap.

## Phase 1 — Foundation

```text
Laravel
Starter Kit
React
Inertia
TypeScript
Tailwind
PostgreSQL
Eloquent
Authentication
```

## Phase 2 — Identity

```text
Users
Roles
Permissions
Students
Teachers
Parents
Parent relationships
```

## Phase 3 — Academic

```text
Academic Period
Halaqah
Halaqah Teachers
Halaqah Memberships
```

## Phase 4 — Quran

```text
Surahs
Ayahs
Quran data seeding
```

## Phase 5 — Mutabaah

```text
Ziyadah
Murajaah
Evaluation
Memorization History
```

## Phase 6 — Target & Progress

```text
Targets
Progress calculation
Student dashboard
```

## Phase 7 — Parent Portal

```text
Parent dashboard
Children
Progress
Recent memorization
Notifications
```

## Phase 8 — Reporting

```text
Student report
Halaqah report
Teacher report
Parent report
```

## Phase 9 — Enhancement

```text
Notifications
Analytics
Advanced dashboard
AI-assisted insights
```

---

# 28. Future AI Direction

AI bukan bagian dari core CRUD system.

AI akan menjadi intelligence layer di atas data SIMAHAL.

```text
SIMAHAL
   │
   ├── Students
   ├── Memorization
   ├── Targets
   └── Evaluations
          │
          ▼
      AI Layer
          │
    ┌─────┼─────┐
    │     │     │
 Insight Recommendation Prediction
```

Contoh future capability:

```text
"Ahmad mengalami penurunan konsistensi
setoran dalam 3 minggu terakhir."

"Target bulan ini kemungkinan tidak tercapai
jika pola saat ini berlanjut."

"Santri ini membutuhkan perhatian muhafidz."
```

AI hanya memberikan **insight dan rekomendasi**.

Keputusan pembinaan tetap berada pada muhafidz.

---

# 29. Non-Goals

SIMAHAL tidak bertujuan menjadi:

* Social media.
* Chat application.
* General school management system.
* Financial accounting system.
* LMS penuh.
* Quran reader utama.
* AI autonomous teacher.

Fokus utama:

> **Manajemen halaqah dan perjalanan hafalan Al-Qur'an santri.**

---

# 30. Definition of Done

Sebuah fitur dianggap selesai apabila:

```text
✓ Database migration selesai
✓ Model Eloquent selesai
✓ Relationship selesai
✓ Validation tersedia
✓ Authorization tersedia
✓ Backend logic selesai
✓ UI selesai
✓ Loading state tersedia
✓ Empty state tersedia
✓ Error state tersedia
✓ Responsive
✓ Tested
```

Jangan menganggap fitur selesai hanya karena happy path berhasil.

---

# 31. Guiding Principle

Setiap keputusan dalam SIMAHAL harus menjawab:

> **Apakah ini membantu muhafidz membimbing santri dengan lebih baik?**

Jika tidak, jangan menambah kompleksitas hanya karena teknologinya menarik.

SIMAHAL harus tetap:

```text
Simple enough to use.
Powerful enough to manage.
Beautiful enough to inspire.
```

---

# 32. Project Identity

**Product Name**

SIMAHAL

**Full Name**

Sistem Manajemen Halaqah Al-Qur'an

**Organization**

PondokIT

**Product Category**

Islamic Education / Halaqah Management

**Primary Users**

Admin, Muhafidz, Santri, Orang Tua

**Core Domain**

Halaqah + Mutabaah + Hafalan + Progress

**Design Language**

Modern Islamic Futurism

**Core Stack**

Laravel + React + Inertia + TypeScript + Tailwind CSS + PostgreSQL + Eloquent

---

## Final Product Direction

SIMAHAL harus terasa seperti:

> **sebuah platform digital modern yang lahir dari lingkungan pendidikan Al-Qur'an.**

Bukan aplikasi administrasi dengan ornamen Islami.

Bukan pula aplikasi teknologi yang kebetulan digunakan oleh pesantren.

Identitas Islam harus menjadi bagian dari **jiwa produk**, sementara teknologi menjadi **alat untuk membuat proses pembinaan lebih terstruktur, transparan, dan bermakna.**
