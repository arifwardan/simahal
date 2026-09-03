# Design Spec — Input Setoran Halaqah (Harian → Pekanan → Bulanan)

**Tanggal:** 2026-09-03
**Status:** Draft — menunggu review
**Opsi dipilih:** Opsi A (perluas yang ada)
**Fitur:** Per santri 5 panel: Setoran Harian (Senin–Ahad editable), Total Sepekan auto, Nilai Tasmi Pekanan, Total Hafalan Bulanan auto, Nilai Ujian Bulanan

---

## 1. Ringkasan & Scope

**Masalah:** Muhafidz butuh input setoran harian per halaqah, tapi flow sekarang per santri per hari via dialog `Catat` terpisah dari `Rekap Bulanan`. Kalau lupa 1–2 hari tidak bisa edit mundur dengan mudah, dan total sepekan/bulanan belum terintegrasi dalam satu layar.

**Solusi:** Satu layar **Input Setoran Halaqah** per santri (seperti gambar referensi) dengan 5 panel:
1. Setoran Harian (7 input)
2. Total Setoran Sepekan (auto)
3. Nilai Tasmi Pekanan + catatan
4. Total Hafalan Bulanan (auto)
5. Nilai Ujian Bulanan + catatan

**Lokasi:** `muhafidz/halaqahs/{halaqah}/santris/{santri}/setoran` — diakses dari daftar santri halaqah (ganti tombol `Catat` → `Input Setoran`). Tidak ada field lokasi halaqah (semua di masjid).

**Di luar scope:** AI, WA notifikasi, gamification, mobile native, multi-halaqah bulk edit (tetap per santri).

---

## 2. Data Model & Migrasi

### 2.1 Tabel `mutabaahs` (harian) — tetap, upsert
- `santri_id FK`, `muhafidz_id FK`, `tanggal DATE`, `halaman INT nullable`, `jenis, surah, ayat_mulai/ayat_selesai` opsional
- Constraint: `unique(santri_id, tanggal)` — memungkinkan edit H-1/H-2 via upsert
- Validasi: `halaman 0–20`, `tanggal <= today`, `santri belongs to halaqah`

### 2.2 Tabel `mutabaah_bulanans` (per santri per bulan)
Existing: `santri_id, tahun, bulan, halaman_kumulatif, juz_dihafal, tasmi_pekan_1..5, ujian_soal_1..5`

Perubahan:
- Keep `tasmi_pekan_1..5` (INTEGER 10–100 nullable) — satu per pekan, pekan 5 nullable jika bulan hanya 4 pekan
- Keep `halaman_kumulatif` untuk kompatibilitas (deprecated, tidak dipakai untuk total baru)
- **Drop** `ujian_soal_1..5` → **add** `ujian_bulanan INTEGER nullable (10–100)` — 1 nilai per bulan
- **Add** `catatan_tasmi TEXT nullable` (catatan untuk tasmi pekan yang sedang diinput — disimpan di baris `mutabaah_bulanans` untuk bulan tersebut, overwrite per pekan aktif; untuk MVP cukup 1 kolom, tidak per pekan 1..5) dan `catatan_ujian TEXT nullable` (catatan ujian bulanan)

Migrasi backfill: jika `ujian_soal_*` ada isi, `ujian_bulanan = round(avg(ujian_soal_*))`.

### 2.3 Kalkulasi (tidak disimpan)
- `total_sepekan(week)` = `SUM(mutabaahs.halaman WHERE tanggal BETWEEN senin AND ahad)`
- `pekan_ke_N` = nomor pekan dalam bulan berdasarkan **Senin**-nya (1..5). Mis. Senin 19 Mei 2024 → hitung `ceil(day_of_senin /7)` dengan koreksi: pekan dihitung per bulan kalender, jika Senin di akhir bulan, pekan tetap milik bulan Senin.
- `total_bulanan(bulan)` = `SUM(total_sepekan untuk N pekan di bulan itu)` — sum 4 atau 5 pekan

---

## 3. Backend — API & Logika

### 3.1 Endpoint

**GET** `/muhafidz/halaqahs/{halaqah}/setoran? santri_id= & minggu=2024-05-19`
- Auth: `role=muhafidz`, `halaqah.muhafidz_id == auth.muhafidz.id`, `santri in halaqah`
- Query: `minggu` = ISO date Senin (default current week Monday)
- Hitung `senin..ahad` via Carbon `startOfWeek(Carbon::MONDAY)`
- Ambil 7 `mutabaahs` untuk santri di rentang tersebut
- Ambil `mutabaah_bulanans` untuk `(tahun, bulan)` dari Senin
- Hitung `total_sepekan`, `total_bulanan` (sum pekan 1..N)
- Response Inertia: `santri, halaqah, minggu {senin, ahad, pekan_ke}, harian[7], totalSepekan, tasmiPekan, catatanTasmi, totalBulanan, ujianBulanan, catatanUjian, settings`

**POST** `/muhafidz/setoran`
- Payload:
  ```json
  {
    "santri_id": 12,
    "halaqah_id": 3,
    "minggu": "2024-05-19",
    "harian": {"senin":5,"selasa":5,"rabu":5,"kamis":5,"jumat":5,"sabtu":null,"ahad":null},
    "tasmi_pekan": 85,
    "catatan_tasmi": "optional",
    "ujian_bulanan": 90,
    "catatan_ujian": "optional"
  }
  ```
- Validasi FormRequest: `santri_id exists & belongs to halaqah`, `halaqah_id belongs to auth`, `minggu date`, `harian.* nullable integer 0..20`, `tasmi_pekan nullable integer 10..100`, `ujian_bulanan nullable integer 10..100`, `catatan_* nullable string max:1000`
- Transaksi: loop 7 hari → `Mutabaah::updateOrCreate([santri_id, tanggal], [halaman, muhafidz_id])` (hapus jika null? simpan 0 atau null). Update `MutabaahBulanan::updateOrCreate([santri_id,tahun,bulan], [tasmi_pekan_N, ujian_bulanan, catatan...])`
- Response: redirect back dengan toast, Inertia `preserveState`

### 3.2 Otorisasi & Policy
- Gate `muhafidz` + `HalaqahPolicy::view` — hanya pengampu
- Santri/orang tua: GET read-only (reuse endpoint dengan guard santri)

### 3.3 Kalender Pekan
- Helper `pekanNumberInMonth(Carbon $senin): int` — `intdiv($senin->day-1,7)+1` (1..5)
- Helper `pekanCountInMonth(int $tahun,int $bulan): int` — hitung Senin yang jatuh di bulan itu (biasanya 4, kadang 5)

---

## 4. Frontend — UI 5 Panel

**Route:** `resources/js/pages/muhafidz/setoran/index.tsx` (baru) — dipanggil dari `muhafidz/halaqahs/santris.tsx` via Link `Input Setoran`.

**Header:** 
- Left: `Select Santri` (dropdown santri dalam halaqah, searchable, DataTable style sudah ada)
- Cards ringkas: `Target Hafalan (5 Halaman/Hari)`, `Juz Saat Ini (Juz 5)`, `Halaman Saat Ini (87)`, `Metode (Ummul Qura)` — read-only props

**Week Picker:** kanan atas `19 Mei 2024` dengan `< >` prev/next pekan, `Select` bulan fallback.

**Grid 5 panel (lg:grid-cols-5, mobile stack):**

1. **Setoran Harian** — Card `border-[3px] border-black`, header `1. Setoran Harian` + subtitle. 7 rows: `Senin [5] Halaman` dengan indicator `✓` jika terisi, `○` jika kosong. Input `type=number min=0 max=20`. Footer `Total Setoran Harian 25 Halaman` (sum live).

2. **Total Setoran Sepekan** — Card mint `bg-[#E6F7EE] border-2`, angka besar `25`, label `Halaman`, helper *Otomatis terhitung dari total setoran harian*.

3. **Nilai Tasmi Pekanan** — `Select Pilih Nilai` (A 90-100 hijau, B 80-89 biru, C 70-79 kuning, D 60-69 orange, E <60 merah) + list grade warna. Simpan integer. `Textarea Catatan (opsional)`.

4. **Total Hafalan Bulanan** — Card biru `100 Halaman`, helper *Rekap total hafalan bulan ini* (sum pekan).

5. **Nilai Ujian Bulanan** — sama seperti Tasmi, 1 select A-E + catatan.

**Footer actions:** `Reset` (outline) + `Simpan Setoran` (primary hijau, `shadow-[3px_3px_0...]` brutal). Optimistic update: saat harian diubah, total sepekan & bulanan recompute di client sebelum POST. Toast sukses `Setoran pekan N disimpan`.

**State:** React `useState` untuk 7 harian + tasmi + ujian. `useMemo` untuk total. `router.post` Inertia.

**Styling:** Ikuti brutal warm `#FFF7E8` + DataTable borders, `cursor-pointer`, focus ring 3px black, `font-head` untuk angka besar.

---

## 5. Validasi, Error & Edge

- Future date blocked (max today)
- Kosong = null → tampil `-`, tidak hitung error
- Pekan 5 pendek (2 hari) → tasmi pekan 5 tetap bisa diisi, total bulanan sum yang ada
- Ganti minggu tanpa simpan → `beforeUnload` confirm
- 7 upsert dalam transaksi — jika 1 gagal, rollback semua + `InputError` per hari
- 403 jika santri bukan di halaqah
- Rate limit tidak perlu (internal)

---

## 6. Testing

- **Unit:** `pekanNumberInMonth`, `totalSepekan`, grade mapping (90→A), `totalBulanan` 4 vs 5 pekan
- **Feature (Pest):**
  - muhafidz bisa GET setoran santri halaqahnya, 403 jika halaqah lain
  - POST upsert 7 hari + tasmi, total_sepekan 25 & total_bulanan 100 terhitung benar
  - Edit H-2 (Senin) via same pekan → update tidak duplikat
  - Pekan 5 nullable
  - Future date rejected
  - Ujian single field backfill avg
- **Browser:** isi 7 hari → total auto 25, simpan → reload tetap 25

---

## 7. Komponen & File Terdampak

- **Migration:** `add_ujian_bulanan_and_catatan_to_mutabaah_bulanans.php` (drop ujian_soal_*)
- **Model:** `MutabaahBulanan` fillable baru
- **Controller:** `Muhafidz\SetoranController` (GET+POST) atau perluas `MutabaahBulananController`
- **Request:** `StoreSetoranRequest`
- **Helper:** `app/Helpers/PekanHelper.php` atau `lib/mutabaah-bulanan` sudah ada → tambah `pekanNumber`
- **Frontend:** `resources/js/pages/muhafidz/setoran/index.tsx` baru, modifikasi `muhafidz/halaqahs/santris.tsx` (tombol Input Setoran)
- **Lib:** `resources/js/lib/mutabaah-bulanan.ts` (grade mapping)

---

## 8. Alternatif Dipertimbangkan (ditolak)

- Opsi B (tabel pekan baru) — duplikasi, konsistensi risk
- Opsi C (flat 7 kolom) — kaku, tidak reuse `mutabaahs`

---

## 9. Risiko & Mitigasi

- Kalender pekan lintas bulan → mitigasi: pekan dinomori by Senin, test 5-pekan month
- Data ujian lama 5 kolom → backfill avg + migrasi aman
- Performance 7 upsert → transaksi, batch

