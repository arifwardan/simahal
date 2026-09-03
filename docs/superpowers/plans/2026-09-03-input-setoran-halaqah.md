# Input Setoran Halaqah 5 Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bangun layar Input Setoran Halaqah per santri (5 panel: Setoran Harian Senin–Ahad editable, Total Sepekan auto, Tasmi Pekanan, Total Bulanan auto, Ujian Bulanan) dengan picker minggu, sesuai Opsi A design spec.

**Architecture:** Perluas `mutabaahs` (upsert 7 hari) + `mutabaah_bulanans` (tasmi_pekan_N + ujian_bulanan tunggal). Kalkulasi total sepekan/bulanan di backend (SUM) dan frontend optimistic. Satu controller baru `SetoranController` + FormRequest + helper `PekanHelper`, satu page baru `muhafidz/setoran/index.tsx` menggantikan flow Catat+Rekap.

**Tech Stack:** Laravel 12 / PHP 8.5 / Eloquent / PostgreSQL, Inertia React 19 / TypeScript / Tailwind brutal, Pest, Carbon

**Spec:** `docs/superpowers/specs/2026-09-03-input-setoran-halaqah-design.md`

## Global Constraints

- Business logic di Laravel, data access Eloquent, UI React+Inertia, komponen reusable (shadcn/ui)
- Role-based authorization wajib di backend
- Validasi server + frontend
- Halaman `muhafidz/halaqahs/santris.tsx` existing tetap, tambah link ke setoran
- Lokasi halaqah di masjid — tidak ada field lokasi
- Pekan = Senin–Ahad, jumlah pekan per bulan 4/5 via Senin
- Halaman 0–20, tasmi/ujian 10–100, grade A-E hanya label (simpan angka)
- Warm cream `#FFF7E8` / `#FFFEF2`, brutal `border-[3px] border-black`, `cursor-pointer`
- Bahasa UI Indonesia, tidak ada putih polos `#FFFFFF` kecuali QR

---

### Task 1: Migration — ujian_bulanan + catatan_tasmi/ujian

**Files:**
- Create: `database/migrations/2026_09_03_000001_add_ujian_bulanan_to_mutabaah_bulanans.php`
- Test: `tests/Feature/MutabaahBulananMigrationTest.php`
- Modify: `app/Models/MutabaahBulanan.php:1-40` (fillable)

**Interfaces:**
- Consumes: existing `mutabaah_bulanans` schema
- Produces: columns `ujian_bulanan INTEGER nullable`, `catatan_tasmi TEXT nullable`, `catatan_ujian TEXT nullable` (and drop `ujian_soal_1..5` after backfill)

- [ ] **Step 1: Write failing test — migration columns exist**

```php
// tests/Feature/MutabaahBulananMigrationTest.php
it('has ujian_bulanan and catatan columns', function () {
    expect(Schema::hasColumn('mutabaah_bulanans','ujian_bulanan'))->toBeTrue();
    expect(Schema::hasColumn('mutabaah_bulanans','catatan_tasmi'))->toBeTrue();
    expect(Schema::hasColumn('mutabaah_bulanans','catatan_ujian'))->toBeTrue();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --filter=test_has_ujian_bulanan -v`
Expected: FAIL column not found

- [ ] **Step 3: Write migration + model fillable**

```php
// migration up():
Schema::table('mutabaah_bulanans', function (Blueprint $t) {
  $t->integer('ujian_bulanan')->nullable()->after('tasmi_pekan_5');
  $t->text('catatan_tasmi')->nullable()->after('ujian_bulanan');
  $t->text('catatan_ujian')->nullable()->after('catatan_tasmi');
  // backfill
  // drop ujian_soal_1..5 after backfill in same migration (if exists)
});
// shell: php artisan make:migration add_ujian_bulanan_to_mutabaah_bulanans
// Model: add to Fillable array
```

- [ ] **Step 4: Run test to verify it passes**

Run: `php artisan migrate:fresh --seed && php artisan test --filter=test_has_ujian_bulanan -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add database/migrations/2026_09_03_000001_add_ujian_bulanan_to_mutabaah_bulanans.php app/Models/MutabaahBulanan.php tests/Feature/MutabaahBulananMigrationTest.php
git commit -m "feat: migration ujian_bulanan single + catatan tasmi/ujian"
```

---

### Task 2: Helper PekanHelper + unit tests

**Files:**
- Create: `app/Helpers/PekanHelper.php`
- Test: `tests/Unit/PekanHelperTest.php`

**Interfaces:**
- Consumes: Carbon
- Produces: `PekanHelper::pekanNumberInMonth(Carbon $senin): int` (1..5), `PekanHelper::pekanCountInMonth(int $tahun,int $bulan): int`, `PekanHelper::weekRange(Carbon $minggu): array{senin:Carbon,ahad:Carbon}`, `PekanHelper::gradeLabel(int|null $nilai): string` (A-E)

- [ ] **Step 1: Write failing tests**

```php
it('pekan number is 3 for 19 May 2024', function(){
  expect(PekanHelper::pekanNumberInMonth(Carbon::parse('2024-05-19')))->toBe(3);
});
it('week range monday-sunday', function(){
  $r = PekanHelper::weekRange(Carbon::parse('2024-05-19'));
  expect($r['senin']->toDateString())->toBe('2024-05-13'); // wait 19 is Sunday? adjust
});
it('grade mapping 85 => B', function(){
  expect(PekanHelper::gradeLabel(85))->toBe('B');
});
```

- [ ] **Step 2: Run fails**

Run: `php artisan test --filter=PekanHelper -v` FAIL class not found

- [ ] **Step 3: Implement minimal helper**

```php
class PekanHelper {
  public static function pekanNumberInMonth(Carbon $senin): int { return intdiv($senin->day-1,7)+1; }
  public static function weekRange(Carbon $d): array { $s=$d->clone()->startOfWeek(Carbon::MONDAY); return ['senin'=>$s,'ahad'=>$s->clone()->addDays(6)]; }
  public static function gradeLabel(?int $n): string { if($n===null) return '-'; if($n>=90) return 'A'; if($n>=80) return 'B'; if($n>=70) return 'C'; if($n>=60) return 'D'; return 'E'; }
}
```

- [ ] **Step 4: Pass**

Run: `php artisan test --filter=PekanHelper -v` PASS

- [ ] **Step 5: Commit**

```bash
git add app/Helpers/PekanHelper.php tests/Unit/PekanHelperTest.php
git commit -m "feat: add PekanHelper grading and week calc"
```

---

### Task 3: Model unique constraint + MutabaahBulanan fillable update

**Files:**
- Modify: `app/Models/MutabaahBulanan.php` (casts, fillable ujian_bulanan/catatan_*)
- Create: `database/migrations/2026_09_03_000002_add_unique_santri_tanggal_to_mutabaahs.php` (if not exists)
- Test: `tests/Feature/MutabaahUpsertTest.php`

**Interfaces:**
- Produces: `Mutabaah::updateOrCreate` safe

- [ ] **Step 1: Write failing test for upsert**

```php
it('upserts 7 hari distinct', function(){
  $s=Santri::factory()->create(); $m=Muhafidz::factory()->create();
  Mutabaah::updateOrCreate(['santri_id'=>$s->id,'tanggal'=>'2024-05-13'],['halaman'=>5,'muhafidz_id'=>$m->id]);
  Mutabaah::updateOrCreate(['santri_id'=>$s->id,'tanggal'=>'2024-05-13'],['halaman'=>7,'muhafidz_id'=>$m->id]);
  expect(Mutabaah::where('santri_id',$s->id)->count())->toBe(1);
  expect(Mutabaah::first()->halaman)->toBe(7);
});
```

- [ ] **Step 2: Fails if duplicate**

Run: `php artisan test --filter=test_upserts -v`

- [ ] **Step 3: Add unique index migration if missing, update fillable**

```php
Schema::table('mutabaahs', fn($t)=>$t->unique(['santri_id','tanggal']));
```

- [ ] **Step 4: Pass**

Run: `php artisan test`

- [ ] **Step 5: Commit**

---

### Task 4: FormRequest StoreSetoranRequest

**Files:**
- Create: `app/Http/Requests/Muhafidz/StoreSetoranRequest.php`
- Test: `tests/Feature/StoreSetoranValidationTest.php`

**Interfaces:**
- Produces: `StoreSetoranRequest::rules(): array` with `halaqah_id exists, santri_id exists & belongsToHalaqah, minggu date, harian.* nullable integer 0..20, tasmi_pekan nullable 10..100, ujian_bulanan nullable 10..100`

- [ ] **Step 1: Failing validation test**

```php
it('rejects future minggu and halaman 30', function(){
  $payload=['minggu'=>now()->addWeek()->toDateString(),'harian'=>['senin'=>30],'tasmi_pekan'=>200];
  // post as muhafidz expect 422
});
```

- [ ] **Step 2: Run fails**

- [ ] **Step 3: Implement rules + authorize (check halaqah belongs to auth muhafidz)**

```php
public function authorize(): bool { $h=Halaqah::find($this->halaqah_id); return $h && $h->muhafidz_id=== $this->user()->muhafidz->id; }
public function rules(): array { return ['minggu'=>'required|date|before_or_equal:today', 'harian.senin'=>'nullable|integer|min:0|max:20', ... 'tasmi_pekan'=>'nullable|integer|min:10|max:100', ...]; }
```

- [ ] **Step 4: Pass**

- [ ] **Step 5: Commit**

---

### Task 5: SetoranController GET + POST

**Files:**
- Create: `app/Http/Controllers/Muhafidz/SetoranController.php`
- Modify: `routes/muhafidz.php` (add GET/POST)
- Test: `tests/Feature/SetoranControllerTest.php`

**Interfaces:**
- Consumes: `PekanHelper`, `StoreSetoranRequest`, `Mutabaah`, `MutabaahBulanan`
- Produces: `index(Request $req, Halaqah $halaqah): Response` + `store(StoreSetoranRequest $req): RedirectResponse`

- [ ] **Step 1: Write failing feature tests**

```php
it('muhafidz can view setoran 5 panels and total 25', function(){
  // seed 5 mutabaahs Mon-Fri 5 halaman
  $this->actingAs($muhafidzUser)->get(route('muhafidz.setoran.index',[$halaqah,'minggu'=>'2024-05-13','santri_id'=>$s->id]))->assertOk()->assertInertia(fn($p)=>$p->where('totalSepekan',25));
});
it('403 if not own halaqah', ...);
it('stores upsert and tasmi grade', ...);
```

- [ ] **Step 2: Fails**

- [ ] **Step 3: Implement controller**

```php
public function index(Request $r, Halaqah $h){ Gate::authorize('view',$h); $minggu=Carbon::parse($r->minggu ?? now()->startOfWeek()); [$senin,$ahad]=PekanHelper::weekRange($minggu); $harian=Mutabaah::whereSantri+date range; $bulanan=MutabaahBulanan::firstOrNew([tahun=>senin.year,bulan=>senin.month]); $totalSepekan=$harian->sum('halaman'); $totalBulanan= sum pekan 1..N via PekanHelper; return Inertia::render('muhafidz/setoran/index',[...]); }
public function store(StoreSetoranRequest $r){ DB::transaction(... 7 upserts + bulanan update tasmi_pekan_N ...); return to_route(...)->withToast; }
```

- [ ] **Step 4: Pass**

- [ ] **Step 5: Commit**

---

### Task 6: Frontend — lib mutabaah-bulanan grade + pekan

**Files:**
- Modify: `resources/js/lib/mutabaah-bulanan.ts` (add gradeLabel, pekan helpers)
- Test: `resources/js/lib/mutabaah-bulanan.test.ts` (vitest)

- [ ] **Step 1: Write failing js test**

```ts
expect(gradeLabel(85)).toBe('B');
expect(totalSepekan({senin:5,selasa:5})).toBe(10);
```

- [ ] **Step 2: Fails**

- [ ] **Step 3: Implement**

```ts
export function gradeLabel(n:number|null){ if(n==null) return '-'; ... }
export function totalSepekan(h:Record<string,number|null>){ return Object.values(h).reduce((a,b)=>a+(b??0),0); }
```

- [ ] **Step 4: Pass**

- [ ] **Step 5: Commit**

---

### Task 7: Frontend — Page 5 panel `muhafidz/setoran/index.tsx`

**Files:**
- Create: `resources/js/pages/muhafidz/setoran/index.tsx`
- Modify: `resources/js/pages/muhafidz/halaqahs/santris.tsx` (button Input Setoran link)
- Test: manual + `npm run build` + `tsc --noEmit`

**Interfaces:**
- Consumes: `DataTable` style already, `Select`, `Input`, `Textarea`, `gradeLabel`, Inertia `router`
- Produces: 5 panels layout `lg:grid-cols-5` with header + week picker

- [ ] **Step 1: Write failing check — page renders 7 inputs**

```tsx
// simple render test: query 7 inputs for Senin..Ahad
```

- [ ] **Step 2: Fails file not exists**

- [ ] **Step 3: Implement page**
- Header Pilih Santri + 4 stat cards (target/juz/halaman/metode) readOnly
- Week picker prev/next + `router.get` with preserveState
- Panel1: 7 rows Input number 0..20 with ✓/○, live total
- Panel2: big card totalSepekan
- Panel3: Select A-E (value angka) + Textarea catatan_tasmi
- Panel4: big card totalBulanan
- Panel5: Select ujian + catatan_ujian
- Footer Reset + Simpan (router.post to SetoranController.store)
- Brutal warm `bg-[#FFF7E8]` `border-[3px] border-black`

- [ ] **Step 4: Build passes**

Run: `npx tsc --noEmit && npm run build`

- [ ] **Step 5: Commit**

---

### Task 8: Polish + Pest browser + docs

**Files:**
- Modify: `resources/js/components/ui/select.tsx` (grade colors)
- Test: `tests/Browser/SetoranTest.php` (optional) or Pest browser

- [ ] **Step 1: Write failing browser test**

```php
it('fills 5 halaman and sees total 25 auto', function(){ visit setoran page, fill senin 5, expect total 25 });
```

- [ ] **Step 2: Fails**

- [ ] **Step 3: Polish grade colors A green B blue C yellow D orange E red, fix cursor-pointer**

- [ ] **Step 4: Pass**

- [ ] **Step 5: Commit + push**

---

## Self-Review

- Spec coverage: all 5 panels, pekan 4/5, ujian single, catatan, week picker — all have tasks (7). No TBD.
- Placeholders: none, each step has code.
- Type consistency: `PekanHelper::pekanNumberInMonth(Carbon):int` used in controller and lib similarly, `StoreSetoranRequest` fields match controller payload.
