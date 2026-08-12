# SIMAHAL — Import Data Massal dari Excel

**Tanggal:** 2026-08-12
**Status:** Approved (design)
**Latar belakang:** aplikasi SIMAHAL sudah memiliki CRUD admin, workflow ustadz, dashboards, dan modul mutabaah bulanan. Pengguna ingin memindahkan data master dari file `Mutabaah_Hafalan_Santri.xlsx` (template Excel PondokIT) ke dalam aplikasi secara massal.

---

## Ringkasan

1. **Import data master** (santri, ustadz/muhafidz, halaqah/kelompok, `halaman_awal`) dari sheet `Data Kelompok` file Excel.
2. **Halaman admin "Import Excel"** dengan alur 3 langkah: upload → pratinjau → konfirmasi eksekusi.
3. **Akun user dibangkitkan otomatis** (email dari nama + password default), NIS otomatis berformat `SIM-{tahun}-{0001}`, idempoten & toleran duplikat.
4. **Import mutabaah bulanan/harian ditunda** (sheet bulan saat ini kosong); struktur parser disiapkan untuk perluasan `readMonthSheet()` di masa depan.

---

## Konteks & Fakta File Excel

File `Mutabaah_Hafalan_Santri.xlsx` memiliki 16 sheet: Petunjuk, Dashboard, Referensi, Data Kelompok, dan Januari–Desember.

- **Data Kelompok** (baris 1 dimulai data dari baris 4): kolom `No | Jenis | Kelompok | Muhafidz/Muhafidzah | Nama Santri | Halaman Awal (Sebelum Program) | Key`. Total tertera 155 baris, namun **hanya ~64 nama santri asli**:
  - Ikhwan: ~49 santri di Kelompok 1–6, muhafidz asli: Hammam, Rizkiansya Alfin, Lukman Syarif, Izza Azam, Muhammad Hubbaib, Abdul Kholik.
  - Akhwat: ~15 santri di Kelompok 1–3, muhafidz asli: Asma Alhikmah, Iklima, Amelia.
  - Sisanya placeholder: santri "Nama 1..12" dan muhafidz "Muhafidz Ikhwan n"/"Muhafidzah Akhwat n" → tidak diimpor.
  - `halaman_awal` saat ini 0 untuk semua baris.
- **Referensi**: 22 kategori juz — sudah direplikasi di enum `MutabaahKategori` aplikasi.
- **Dashboard**: konfigurasi (konversi 20 halaman/juz, ambang 1.5, tahun 2026) — sudah ada di `mutabaah_settings`. Agregat ringkasan bulan Agustus hanya nilai rata-rata level grup.
- **Sheet bulan (Jan–Des)**: **kosong** — selain header, hanya berisi rumus tanpa nilai mentah (`<f>` tanpa `<v>`).
- Sebagian nama santri mengandung karakter tak terlihat (word-joiner U+2060, tanda kutip di ujung, dsb.) yang harus dinormalisasi.

---

## Keputusan Desain

1. **Scope = data master saja.** Rekap mutabaah (harian/bulanan) bukan bagian import ini karena sheet bulan kosong. Desain parser menyisakan titik perluasan `readMonthSheet()`.
2. **Halaman admin "Import Excel"** (bukan modal): alur upload → pratinjau → konfirmasi. Files tidak disimpan di server; eksekusi mengirim ulang file yang sama dan di-parse ulang secara deterministik.
3. **Akun user otomatis**: email = slug nama `@simahal.test` (unik dengan suffix `-2`, `-3` bila kembar, dalam-file maupun terhadap DB yang sudah ada); password default `password` (konvensi seeder), bisa diubah nanti; email yang dibuat ditampilkan di laporan hasil.
4. **NIS otomatis**: `SIM-{tahun_aktif}-{4 digit urut}`, dimulai setelah NIS terbesar yang sudah ada pada tahun itu; tahun dari `mutabaah_settings.tahun_aktif`.
5. **Duplikat**: santri/ustadz/halaqah dicocokkan berdasar nama ternormalisasi (+ jenis untuk santri). Tindakan `update` = tidak membuat baru tetapi memperbarui `halaman_awal` (santri) dan memastikan keanggotaan halaqah. Import dapat dijalankan ulang tanpa menimbulkan duplikat (idempoten).
6. **Placeholder dilewati**: santri bernama kosong atau `Nama <angka>`; muhafidz kosong atau `Muhafidz... <angka>`. Grup dengan muhafidz placeholder → halaqah & ustadz tidak dibuat.
7. **Dependency**: tambah `phpoffice/phpspreadsheet` untuk membaca xlsx/xls secara robust (disetujui pengguna).

---

## Architecture

### Naming Halaqah

- Nama halaqah dari kelompok: `Kelompok {n} {Jenis}` — mis. `Kelompok 1 Ikhwan`, `Kelompok 1 Akhwat` (membedakan antar jenis karena Excel memakai "Kelompok 1..8" di kedua jenis).
- `status` halaqah = `aktif`; `jadwal` = null (diisi manual nanti).
- Keanggotaan: `halaqah_members` status `aktif`, `joined_at` = now.

### Service Layer — `app/Services/ExcelImport/`

Sesuai prinsip isolasi, dipecah menjadi 3 unit dengan tanggung jawab tunggal:

1. **`ExcelReader`** — bungkus PhpSpreadsheet.
   - `readDataKelompok(): ParsedWorkbook` — baca sheet `Data Kelompok`; output DTO `ParsedWorkbook` berisi `groups: ParsedGroup[]` (jenis, kelompok, muhafidz, isRealMuhafidz) dan `santris: ParsedSantri[]` (nama, jenis, kelompok, halamanAwal, isReal, grup).
   - **Normalisasi nama** (`normalizeName`): trim, huruf kecil untuk pencocokan, buang word-joiner/lompatan karakter tak terlihat (U+2060, U+200E, dsb.), rapatkan spasi ganda, buang tanda kutip awal/akhir. Nama asli tetap utuh untuk tampilan.
   - **Deteksi placeholder** (`isPlaceholderSantri`, `isPlaceholderMuhafidz`): regex `^nama\s*\d*$` (case-insens.), nama kosong; muhafidz `^muhafidz(ah)?(\s+.*)?\s+\d+$` (case-insens.) atau kosong.
   - **Titik perluasan**: area kosong `readMonthSheet(bulan)` siap ditambah tanpa mengubah kontrak yang ada.
   - Factory untuk fixture test (membuat workbook kecil via PhpSpreadsheet) agar tes tidak bergantung file nyata.

2. **`ImportPlanner`** — murni (tidak menulis DB, boleh query membaca).
   - `plan(ParsedWorkbook): ImportPlan`.
   - **Email**: hitung dulu untuk seluruh santri/ustadz asli dalam 1 pass (dedup dalam-file), lalu lawan user yang sudah ada di DB (suffix numerik).
   - **NIS**: urut `SIM-{tahun}-{0001..}` setelah `MAX(nis)` tahun itu.
   - **Pencocokan**: ustadz berdasar nama ternormalisasi; halaqah berdasar nama; santri berdasar nama ternormalisasi + jenis.
   - Setiap item rencana membawa: tipe entitas, `action` (`create` | `update` | `placeholder` | `error`), nilai-nilai yang akan ditulis, dan `reason` untuk skip/error (kepentingan pratinjau & laporan).

3. **`ImportExecutor`** — melakukan penulisan.
   - `execute(ImportPlan): ImportResult` dalam satu `DB::transaction`.
   - `create` santri → `User` (role `santri`, email, password) + `Santri` (nis, nama, jenis, status aktif, `halaman_awal`) + `halaqah_members`.
   - `create` ustadz → `User` (role `ustadz`) + `Ustadz` (nama) + halaqah terkait (create bila belum ada, set `ustadz_id`).
   - `update` santri → perbarui `halaman_awal` (+ `jenis` bila beda), pastikan keanggotaan halaqah (attach bila belum ada; tidak menghapus keanggotaan lain).
   - `update` ustadz → perbarui `nama` saja (tidak menyentuh email/kontak).
   - Error tak terduga per baris: `try/catch` per item → dicatat ke `ImportResult.errors`, baris valid tetap diproses; kesalahan fatal (file korup, dsb.) → rollback seluruh transaksi.
   - `ImportResult`: ringkasan + daftar email yang dibuat.

### Route & Controller

| method | path | controller@method | keterangan |
|---|---|---|---|
| GET | `admin/excel-import` | `Admin\ExcelImportController@index` | render halaman |
| POST | `admin/excel-import/preview` | `@preview` | upload → `ImportPlanner::plan()` → return props |
| POST | `admin/excel-import/execute` | `@execute` | file sama → parse+plan ulang → `ImportExecutor::execute()` |

- FormRequest `ImportExcelRequest`: `file` `required`, `mimes:xlsx,xls`, `max:2048`.
- Middleware grup: `['auth', 'verified', 'role:admin']` (di `routes/admin.php`).
- `index`/`preview`/`execute` memakai `$request->user()` hanya untuk auth role; tidak ada resolusi profile tambahan.

### Frontend

- `resources/js/pages/admin/excel-import.tsx` (komponen tunggal; state di dalam komponen).
  1. **Upload**: drag-drop / file input (komponen shadcn yang sudah ada), tombol "Lihat Pratinjau"; file dipegang di state client untuk dikirim ulang saat eksekusi.
  2. **Pratinjau**: kartu ringkasan (akan dibuat, diperbarui, dilewati, error) + tabel rinci per santri/ustadz dengan kolom tindakan & alasan; tombol "Batalkan" dan "Konfirmasi Import".
  3. **Selesai**: laporan hasil (jumlah per kategori + daftar email user yang dibuat) + tautan ke `admin.santris.index`, `admin.ustadzs.index`, `admin.halaqahs.index`.
- Item sidebar admin "Import Excel" ditambahkan di layout admin (ikon `FileUp`), `page.layout = { breadcrumbs }`, kop Indonesia, `PageContainer`, shadcn/ui, aksen emerald — mengikuti halaman admin mutabaah-settings.
- Wayfinder actions di-regenerate setelah route baru.

---

## Data Flow

1. Admin membuka `admin/excel-import`, memilih file `.xlsx` → POST `preview`.
2. `ExcelReader::readDataKelompok()` mem-parse → `ImportPlanner::plan()` menghitung tindakan (termasuk email/NIS). Hasil dirender sebagai pratinjau.
3. Admin mengonfirmasi → POST `execute` dengan file yang sama → parse+plan ulang (deterministik, identik dengan pratinjau) → `ImportExecutor::execute()` dalam satu transaksi.
4. Halaman menampilkan laporan hasil; navigasi kembali ke daftar santri/ustadz/halaqah.

---

## Error Handling

- File tidak valid / tidak bisa dibuka / sheet `Data Kelompok` hilang → toast error + redirect back, tanpa penulisan data.
- Error per baris (jenis tidak dikenali, nama kosong di luar pola placeholder) → tercatat sebagai `error` di pratinjau/laporan; baris valid tetap diproses.
- Konflik email dengan user non-import → resolusi penomoran deterministik oleh planner.
- Eksekusi: satu transaksi; error tak terduga per item di-catch; error sistem → rollback total.
- Validasi file di client (ukuran/tipe) dan server (FormRequest).

---

## Testing

Konvensi proyek: TDD, `php artisan test --compact`, `npx tsc --noEmit`, `vendor/bin/pint --dirty --format agent`, regenerate Wayfinder.

- **Unit `ExcelReaderTest`**: parse fixture workbook (dibuat via factory PhpSpreadsheet); normalisasi nama (unicode/word-joiner, kutip); deteksi placeholder santri & muhafidz; baris → ParsedWorkbook sesuai.
- **Unit `ImportPlannerTest`**: email unik (dalam-file & terhadap DB existing), urutan NIS (dari tahun aktif & MAX nis), klasifikasi tindakan (create/update/placeholder/error), pencocokan ustadz/halaqah/santri.
- **Feature `AdminExcelImportTest`**: upload → preview (ringkasan benar, file invalid ditolak); execute (jumlah santri/ustadz/halaqah/keanggotaan di DB sesuai); **idempoten** (jalankan 2× → tidak dobel); `halaman_awal` santri existing diperbarui; email-user & NIS unik; non-admin → 403.
- Smoke manual UI pasca-build (drag-drop, pratinjau, konfirmasi).

---

## Di Luar Scope

- Import mutabaah harian (`mutabaahs`) dan bulanan (`mutabaah_bulanans`) dari sheet Jan–Des — ditunda; `ExcelReader::readMonthSheet()` adalah titik perluasan.
- Import/link orang tua, akun santri yang dipakai login aktif, atau data user lain.
- Import `Referensi`/`Dashboard` (nilai yang sama sudah ada di aplikasi).
- Validasi/penolakan kualitas nilai Excel lebih dalam.

---

## Kriteria Sukses

- File `Mutabaah_Hafalan_Santri.xlsx` dapat diimpor lewat halaman admin dengan pratinjau akurat dan hasil sesuai (santri/ustadz/halaqah asli dibuat; placeholder dilewati).
- Akun user tiap santri/ustadz dibuat otomatis dengan email unik dan password default; NIS unik `SIM-{tahun}-{0001}`.
- Import idempoten: dijalankan ulang tidak menghasilkan duplikat; `halaman_awal` santri existing ikut diperbarui.
- Seluruh test hijau, `types:check` & `lint` bersih.