# Fase 1 — Perbaikan Alur Ustadz Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ubah halaman santri ustadz menjadi papan catat cepat (status setoran hari ini per santri) dan ganti rekap bulanan batch grid menjadi alur dua langkah (pilih santri → form per-santri).

**Architecture:** Backend menambahkan `mutabaah_hari_ini` per santri pada halaman halaqah santri; endpoint `mutabaah-bulanan/{bulan}` diubah dari payload `records[]` (batch) menjadi satu record santri. Frontend mengubah `resources/js/pages/ustadz/halaqahs/santris.tsx` menjadi papan setoran harian dan dialog rekap dua langkah.

**Tech Stack:** Laravel 12 (PHP 8.5), Inertia.js v3, React, TypeScript, Tailwind, shadcn/ui, Pest, Wayfinder.

## Global Constraints

- Copy halaman dalam Bahasa Indonesia.
- Authorization di backend: `$request->user()->ustadz` + `abort_unless($ustadz !== null, 403)` + scoping santri via `$ustadz->halaqahs()->with('santris')`.
- Ustadz pages gunakan alias `->withCount('santris as santri_count')` (aturan `.ai/rules/ustadz.md`).
- Inertia POST handlers redirect ke GET route, jangan `back()` ke POST-only route (aturan `.ai/rules/admin.md`).
- Setelah route berubah: `php artisan wayfinder:generate`.
- Verifikasi: `php artisan test --compact`, `npx tsc --noEmit`, `vendor/bin/pint --dirty --format agent`.

---

### Task 1: Backend — Ekspos `mutabaah_hari_ini` per santri

**Files:**
- Modify: `app/Http/Controllers/Ustadz/HalaqahController.php:41-43`
- Test: `tests/Feature/Ustadz/MutabaahStoreTest.php`

**Interfaces:**
- Consumes: `Santri` model, `Mutabaah` model.
- Produces: setiap item di `santris.data` memiliki field `mutabaah_hari_ini` bertipe `null` atau array berisi `{ id, tanggal, jenis, surah, ayat_mulai, ayat_selesai, status }`.

- [ ] **Step 1: Write the failing test**

Tambahkan dua test di `tests/Feature/Ustadz/MutabaahStoreTest.php`:

```php
test('santri shows mutabaah_hari_ini null when no record today', function () {
    $ustadz = makeActingUstadz($this);
    $halaqah = Halaqah::factory()->create(['ustadz_id' => $ustadz->id]);
    $santri = Santri::factory()->create();
    $halaqah->santris()->attach($santri->id);

    $this->get(route('ustadz.halaqahs.santris.show', $halaqah))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('ustadz/halaqahs/santris')
            ->has('santris.data.0.mutabaah_hari_ini')
            ->where('santris.data.0.mutabaah_hari_ini', null));
});

test('santri shows latest mutabaah_hari_ini when recorded today', function () {
    $ustadz = makeActingUstadz($this);
    $halaqah = Halaqah::factory()->create(['ustadz_id' => $ustadz->id]);
    $santri = Santri::factory()->create();
    $halaqah->santris()->attach($santri->id);

    Mutabaah::factory()->create([
        'santri_id' => $santri->id,
        'tanggal' => now()->toDateString(),
        'surah' => 'Al-Fatihah',
        'ayat_mulai' => 1,
        'ayat_selesai' => 7,
        'status' => 'lulus',
    ]);

    $this->get(route('ustadz.halaqahs.santris.show', $halaqah))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('ustadz/halaqahs/santris')
            ->has('santris.data.0.mutabaah_hari_ini', fn ($m) => $m
                ->where('surah', 'Al-Fatihah')
                ->where('status', 'lulus')));
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `php artisan test --compact tests/Feature/Ustadz/MutabaahStoreTest.php`
Expected: FAIL — `mutabaah_hari_ini` belum ada di props.

- [ ] **Step 3: Implement minimal code**

Di `HalaqahController@santris`, ganti blok yang memuat `$santris` (baris 41-43) dengan kode yang menambah `mutabaah_hari_ini`:

```php
use App\Models\Mutabaah;

// di dalam method santris(), ganti:
$santriIds = $halaqah->santris()->pluck('santris.id');

$todayMutabaahs = Mutabaah::query()
    ->whereIn('santri_id', $santriIds)
    ->whereDate('tanggal', now()->toDateString())
    ->get()
    ->groupBy('santri_id');

$santris = $halaqah->santris()
    ->orderBy('nama')
    ->paginate(15)
    ->through(function (Santri $santri) use ($todayMutabaahs) {
        $latest = $todayMutabaahs->get($santri->id)?->last();

        return [
            'id' => $santri->id,
            'nama' => $santri->nama,
            'nis' => $santri->nis,
            'mutabaah_hari_ini' => $latest ? [
                'id' => $latest->id,
                'tanggal' => $latest->tanggal?->toDateString(),
                'jenis' => $latest->jenis->value,
                'surah' => $latest->surah,
                'ayat_mulai' => $latest->ayat_mulai,
                'ayat_selesai' => $latest->ayat_selesai,
                'status' => $latest->status->value,
            ] : null,
        ];
    });
```

Catatan: `$latest = $todayMutabaahs->get($santri->id)?->last()` mengambil mutabaah terakhir untuk hari itu (bila ada lebih dari satu). `pluck('santris.id')` benar untuk belongsToMany.

- [ ] **Step 4: Run tests to verify they pass**

Run: `php artisan test --compact tests/Feature/Ustadz/MutabaahStoreTest.php`
Expected: PASS (test lama tetap hijau; `santris.data.0.nama`/`nis` tetap ada).

- [ ] **Step 5: Commit**

```bash
git add app/Http/Controllers/Ustadz/HalaqahController.php tests/Feature/Ustadz/MutabaahStoreTest.php
git commit -m "feat: expose mutabaah_hari_ini in ustadz halaqah santri page"
```

---

### Task 2: Backend — Endpoint rekap bulanan single-record

**Files:**
- Modify: `app/Http/Requests/Ustadz/StoreMutabaahBulananRequest.php`
- Modify: `app/Http/Controllers/Ustadz/MutabaahBulananController.php`
- Test: `tests/Feature/Ustadz/MutabaahBulananTest.php`

**Interfaces:**
- Consumes: route `ustadz.mutabaah-bulanan.update` (POST `/ustadz/mutabaah-bulanan/{bulan}`, tidak berubah).
- Produces: endpoint menerima satu record `{ santri_id, halaman_kumulatif, juz_dihafal, tasmi_pekan_1..5, ujian_soal_1..5 }` (tanpa `records[]` wrapper). Frontend Task 4 memakai shape ini.

- [ ] **Step 1: Write the failing tests (update payload shape)**

Ubah `tests/Feature/Ustadz/MutabaahBulananTest.php` agar memakai payload single-record. Ganti setiap `'records' => [[...]]` menjadi field langsung:

```php
test('ustadz can upsert mutabaah bulanan for a halaqah santri', function () {
    $ustadz = actingUstadz($this);
    $halaqah = Halaqah::factory()->create(['ustadz_id' => $ustadz->id]);
    $santri = Santri::factory()->create();
    $halaqah->santris()->attach($santri->id);

    $this->post(route('ustadz.mutabaah-bulanan.update', 1), [
        'santri_id' => $santri->id,
        'halaman_kumulatif' => 25,
        'tasmi_pekan_1' => 80,
        'ujian_soal_1' => 90,
    ])->assertRedirect();

    $this->assertDatabaseHas('mutabaah_bulanans', [
        'santri_id' => $santri->id,
        'tahun' => 2026,
        'bulan' => 1,
        'halaman_kumulatif' => 25,
    ]);

    // upsert: post lagi dengan nilai baru
    $this->post(route('ustadz.mutabaah-bulanan.update', 1), [
        'santri_id' => $santri->id,
        'halaman_kumulatif' => 30,
    ])->assertRedirect();

    $this->assertDatabaseCount('mutabaah_bulanans', 1);
    $this->assertDatabaseHas('mutabaah_bulanans', ['santri_id' => $santri->id, 'halaman_kumulatif' => 30]);
});

test('ustadz cannot submit a santri outside their halaqah', function () {
    $ustadz = actingUstadz($this);
    $halaqah = Halaqah::factory()->create(['ustadz_id' => $ustadz->id]);
    $member = Santri::factory()->create();
    $halaqah->santris()->attach($member->id);
    $stranger = Santri::factory()->create();

    $this->post(route('ustadz.mutabaah-bulanan.update', 1), [
        'santri_id' => $stranger->id,
        'halaman_kumulatif' => 20,
    ])->assertForbidden();
});

test('bulan must be between 1 and 12', function () {
    $ustadz = actingUstadz($this);
    $halaqah = Halaqah::factory()->create(['ustadz_id' => $ustadz->id]);
    $santri = Santri::factory()->create();
    $halaqah->santris()->attach($santri->id);

    $this->post(route('ustadz.mutabaah-bulanan.update', 13), [
        'santri_id' => $santri->id,
        'halaman_kumulatif' => 10,
    ])->assertStatus(422);
});

test('halaman kumulatif cannot be below halaman awal bulan', function () {
    $ustadz = actingUstadz($this);
    $halaqah = Halaqah::factory()->create(['ustadz_id' => $ustadz->id]);
    $santri = Santri::factory()->create(['halaman_awal' => 10]);
    $halaqah->santris()->attach($santri->id);

    $this->post(route('ustadz.mutabaah-bulanan.update', 1), [
        'santri_id' => $santri->id,
        'halaman_kumulatif' => 9,
    ])->assertStatus(422);
});
```

Test `halaqah santri page exposes prefill for given month` tidak berubah (murni GET).

- [ ] **Step 2: Run tests to verify they fail**

Run: `php artisan test --compact tests/Feature/Ustadz/MutabaahBulananTest.php`
Expected: FAIL — validasi `records` gagal karena payload baru.

- [ ] **Step 3: Update FormRequest**

`app/Http/Requests/Ustadz/StoreMutabaahBulananRequest.php` — ganti seluruh isi `rules()`:

```php
public function rules(): array
{
    return [
        'santri_id' => ['required', 'exists:santris,id'],
        'halaman_kumulatif' => ['required', 'integer', 'min:0'],
        'juz_dihafal' => ['nullable', 'string', 'max:100'],
        'tasmi_pekan_1' => ['nullable', 'integer', 'between:10,100'],
        'tasmi_pekan_2' => ['nullable', 'integer', 'between:10,100'],
        'tasmi_pekan_3' => ['nullable', 'integer', 'between:10,100'],
        'tasmi_pekan_4' => ['nullable', 'integer', 'between:10,100'],
        'tasmi_pekan_5' => ['nullable', 'integer', 'between:10,100'],
        'ujian_soal_1' => ['nullable', 'integer', 'between:10,100'],
        'ujian_soal_2' => ['nullable', 'integer', 'between:10,100'],
        'ujian_soal_3' => ['nullable', 'integer', 'between:10,100'],
        'ujian_soal_4' => ['nullable', 'integer', 'between:10,100'],
        'ujian_soal_5' => ['nullable', 'integer', 'between:10,100'],
    ];
}
```

- [ ] **Step 4: Update controller**

`app/Http/Controllers/Ustadz/MutabaahBulananController.php` — ganti `update()`:

```php
public function update(StoreMutabaahBulananRequest $request, int $bulan): RedirectResponse
{
    abort_unless($bulan >= 1 && $bulan <= 12, 422, __('Bulan tidak valid.'));

    $validated = $request->validated();
    $ustadz = $request->user()->ustadz;
    $settings = MutabaahSetting::setting();
    $tahun = $settings->tahun_aktif;
    $calculator = app(MutabaahBulananCalculator::class);

    $ownedSantri = $ustadz->halaqahs()
        ->whereHas('santris', fn ($q) => $q->whereKey($validated['santri_id']))
        ->exists();

    abort_unless($ownedSantri, 403, __('This santri is not in any of your halaqah.'));

    $santri = Santri::query()->findOrFail($validated['santri_id']);
    $halamanAwalBulan = $calculator->halamanAwalBulan($santri, $bulan, $tahun);

    if ($halamanAwalBulan !== null && $validated['halaman_kumulatif'] < $halamanAwalBulan) {
        abort(422, __('Halaman kumulatif tidak boleh kurang dari halaman awal bulan.'));
    }

    DB::transaction(function () use ($validated, $halamanAwalBulan, $tahun, $bulan): void {
        MutabaahBulanan::updateOrCreate(
            ['santri_id' => $validated['santri_id'], 'tahun' => $tahun, 'bulan' => $bulan],
            [
                'halaman_awal_bulan' => $halamanAwalBulan,
                'halaman_kumulatif' => $validated['halaman_kumulatif'],
                'juz_dihafal' => $validated['juz_dihafal'] ?? null,
                'tasmi_pekan_1' => $validated['tasmi_pekan_1'] ?? null,
                'tasmi_pekan_2' => $validated['tasmi_pekan_2'] ?? null,
                'tasmi_pekan_3' => $validated['tasmi_pekan_3'] ?? null,
                'tasmi_pekan_4' => $validated['tasmi_pekan_4'] ?? null,
                'tasmi_pekan_5' => $validated['tasmi_pekan_5'] ?? null,
                'ujian_soal_1' => $validated['ujian_soal_1'] ?? null,
                'ujian_soal_2' => $validated['ujian_soal_2'] ?? null,
                'ujian_soal_3' => $validated['ujian_soal_3'] ?? null,
                'ujian_soal_4' => $validated['ujian_soal_4'] ?? null,
                'ujian_soal_5' => $validated['ujian_soal_5'] ?? null,
            ],
        );
    });

    Inertia::flash('toast', ['type' => 'success', 'message' => __('Mutabaah bulanan berhasil disimpan.')]);

    return back();
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `php artisan test --compact tests/Feature/Ustadz/MutabaahBulananTest.php`
Expected: PASS.

- [ ] **Step 6: Pint + commit**

```bash
vendor/bin/pint --dirty --format agent
git add app/Http/Requests/Ustadz/StoreMutabaahBulananRequest.php app/Http/Controllers/Ustadz/MutabaahBulananController.php tests/Feature/Ustadz/MutabaahBulananTest.php
git commit -m "refactor: mutabaah bulanan update accepts single santri record"
```

---

### Task 3: Frontend — Papan Catat Cepat (setoran harian)

**Files:**
- Modify: `resources/js/pages/ustadz/halaqahs/santris.tsx`

**Interfaces:**
- Consumes: prop `santris.data[].mutabaah_hari_ini` (Task 1) — `null` atau objek.
- Consumes: `MutabaahForm` (tidak berubah), `routes/ustadz/halaqahs` index (tidak berubah).
- Produces: daftar santri menampilkan badge "Sudah dicatat ✓" bila `mutabaah_hari_ini` ada; tombol "Catat" bila belum; setelah simpan, dialog tertutup dan baris berikutnya yang belum dicatat di-highlight.

- [ ] **Step 1: Update type**

Ubah tipe `SantriRow`:

```tsx
type SantriRow = {
    id: number;
    nama: string;
    nis?: string | null;
    mutabaah_hari_ini?: {
        id: number;
        tanggal: string;
        jenis: string;
        surah: string;
        ayat_mulai: number;
        ayat_selesai: number;
        status: string;
    } | null;
};
```

- [ ] **Step 2: Render status + highlight next santri**

Di dalam `UstadzHalaqahSantris`, tambah state:

```tsx
const [highlightId, setHighlightId] = useState<number | null>(null);
```

Ganti blok `santris.data.map(...)` pada daftar santri (baris 472-492) menjadi:

```tsx
<ul className="divide-y rounded-lg border">
    {santris.data.map((santri) => {
        const recorded = santri.mutabaah_hari_ini;
        const isHighlighted = highlightId === santri.id;

        return (
            <li
                key={santri.id}
                className={`flex items-center justify-between gap-4 p-4 transition-colors ${
                    isHighlighted ? 'bg-emerald-50 ring-1 ring-emerald-300 dark:bg-emerald-500/10 dark:ring-emerald-500/40' : ''
                }`}
            >
                <div>
                    <p className="font-medium">{santri.nama}</p>
                    {santri.nis && (
                        <p className="text-sm text-muted-foreground">{santri.nis}</p>
                    )}
                    {recorded && (
                        <p className="mt-1 text-xs text-muted-foreground">
                            {recorded.jenis} · {recorded.surah} {recorded.ayat_mulai}-{recorded.ayat_selesai}
                        </p>
                    )}
                </div>
                {recorded ? (
                    <Badge variant="secondary" className="shrink-0">
                        Sudah dicatat ✓
                    </Badge>
                ) : (
                    <Button
                        size="sm"
                        onClick={() => setCatatSantri(santri)}
                        disabled={processingSantri}
                    >
                        Catat
                    </Button>
                )}
            </li>
        );
    })}
</ul>
```

Tambah state `processingSantri` (id santri yang sedang dikirim):

```tsx
const [processingSantri, setProcessingSantri] = useState<number | null>(null);
```

Ubah dialog catat mutabaah agar `MutabaahForm` menerima callback yang menandai santri selesai, menutup dialog, dan meng-highlight santri berikutnya:

```tsx
<MutabaahForm
    santri={catatSantri}
    jenisOptions={jenisOptions}
    statusOptions={statusOptions}
    onSuccess={() => {
        setProcessingSantri(null);
        setCatatSantri(null);
        const next = santris.data.find((s) => s.id !== catatSantri?.id && !s.mutabaah_hari_ini);
        setHighlightId(next?.id ?? null);
    }}
/>
```

`processingSantri` di-set dari tombol `Catat` (di atas) — update handler:

```tsx
onClick={() => {
    setProcessingSantri(santri.id);
    setCatatSantri(santri);
}}
```

Catatan: `santris.data` akan di-reload otomatis setelah POST karena `MutabaahController@store` me-redirect `back()`; props baru (termasuk `mutabaah_hari_ini` baris yang baru dicatat) tersedia pada re-render. `highlightId` dipakai untuk highlight visual santri berikutnya.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: tidak ada error tipe.

- [ ] **Step 4: Run ustadz tests**

Run: `php artisan test --compact tests/Feature/Ustadz`
Expected: PASS (perubahan murni frontend, test backend tetap hijau).

- [ ] **Step 5: Commit**

```bash
git add resources/js/pages/ustadz/halaqahs/santris.tsx
git commit -m "feat: daily recording board with today status per santri"
```

---

### Task 4: Frontend — Dialog Rekap Bulanan per-Santri

**Files:**
- Modify: `resources/js/pages/ustadz/halaqahs/santris.tsx`

**Interfaces:**
- Consumes: prop `bulanan` (array `BulananRow` dengan `existing`), `settings`, `bulan`; helper `lib/mutabaah-bulanan.ts` (`tambahHalaman`, `tambahJuz`, `keterangan`).
- Consumes: `MutabaahBulananController.update.form({ bulan })` — payload single-record (Task 2).
- Produces: dialog dua langkah — list santri dengan status rekap bulan ini, lalu form per-santri.

- [ ] **Step 1: Rewrite `RekapBulananDialog`**

Ganti seluruh komponen `RekapBulananDialog` (baris 160-439) dengan versi dua langkah. Tambahkan state `selected` (santri yang sedang diedit, `null` = tampil list):

```tsx
function RekapBulananDialog({
    halaqahNama,
    bulan,
    settings,
    bulanan,
    onClose,
}: {
    halaqahNama: string;
    bulan: number;
    settings: Settings;
    bulanan: BulananRow[];
    onClose: () => void;
}) {
    const [rekapBulan, setRekapBulan] = useState(bulan);
    const [selected, setSelected] = useState<BulananRow | null>(null);

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>
                        {selected ? `Rekap Bulanan — ${selected.nama}` : 'Rekap Bulanan'}
                    </DialogTitle>
                    <DialogDescription>
                        {selected
                            ? `Input mutabaah bulanan untuk ${selected.nama} (halaqah ${halaqahNama}).`
                            : `Pilih santri untuk mengisi mutabaah bulanan halaqah ${halaqahNama}.`}
                    </DialogDescription>
                </DialogHeader>

                {selected ? (
                    <RekapSantriForm
                        row={selected}
                        bulan={rekapBulan}
                        settings={settings}
                        onBack={() => setSelected(null)}
                        onSuccess={onClose}
                    />
                ) : (
                    <>
                        <div className="flex items-center gap-2">
                            <Label className="shrink-0">Bulan</Label>
                            <Select
                                value={String(rekapBulan)}
                                onValueChange={(value) => setRekapBulan(Number(value))}
                            >
                                <SelectTrigger className="w-44">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {NAMA_BULAN.map((label, i) => (
                                        <SelectItem key={label} value={String(i + 1)}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <ul className="max-h-[60vh] divide-y overflow-auto rounded-lg border">
                            {bulanan.map((row) => {
                                const kumulatif = row.existing?.halaman_kumulatif ?? null;
                                const terisi = row.existing !== null;

                                return (
                                    <li key={row.santri_id}>
                                        <button
                                            type="button"
                                            onClick={() => setSelected(row)}
                                            className="flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-muted/50"
                                        >
                                            <div>
                                                <p className="font-medium">{row.nama}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {terisi
                                                        ? `Kumulatif ${row.existing?.halaman_kumulatif} hal · +${tambahHalaman(kumulatif, row.halaman_awal_bulan)} hal · +${tambahJuz(kumulatif, row.halaman_awal_bulan, settings.konversi_juz_halaman)} juz · ${keterangan(kumulatif, row.halaman_awal_bulan, settings)}`
                                                        : 'Belum diisi bulan ini'}
                                                </p>
                                            </div>
                                            {terisi ? (
                                                <Badge variant="secondary">Sudah diisi ✓</Badge>
                                            ) : (
                                                <span className="text-sm font-medium text-primary">
                                                    Isi Rekap
                                                </span>
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
```

- [ ] **Step 2: Add `RekapSantriForm` component**

Tambahkan komponen (di file yang sama, sebelum `RekapBulananDialog`):

```tsx
function RekapSantriForm({
    row,
    bulan,
    settings,
    onBack,
    onSuccess,
}: {
    row: BulananRow;
    bulan: number;
    settings: Settings;
    onBack: () => void;
    onSuccess: () => void;
}) {
    const initial = {
        halaman_kumulatif: row.existing?.halaman_kumulatif ?? row.prefill_kumulatif ?? '',
        juz_dihafal: row.existing?.juz_dihafal ?? '',
        tasmi_pekan_1: row.existing?.tasmi_pekan_1 ?? '',
        tasmi_pekan_2: row.existing?.tasmi_pekan_2 ?? '',
        tasmi_pekan_3: row.existing?.tasmi_pekan_3 ?? '',
        tasmi_pekan_4: row.existing?.tasmi_pekan_4 ?? '',
        tasmi_pekan_5: row.existing?.tasmi_pekan_5 ?? '',
        ujian_soal_1: row.existing?.ujian_soal_1 ?? '',
        ujian_soal_2: row.existing?.ujian_soal_2 ?? '',
        ujian_soal_3: row.existing?.ujian_soal_3 ?? '',
        ujian_soal_4: row.existing?.ujian_soal_4 ?? '',
        ujian_soal_5: row.existing?.ujian_soal_5 ?? '',
    };

    return (
        <Form
            {...MutabaahBulananController.update.form({ bulan })}
            onSuccess={onSuccess}
        >
            {({ errors, processing }) => {
                const kumulatif = toNumber(initial.halaman_kumulatif);
                const preview = {
                    tambahHalaman: tambahHalaman(kumulatif, row.halaman_awal_bulan),
                    tambahJuz: tambahJuz(kumulatif, row.halaman_awal_bulan, settings.konversi_juz_halaman),
                    keterangan: keterangan(kumulatif, row.halaman_awal_bulan, settings),
                };

                return (
                    <div className="space-y-4">
                        <input type="hidden" name="santri_id" value={row.santri_id} />

                        <div className="grid gap-2">
                            <Label>Halaman Kumulatif</Label>
                            <Input
                                type="number"
                                name="halaman_kumulatif"
                                min={row.halaman_awal_bulan ?? 0}
                                value={initial.halaman_kumulatif}
                                onChange={(e) => {
                                    initial.halaman_kumulatif = e.target.value;
                                    formRefresh();
                                }}
                            />
                            <InputError message={errors.halaman_kumulatif} />
                        </div>

                        <div className="grid gap-2">
                            <Label>Juz Dihafal</Label>
                            <Input name="juz_dihafal" value={initial.juz_dihafal} />
                            <InputError message={errors.juz_dihafal} />
                        </div>

                        <div className="grid gap-2">
                            <Label>Tasmi (Pekan 1-5)</Label>
                            <div className="grid grid-cols-5 gap-1">
                                {TASMI_KEYS.map((key) => (
                                    <Input key={key} type="number" min={10} max={100} name={key} value={initial[key]} />
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label>Ujian (Soal 1-5)</Label>
                            <div className="grid grid-cols-5 gap-1">
                                {UJIAN_KEYS.map((key) => (
                                    <Input key={key} type="number" min={10} max={100} name={key} value={initial[key]} />
                                ))}
                            </div>
                        </div>

                        <div className="space-y-0.5 rounded-lg border bg-muted/40 p-3 text-sm">
                            <p>+{preview.tambahHalaman} hal</p>
                            <p>+{preview.tambahJuz} juz</p>
                            <p className="font-medium">{preview.keterangan}</p>
                        </div>

                        <InputError message={errors.records} />

                        <div className="flex justify-between">
                            <Button type="button" variant="outline" onClick={onBack}>
                                Kembali
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Menyimpan...' : 'Simpan Rekap'}
                            </Button>
                        </div>
                    </div>
                );
            }}
        </Form>
    );
}
```

Catatan: gunakan `<input>` controlled via `useForm`/`Form` + `defaultValue` alih-alih state lokal. Simpel dan aman: biarkan `Input` memakai `name` (Inertia Form mengumpulkan nilai dari DOM). Untuk preview live yang reaktif, gunakan state lokal `const [kumulatif, setKumulatif] = useState<number | string>(initial.halaman_kumulatif)` dan pasang `onChange` pada input `halaman_kumulatif`. Implementer bebas memilih: preview cukup dihitung ulang via `onChange` handler yang meng-update satu state `kumulatifValue`.

- [ ] **Step 3: Wire up in page**

`UstadzHalaqahSantris` tidak berubah untuk tombol "Rekap Bulanan" (`setShowRekap(true)`). `RekapBulananDialog` menerima `bulanan` yang sudah ada di props.

- [ ] **Step 4: Typecheck + tests**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `php artisan test --compact tests/Feature/Ustadz`
Expected: PASS.

- [ ] **Step 5: Wayfinder regenerate**

Route belum berubah URL/method, tapi jalankan untuk memastikan `@/actions` konsisten:

```bash
php artisan wayfinder:generate
```

- [ ] **Step 6: Commit**

```bash
git add resources/js/pages/ustadz/halaqahs/santris.tsx
git commit -m "feat: per-santri monthly rekap dialog replacing batch grid"
```

---

## Self-Review

**Spec coverage:**
- "Papan catat cepat": Task 1 (backend `mutabaah_hari_ini`) + Task 3 (frontend board + highlight). ✓
- "Rekap per-santri": Task 2 (backend single-record) + Task 4 (frontend two-step dialog). ✓
- Error handling: validasi FormRequest dipertahankan (Task 2); `InputError` di dialog (Task 4). ✓
- Testing: tiap task punya test/verifikasi (backend tests, tsc, wayfinder). ✓
- Fase 2-4 (portal santri, onboarding, konsistensi data) di luar scope Fase 1 — sesuai spec. ✓

**Placeholder scan:** tidak ada TBD/TODO. Semua step berisi kode konkret. Catatan pada `RekapSantriForm` memberi pilihan implementasi preview yang jelas.

**Type consistency:** `mutabaah_hari_ini` konsisten antara Task 1 (PHP shape) dan Task 3 (TS type). `santris.data` tetap paginator (`{ data, total }`). Payload rekap single-record konsisten antara Task 2 (FormRequest) dan Task 4 (field `name` pada input).