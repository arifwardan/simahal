# SIMAHAL — Perbaikan Alur Muhafidz (Papan Catat Cepat + Rekap Bulanan per-Santri)

**Tanggal:** 2026-08-13
**Status:** Approved (design)
**Basis:** umpan balik pengguna bahwa alur aplikasi membingungkan dan belum bisa dipakai. Fokus pertama pada alur inti muhafidz (pencatatan mutabaah), lalu menyusul portal santri, onboarding, dan konsistensi data antar role.

---

## Ringkasan

Alur aplikasi dievaluasi dan ditemukan tiga sumber kebingungan utama:

1. **Alur Catat Mutabaah muhafidz** — bertele-tele dan tidak menunjukkan status setoran hari ini.
2. **Rekap Bulanan** — grid raksasa berisi semua santri sekaligus sulit dibaca dan diisi, terutama di mobile.
3. **Alur antar role belum nyambung** — santri & orang tua hanya punya dashboard tanpa menu navigasi; onboarding/petunjuk belum ada.

Pengerjaan dilakukan **bertahap per alur**. Fase pertama (dokumen ini) memperbaiki alur muhafidz, lalu berhenti agar bisa dipakai, kemudian fase berikutnya satu per satu.

---

## Roadmap Bertahap

| Fase | Isi | Status |
|---|---|---|
| **1 — Alur Muhafidz** | Papan catat cepat (setoran harian) + rekap bulanan per-santri | **Dokumen ini** |
| 2 — Portal Santri | Navigasi menu santri (Progres, Target, Riwayat) | Menyusul |
| 3 — Onboarding & Petunjuk | Empty state + panduan singkat tiap halaman | Menyusul |
| 4 — Konsistensi Data | Audit & perbaikan celah data antar role | Menyusul |

---

## Fase 1 — Alur Muhafidz

### 1. Papan Catat Cepat (Mutabaah Harian)

**Halaman `halaqah-saya/{halaqah}/santri` diubah menjadi papan setoran harian.**

Saat ini:
- Daftar santri + tombol "Catat Mutabaah" → dialog form (tanggal, jenis, surah, ayat mulai/selesai, halaman, nilai, status, catatan) → simpan → dialog tertutup.

Menjadi:
- Tiap baris santri menampilkan status setoran **hari ini**:
  - Belum ada mutabaah hari ini → tombol **"Catat"** + label "Belum dicatat".
  - Sudah ada mutabaah hari ini → badge **"Sudah dicatat ✓"** (dengan data ringkas setoran terakhir hari ini).
- Klik "Catat" → dialog ringkas: **tanggal di-prefill ke hari ini** (tetap bisa diganti); field yang diisi — jenis, surah, ayat mulai–selesai, halaman, nilai (opsional), status, catatan (opsional).
- Setelah simpan → dialog tertutup, baris santri berubah jadi "Sudah dicatat ✓", dan **fokus/highlight pindah ke santri berikutnya** yang belum dicatat — muhafidz tinggal lanjut klik "Catat" tanpa kebingungan.
- Tombol "Rekap Bulanan" tetap ada di header.

**Backend:**
- `HalaqahController@santris` menambah field `mutabaah_hari_ini` per santri: mutabaah terakhir dengan `tanggal` = hari ini (atau `null`).
- Setelah POST `mutabaahs.store` sukses, halaman di-reload data (sudah ada `back()` + flash) sehingga status hari ini ter-update.

**Kriteria status "sudah dicatat hari ini":** ada satu atau lebih `Mutabaah` dengan `tanggal` = hari ini untuk santri tersebut. Ditampilkan sebagai satu baris "Sudah dicatat ✓".

### 2. Rekap Bulanan per-Santri

**Mengganti grid batch besar dengan alur dua langkah (pilih santri → form per-santri).**

Saat ini:
- Klik "Rekap Bulanan" → satu dialog grid berisi semua santri sekaligus (kolom halaman awal, halaman kumulatif, juz dihafal, tasmi pekan 1–5, ujian soal 1–5, preview) → isi semuanya → simpan batch.

Menjadi:
1. Klik "Rekap Bulanan" → dialog/list **pilih santri** — tiap baris: nama santri, status rekap bulan ini ("Sudah diisi ✓" / "Belum"), dan preview ringkas (tambah X hal · +Y juz · keterangan).
2. Klik santri → form **per-santri**: halaman kumulatif (prefill), juz dihafal, tasmi pekan 1–5, ujian soal 1–5, plus preview tambahan halaman/juz/keterangan (menggunakan perhitungan yang sudah ada di `lib/mutabaah-bulanan.ts`).
3. Simpan → kembali ke daftar santri, status baris jadi "Sudah diisi ✓" — lanjut ke santri lain.

**Backend:**
- Endpoint `update` yang ada (`mutabaah-bulanan/{bulan}`) tetap dipakai; payload diubah dari `records[]` (batch) menjadi **satu record santri** saja. Validasi disesuaikan.
- `bulan` tetap bisa dipilih lewat dropdown di dialog.

---

## Architecture

### Backend

**`HalaqahController@santris`** (perubahan):
- Tambah `mutabaah_hari_ini` per santri. Implementasi: query satu kali untuk semua santri halaqah (`whereIn('santri_id', ...)->whereDate('tanggal', today)`) lalu map; hindari N+1.

**`Muhafidz\MutabaahBulananController@update`** (perubahan):
- Payload `records[]` (batch) → satu record `{ santri_id, halaman_kumulatif, juz_dihafal, tasmi_pekan_1..5, ujian_soal_1..5 }`.
- Validasi: `santri_id` harus anggota halaqah muhafidz (403 jika bukan); `halaman_kumulatif` required integer min:0 dan `>= halaman_awal_bulan`; tasmi/ujian `nullable|integer|between:10,100`; `juz_dihafal` nullable string.
- Upsert per (santri_id, tahun, bulan) — pola sudah ada.

**Authorization** tetap di backend: resolusi `$request->user()->muhafidz`, `abort_unless($muhafidz !== null, 403)`, scoping santri via `$muhafidz->halaqahs()->with('santris')`.

### Frontend

**`muhafidz/halaqahs/santris.tsx`** (perubahan utama):
- Baris santri menampilkan status hari ini (`mutabaah_hari_ini`) + tombol "Catat".
- Dialog catat cepat: `MutabaahForm` dengan `tanggal` prefill hari ini; `onSuccess` menutup dialog.
- Fokus pindah ke santri berikutnya: setelah simpan, highlight baris santri berikutnya yang belum dicatat (state lokal; tanpa reload manual tambahan).
- Dialog rekap bulanan: alur dua langkah dalam satu `Dialog` (list santri → form per-santri), memakai state lokal untuk transisi.

**`components/forms/MutabaahForm.tsx`** (penyesuaian kecil): `defaultValue` tanggal = hari ini (sudah ada); tidak ada perubahan field.

**Copy & UI:** Indonesian, shadcn/ui, `PageContainer`, aksen emerald (pola sudah ada).

---

## Data Flow

1. **Setoran harian:** muhafidz buka halaqah → lihat status hari ini → klik "Catat" → dialog prefill tanggal → isi → POST `mutabaahs.store` → reload → baris jadi "Sudah dicatat ✓", highlight santri berikutnya.
2. **Rekap bulanan:** klik "Rekap Bulanan" → list santri + status rekap bulan ini → pilih santri → form per-santri (prefill kumulatif dari Σ halaman setoran harian bulan tsb) → submit satu record → upsert → kembali ke list, status berubah.
3. **Baca:** kalkulator `MutabaahBulananCalculator` menghitung turunan on-the-fly; preview memakai `lib/mutabaah-bulanan.ts` yang sama.
4. **Konsistensi:** rekap yang disimpan tidak otomatis ditimpa setoran harian berikutnya; prefill lain waktu memakai Σ terkini sebagai dasar.

---

## Error Handling

- **FormRequest mutabaah harian** (tetap): `tanggal` required date; `surah` required; `ayat_mulai`/`ayat_selesai` required integer; `halaman` required integer min:1; `nilai` nullable; `status` in enum.
- **FormRequest bulanan (single)**: `halaman_kumulatif` required integer min:0 dan `>= halaman_awal_bulan`; tasmi/ujian `nullable|integer|between:10,100`; `juz_dihafal` nullable string; `bulan` 1..12.
- **403:** muhafidz non-pemilik halaqah; santri di luar halaqah muhafidz.
- Error validasi tampil per field via `InputError` di dalam dialog; dialog tidak tertutup saat error.
- Status "Sudah dicatat" dan "Rekap diisi" dihitung dari respons server (data real-time), bukan state duplikat frontend.

---

## Testing

- **Feature `MuhafidzHalaqahSantriTest`** (extend): santri tampil dengan `mutabaah_hari_ini` null saat belum ada setoran hari ini; berisi data mutabaah saat sudah dicatat hari ini.
- **Feature `MuhafidzMutabaahBulananTest`** (perbarui): payload single record memperbarui/insert baris `mutabaah_bulanans` yang benar; validasi (halaman kumulatif ≥ halaman awal, nilai 10–100); scoping halaqah (403 santri asing); status rekap bulan ini tampil di list santri.
- **Feature `MuhafidzMutabaahTest`** (tetap): POST mutabaah diverifikasi santri dalam halaqah muhafidz.

**Konvensi:** TDD (test dulu), `php artisan test --compact`, `npx tsc --noEmit` (`types:check`), `vendor/bin/pint --dirty --format agent`, Wayfinder regenerate setelah route berubah.

---

## Di Luar Scope (Fase 1)

- Portal santri & orang tua (Fase 2).
- Onboarding & petunjuk halaman (Fase 3).
- Audit konsistensi data antar role (Fase 4).
- Tidak mengubah logika `Mutabaah`/`TargetHafalan`/`RecalculateTargetProgress`/`MutabaahBulananCalculator`.
- Tidak mengubah alur admin.

---

## Kriteria Sukses (Fase 1)

- Muhafidz bisa mencatat mutabaah beruntun untuk beberapa santri di hari yang sama dengan cepat, tanpa ganti halaman, dan melihat status setoran hari ini.
- Rekap bulanan diisi per-santri tanpa grid raksasa; status rekap tiap santri terlihat.
- Seluruh test hijau; UI konsisten light/dark; `pint` dan `types:check` bersih.