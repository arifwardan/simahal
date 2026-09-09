# Design Spec — Revisi Setoran: Harian Baris, Tasmi Pekanan, Ujian Soal Bulanan

**Tanggal:** 2026-09-09
**Status:** Approved — siap implementation plan
**Opsi dipilih:** Opsi A (perluas tabel yang ada)
**Fitur:** Setoran harian satuan baris (target 3 baris/hari), tasmi pekanan tetap 1 nilai, ujian bulanan 5 soal benar/salah (20 poin/soal)

---

## 1. Ringkasan & Scope

**Masalah:** Santri paling susah menghafal hitungan per hari hanya beberapa baris, tapi input setoran harian masih satuan halaman (0–20/hari, header "Target 5 Halaman/Hari"). Tidak mencerminkan target harian riil (3 baris). Ujian bulanan masih 1 nilai bebas, padahal praktiknya ujian soal: 5 soal @ 20 poin.

**Solusi:** Satu layar Input Setoran Halaqah tetap 5 panel, dengan revisi:
1. Setoran Harian → satuan **baris**, target **3 baris/hari**
2. Total Sepekan → auto sum **baris**
3. Nilai Tasmi Pekanan → **tidak berubah** (1 nilai 10–100 + catatan)
4. Total Bulanan → auto sum **baris**
5. Nilai Ujian Bulanan → **5 checkbox soal** (benar = 20, salah = 0), total kelipatan 20 + catatan

**Di luar scope:** AI, WA notifikasi, gamification, perubahan kalender pekan, perubahan policy/role.

---

## 2. Data Model & Migrasi (Opsi A)

### 2.1 `mutabaahs.harian` — reuse kolom `halaman` sebagai baris
- Tidak rename kolom fisik (nol-risiko migrasi). Tambah comment kolom + accessor `baris` sebagai alias di model `Mutabaah`.
- Validasi berubah: `0–30` baris/hari (30 = 2 halaman, pengaman typo; tetap longgar sesuai "tanpa batas ketat").
- Constraint `unique(santri_id, tanggal)` dan upsert 7 hari tetap.

### 2.2 `mutabaah_bulanans` — tambah 5 kolom soal
- Tambah `ujian_soal_1..5 BOOLEAN nullable` (null = belum diuji, true = benar/20, false = salah/0).
- Pertahankan `ujian_bulanan INTEGER nullable` sebagai **cache total** = count(benar) × 20, ditulis otomatis tiap save agar dashboard/prestasi yang membaca `ujian_bulanan` tidak pecah.
- `tasmi_pekan_1..5`, `catatan_tasmi`, `catatan_ujian` tidak berubah.
- Backfill: nilai `ujian_bulanan` lama dibiarkan sebagai total tampilan sampai muhafidz mengisi ulang 5 soal (tidak dipecah, karena tidak bisa direkonstruksi).

### 2.3 Kalkulasi (tidak disimpan, kecuali cache ujian)
- `totalSepekan` = SUM 7 harian (baris, max 210). Target acuan 21 baris/pekan.
- `totalBulanan` = SUM sebulan (baris).
- `ujianTotal` = count(`ujian_soal_*` == true) × 20 (selalu kelipatan 20, max 100).

---

## 3. Backend — API & Logika

### 3.1 Endpoint (tetap, payload berubah)

**GET** `/muhafidz/halaqahs/{halaqah}/setoran?santri_id=&minggu=` — tambah props:
`targetHarian: 3`, `harian[7]` (baris), `totalSepekan`/`totalBulanan` (baris),
`tasmiPekan` + `catatanTasmi` (tetap), `ujianSoal[5]` boolean + `ujianTotal` + `catatanUjian`.

**POST** `/muhafidz/setoran` payload:
```json
{
  "santri_id": 12, "halaqah_id": 3, "minggu": "2026-09-07",
  "harian": {"senin":3,"selasa":3,"rabu":4,"kamis":null,"jumat":null,"sabtu":null,"ahad":null},
  "tasmi_pekan": 85, "catatan_tasmi": "optional",
  "ujian_soal": [true, true, false, true, false], "catatan_ujian": "optional"
}
```
- FormRequest: `harian.* nullable integer 0..30`, `tasmi_pekan nullable integer 10..100`,
  `ujian_soal nullable array size:5`, `ujian_soal.* boolean`, catatan max:1000.
- Transaksi: loop 7 hari upsert/delete + update `ujian_soal_1..5` + tulis ulang cache `ujian_bulanan`.
- Otorisasi & policy tidak berubah.

---

## 4. Frontend — UI 5 Panel (layout tetap)

- Panel 1: header "1. Setoran Harian (Baris)", row `Senin [3] Baris` + ✓/○, hint "Target 3 baris/hari", footer "Total 21 Baris" (live).
- Panel 2 & 4: label satuan halaman → **baris** ("X Baris"), helper tetap (otomatis terhitung).
- Panel 3: tidak berubah (select A–E + catatan).
- Panel 5: ganti select A–E → **5 checkbox "Soal 1..5"** (centang = benar/20), tampilkan **"Total Ujian: 60/100"** live + textarea catatan.
- State: `useState` harian + tasmi + `ujianSoal[5]`; `useMemo` total sepekan/bulanan/ujian; `router.post` Inertia; toast "Setoran pekan N disimpan."

---

## 5. Validasi, Error & Edge

- Future date blocked (max today); kosong = null → tampil "-".
- Total ujian selalu kelipatan 20; pesan error per soal jika tipe salah.
- Pekan 5 pendek: tasmi tetap bisa diisi; ganti minggu tanpa simpan → confirm.
- 7 upsert + update soal dalam 1 transaksi; 403 jika santri beda halaqah.

---

## 6. Testing

- **Unit:** `ujianTotal` mapping (3 benar → 60), grade tasmi tetap, total sepekan/bulanan baris.
- **Feature (Pest):** POST harian baris + 3/5 soal benar → `ujian_bulanan` cache 60; edit H-2 tanpa duplikat;
  future date rejected; GET props berisi `ujianSoal` + `targetHarian: 3`.
- **Browser:** isi 7 hari → total auto baris; centang soal → total live kelipatan 20.

---

## 7. File Terdampak

- Migration: `add_ujian_soal_to_mutabaah_bulanans.php` (5 boolean nullable).
- Model: `Mutabaah` (alias/accessor `baris`), `MutabaahBulanan` (fillable + cast soal).
- Controller: `Muhafidz\SetoranController` (GET+POST). Request: `StoreSetoranRequest`.
- Frontend: `resources/js/pages/muhafidz/setoran/index.tsx` (panel 1, 2, 4, 5).
- Calculator/prestasi: baca `ujian_bulanan` cache — tidak pecah, tanpa perubahan.

---

## 8. Alternatif Dipertimbangkan (ditolak)

- Opsi B (tabel ujian ternormalisasi) — rapi tapi overkill untuk 5 soal tetap.
- Opsi C (kolom JSON) — fleksibel tapi validasi/query ribet, inkonsisten dengan pola flat `tasmi_pekan_*`.
