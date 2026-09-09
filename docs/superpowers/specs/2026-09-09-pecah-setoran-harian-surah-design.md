# Design Spec — Pecah Input Setoran: Harian per Surah, Tasmi, Ujian (3 Halaman)

**Tanggal:** 2026-09-09
**Status:** Approved — siap implementation plan
**Opsi dipilih:** Opsi A (tabel anak `setoran_details`, `mutabaahs` tetap 1 row/hari)
**Fitur:** 3 halaman + 3 menu sidebar (Setoran Harian, Tasmi Pekanan, Ujian Bulanan); input harian per tanggal dengan banyak surah via select (114 surah seeder lengkap)

---

## 1. Ringkasan & Scope

**Masalah:** Halaman Input Setoran 5 panel memaksa input 1 pekan sekaligus (7 hari) dan kolom `surah` di-hardcode `Al-Fatihah` — padahal santri setor banyak surah per hari (mis. Al-Ikhlas s/d An-Nas = 3 surah). Muhafidz butuh input per hari + pilih surah, serta pemisahan harian/mingguan/bulanan.

**Solusi:** Pecah jadi 3 halaman dengan 3 menu sidebar:
1. **Setoran Harian** — input per hari: 1 santri + 1 tanggal + N surah (select) + baris per surah
2. **Tasmi Pekanan** — nilai + catatan per pekan (+ total sepekan read-only)
3. **Ujian Bulanan** — 5 checkbox soal + total live + catatan (+ total bulanan read-only)

Halaman 5-panel lama dihapus. UI ikut pendapat ui-ux-pro-max: satu layar satu tugas, daftar surah repeatable, total + Simpan sticky, select searchable, `inputmode="numeric"`, label nyata per input, feedback loading → sukses.

**Di luar scope:** AI, WA notifikasi, perubahan dashboard lain, perubahan kalender pekan, ayat per surah (hanya surah + baris).

---

## 2. Data Model & Migrasi (Opsi A)

### 2.1 Tabel baru `surahs`
- `nomor TINYINT unique 1–114`, `nama_latin VARCHAR`, `nama_arab VARCHAR`, `jumlah_ayat SMALLINT`, `juz TINYINT` (juz ayat pertama, info saja).
- Seeder `SurahSeeder`: 114 surah lengkap, idempotent (`updateOrCreate` per `nomor`), dipanggil dari `DatabaseSeeder`.

### 2.2 Tabel baru `setoran_details`
- `mutabaah_id FK → mutabaahs ON DELETE CASCADE`, `surah_id FK → surahs ON DELETE RESTRICT`, `baris INT`.
- Constraint `unique(mutabaah_id, surah_id)` — cegah duplikat surah yang sama di hari yang sama.

### 2.3 `mutabaahs` — tetap 1 row/hari
- `unique(santri_id, tanggal)` tidak berubah; `halaman` = total baris = SUM(details), dihitung server tiap save.
- Kolom string `surah` diisi ringkasan otomatis: range bernomor urut → "Al-Ikhlas – An-Nas", acak → join maks 3 nama ("Al-Baqarah, Ali 'Imran, +1").
- `ayat_mulai/ayat_selesai` jadi nullable (tidak relevan di header); `surah` hardcode Al-Fatihah hilang.

---

## 3. Backend — API & Logika

### 3.1 Setoran Harian
**GET** `/muhafidz/setoran-harian?santri_id=&tanggal=` (default today) → props: `santri, tanggal, details[{surah_id, baris}], totalBaris, surahs[114], targetHarian: 3`.
**POST** `/muhafidz/setoran-harian` payload:
```json
{
  "santri_id": 12, "tanggal": "2026-09-09",
  "details": [{"surah_id": 112, "baris": 4}, {"surah_id": 113, "baris": 5}, {"surah_id": 114, "baris": 6}]
}
```
- Validasi: santri milik halaqah pengampu, `tanggal date ≤ today`, `details array min:1`, `details.*.surah_id exists:surahs,id distinct`, `details.*.baris integer 1..30`.
- Transaksi: `updateOrCreate` header + sync details (delete yang dibuang, upsert sisanya) + tulis total + ringkasan nama.
- Kosongkan semua surah = hapus mutabaah hari itu (dengan konfirmasi di client).

### 3.2 Tasmi Pekanan
**GET/POST** `/muhafidz/tasmi?santri_id=&minggu=` — total sepekan read-only + `tasmi_pekan 10–100` + catatan. Hanya sentuh `tasmi_pekan_N` + `catatan_tasmi`. Logic pindah dari `SetoranController` ke `TasmiController` (tipis).

### 3.3 Ujian Bulanan
**GET/POST** `/muhafidz/ujian?santri_id=&tahun=&bulan=` — total bulanan read-only + `ujian_soal[5]` + total live + catatan. Logic pindah dari `SetoranController` ke `UjianController` (tipis).

### 3.4 Otorisasi & route lama
- Policy sama: hanya pengampu halaqah; 403 jika santri beda halaqah.
- Route `setoran.index/store` (5-panel) dihapus; link "Input Setoran" di Halaqah Saya → Setoran Harian (dengan `santri_id` terisi).

---

## 4. Frontend — 3 Halaman + Sidebar

- Sidebar muhafidz: 3 item baru (Setoran Harian, Tasmi Pekanan, Ujian Bulanan) dengan ikon Lucide, `cursor-pointer`, gaya brutal konsisten.
- **Setoran Harian** (`muhafidz/setoran-harian/index.tsx`): hero kecil (santri + tanggal) → daftar baris `[select surah searchable] + [input baris numeric] + [hapus]` → "+ Tambah Surah" → sticky footer (total live + Simpan). Toast sukses "Setoran Budi 9 Sep disimpan: 15 baris, 3 surah".
- **Tasmi** & **Ujian**: halaman fokus tunggal (total read-only besar + input + catatan + Simpan), reuse pola panel 3/5 yang ada.
- State React biasa (`useState` + `useMemo`); `router.post` Inertia; Wayfinder untuk URL.

---

## 5. Validasi, Error & Edge

- Future date blocked; minimal 1 surah; duplikat surah/sehari rejected (`distinct` + unique DB).
- Total selalu dihitung server (client hanya preview).
- Ganti santri/tanggal tanpa simpan → confirm; hapus hari → confirm.
- Surah dihapus dari seeder tidak merusak data lama (RESTRICT).
- Data lama 7-hari/mutabaah tanpa details tetap terbaca (details kosong → tampil total header saja).

---

## 6. Testing

- **Unit:** ringkasan nama (range vs acak), total = sum details.
- **Feature (Pest):** seeder 114 surah; POST 3 surah → header total 15 + 3 details + ringkasan "Al-Ikhlas – An-Nas"; duplikat surah 422; future date rejected; hapus semua → row terhapus; tasmi/ujian route baru hijau; route 5-panel lama 404.
- **Browser:** tambah 3 surah → total live 15 → simpan → reload tetap.

---

## 7. File Terdampak

- Migration: `create_surahs_table`, `create_setoran_details_table`, `mutabaahs ayat nullable` (bila belum).
- Model: `Surah`, `SetoranDetail`, `Mutabaah` (relasi `details`), `MutabaahBulanan` (tetap).
- Seeder: `SurahSeeder` + registrasi di `DatabaseSeeder`.
- Controller: `SetoranHarianController`, `TasmiController`, `UjianController` baru; `SetoranController` lama dihapus.
- Request: `StoreSetoranHarianRequest`, reuse/pecah request tasmi & ujian.
- Frontend: 3 page baru + sidebar + hapus `muhafidz/setoran/index.tsx` + update link Halaqah Saya.
- Test lama `Setoran*Test` diadaptasi ke route baru.

---

## 8. Alternatif Dipertimbangkan (ditolak)

- Opsi B (banyak row `mutabaahs`/hari) — inflate hitungan dashboard (`count(mutabaahs)`), ubah banyak query, upsert rumit.
- Opsi C (kolom JSON) — tanpa FK, laporan per-surah ribet.
