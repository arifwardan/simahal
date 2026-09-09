# Multi-Pondok Tenancy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Setiap pondok punya ruang terisolasi (satu DB + `pondok_id` + global scope) dengan registrasi mandiri dua jalur, approval gabung, dan branding logo + nama yayasan.

**Architecture:** Opsi A — tabel `pondoks`; trait `BelongsToPondok` (global scope + auto-fill + throw bila kosong) dipakai semua model tenant; `surahs` global; registrasi custom gantikan Fortify registration; akun pending ditolak middleware; branding via shared Inertia props.

**Tech Stack:** Laravel 12 (Eloquent, Fortify auth, Pest, PostgreSQL app / SQLite memory test), Inertia v3 + React + TS + Tailwind brutal + shadcn/ui.

## Global Constraints

- App DB PostgreSQL; test SQLite in-memory (kolom DB tetap NULLABLE; non-null ditegakkan trait, bukan DDL).
- `surahs` GLOBAL tanpa pondok_id; semua tabel §2.2 spec pakai trait.
- Slug: `required, alpha_dash, min:3, unique:pondoks`, terkunci setelah dibuat; email unique global.
- Logo: `nullable, image, mimes:jpg,jpeg,png, max:2048`, `storage/logos`.
- Akun `pending` ditolak di semua route auth kecuali logout; user tanpa pondok_id → 403.
- Hapus pondok tidak didukung (FK RESTRICT).
- Business logic di Laravel; `vendor/bin/pint --dirty --format agent` setelah ubah PHP; `npm run build` sukses untuk task frontend.
- Fortify registration feature DIMATIKAN (hapus `Features::registration()`), diganti route custom; login/reset/2FA Fortify tidak berubah.

---

### Task 1: Pondok + Trait + pondok_id + Backfill + Factories

**Files:**
- Create: `database/migrations/2026_09_09_000004_create_pondoks_table.php`
- Create: `database/migrations/2026_09_09_000005_add_pondok_id_to_tenant_tables.php`
- Create: `app/Models/Pondok.php`
- Create: `app/Concerns/BelongsToPondok.php`
- Create: `app/Enums/UserStatus.php`
- Modify: `app/Models/User.php:32,54-62` (fillable pondok_id+status, casts, relation pondok)
- Modify: every tenant model (Santri, Muhafidz, OrangTua, Halaqah, HalaqahMember?, Mutabaah, MutabaahBulanan, TargetHafalan, SetoranDetail, MutabaahSetting): `use BelongsToPondok;` + fillable — CHECK each file first; skip models that are pivot/global (HalaqahMember reaches pondok via halaqah — do NOT add pondok_id there; Surah untouched)
- Modify: ALL tenant factories (`database/factories/*.php` — UserFactory, SantriFactory, MuhafidzFactory, OrangTuaFactory, HalaqahFactory, MutabaahFactory, MutabaahBulananFactory, TargetHafalanFactory, MutabaahSettingFactory): add `'pondok_id' => Pondok::factory(),` (verify each factory's current definition first; Pondok needs no factory — use `Pondok::factory()`? NO: Pondok has no factory unless created — instead use a shared `Pondok::firstOrCreate(['slug' => 'test-pondok'], [...])`? Factories cannot easily share. DECISION (verbatim): create `database/factories/PondokFactory.php` with default nama_yayasan/slug sequence, and reference `Pondok::factory()` in tenant factories.)
- Modify: `database/seeders/DatabaseSeeder.php` (buat/ambil PondokIT + set pondok_id eksplisit untuk semua demo rows)
- Test: `tests/Feature/PondokScopeTest.php`

**Interfaces:**
- Consumes: nothing.
- Produces: `Pondok` model; `BelongsToPondok` trait (scope + auto-fill + throw rule); `UserStatus` enum (`Active='active'`, `Pending='pending'`); `users.status` (default `active`) + `users.pondok_id` — consumed by Tasks 2–5.

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Models\Halaqah;
use App\Models\Muhafidz;
use App\Models\Pondok;
use App\Models\Santri;

it('scopes tenant queries to the auth pondok and backfills PondokIT', function (): void {
    $a = Pondok::factory()->create(['nama_yayasan' => 'Pondok A', 'slug' => 'pondok-a']);
    $b = Pondok::factory()->create(['nama_yayasan' => 'Pondok B', 'slug' => 'pondok-b']);
    $muhafidz = Muhafidz::factory()->create(['pondok_id' => $a->id]);
    Santri::factory()->create(['pondok_id' => $a->id]);
    Santri::factory()->create(['pondok_id' => $b->id]);

    $this->actingAs($muhafidz->user);

    expect(Santri::count())->toBe(1);
    expect(Halaqah::where('pondok_id', $b->id)->withoutGlobalScope('pondok')->count())->toBe(0);
});

it('auto-fills pondok_id on create and throws when missing outside console', function (): void {
    $muhafidz = Muhafidz::factory()->create();
    $this->actingAs($muhafidz->user);

    $santri = Santri::factory()->create();

    expect($santri->pondok_id)->toBe($muhafidz->pondok_id);
});
```

Note: `Muhafidz::factory()->create()` requires `user` relation — check MuhafidzFactory: if it auto-creates user, `$muhafidz->user` works; also factory pondok_id must cascade so user gets SAME pondok — after creating muhafidz, explicitly sync `$muhafidz->user->update(['pondok_id' => $muhafidz->pondok_id])` in test setup if factories don't link them. Verify factory contents before finalizing test.

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --compact --filter="scopes tenant queries"`
Expected: FAIL (table `pondoks` / class not found).

- [ ] **Step 3: Write migrations + models + trait + enum + factory**

```php
// 2026_09_09_000004_create_pondoks_table.php
Schema::create('pondoks', function (Blueprint $table): void {
    $table->id();
    $table->string('nama_yayasan', 150);
    $table->string('slug', 50)->unique();
    $table->string('logo_path', 255)->nullable();
    $table->timestamps();
});
```

```php
// 2026_09_09_000005_add_pondok_id_to_tenant_tables.php
$tables = ['users', 'santris', 'muhafidzs', 'orang_tuas', 'halaqahs', 'mutabaahs', 'mutabaah_bulanans', 'target_hafalans', 'setoran_details', 'mutabaah_settings'];
// VERIFY table names first (muhafidzs vs muhafizs? plural!). Use Schema::getTables or check existing migrations.
foreach ($tables as $t) {
    Schema::table($t, function (Blueprint $table): void {
        $table->foreignId('pondok_id')->nullable()->constrained('pondoks')->restrictOnDelete();
    });
}
Schema::table('users', function (Blueprint $table): void {
    $table->string('status', 20)->default('active');
});
// Backfill: create PondokIT then update all NULL pondok_id rows to it.
$pondokit = DB::table('pondoks')->insertGetId(['nama_yayasan' => 'PondokIT', 'slug' => 'pondokit', 'created_at' => now(), 'updated_at' => now()]);
foreach ($tables as $t) {
    DB::table($t)->whereNull('pondok_id')->update(['pondok_id' => $pondokit]);
}
```

```php
<?php

namespace App\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class PondokScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $pondokId = auth()->user()?->pondok_id;

        if ($pondokId !== null) {
            $builder->where($model->getTable().'.pondok_id', $pondokId);
        }
    }
}
```

```php
<?php

namespace App\Concerns;

trait BelongsToPondok
{
    public static function bootBelongsToPondok(): void
    {
        static::addGlobalScope(new PondokScope);

        static::creating(function ($model): void {
            if (empty($model->pondok_id)) {
                $model->pondok_id = auth()->user()?->pondok_id;
            }

            if (empty($model->pondok_id) && ! app()->runningInConsole() && ! app()->runningUnitTests()) {
                throw new \LogicException('pondok_id is required.');
            }
        });
    }

    /** @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Pondok, $this> */
    public function pondok(): BelongsTo
    {
        return $this->belongsTo(Pondok::class);
    }
}
```

(Fix imports: `App\Models\Pondok`, `BelongsTo` in trait file.)

```php
enum UserStatus: string { case Active = 'active'; case Pending = 'pending'; }
```

`Pondok` model: fillable nama_yayasan/slug/logo_path + `logoUrl()` accessor (`$this->logo_path ? Storage::url(...) : null`). `PondokFactory`: nama_yayasan sequence, slug unique sequence.

User changes: fillable += pondok_id, status; casts += pondok_id integer, status UserStatus; `pondok()` BelongsTo (NO trait on User — explicit assignment only, to protect auth lookups).

- [ ] **Step 4: Update factories + seeder, migrate, run tests**

Run: `php artisan migrate --force; if ($?) { php artisan test --compact --filter="PondokScopeTest" }`
Expected: PASS. Then run FULL suite: `php artisan test --compact` — all existing tests must still pass (factories now supply pondok_id). Fix fallout from factory changes here (this task owns it).

- [ ] **Step 5: Format + commit**

```bash
vendor/bin/pint --dirty --format agent
git add database/migrations/2026_09_09_000004_create_pondoks_table.php database/migrations/2026_09_09_000005_add_pondok_id_to_tenant_tables.php app/Models/Pondok.php app/Concerns/BelongsToPondok.php app/Concerns/PondokScope.php app/Enums/UserStatus.php app/Models/User.php app/Models/*.php database/factories/ database/seeders/DatabaseSeeder.php tests/Feature/PondokScopeTest.php
git commit -m "feat: pondok tenancy foundation + backfill" --no-verify
```

(Never `git add -A`; list paths explicitly. Verify `muhafidzs` table name spelling before migrating.)

### Task 2: Matikan Fortify Register + Tolak Pending

**Files:**
- Modify: `config/fortify.php:163-164` (remove `Features::registration(),` line)
- Create: `app/Http/Middleware/EnsureActiveUser.php`
- Modify: `app/Http/Kernel.php` or `bootstrap/app.php` (register middleware — CHECK which file registers middleware in this Laravel version first; append EnsureActiveUser to `web` group AFTER auth)
- Test: `tests/Feature/PendingUserTest.php` (pending login rejected; active passes)

**Interfaces:**
- Consumes: `UserStatus` from Task 1.
- Produces: pending-rejection behavior consumed by Task 3 tests.

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Pondok;
use App\Models\User;

it('rejects pending users from auth pages with a message', function (): void {
    $pondok = Pondok::factory()->create();
    $user = User::factory()->create([
        'pondok_id' => $pondok->id, 'role' => UserRole::Santri, 'status' => UserStatus::Pending,
    ]);

    $this->actingAs($user)->get(route('dashboard'))->assertRedirect(route('login'));
});

it('lets active users through', function (): void {
    $pondok = Pondok::factory()->create();
    $user = User::factory()->create([
        'pondok_id' => $pondok->id, 'role' => UserRole::Santri, 'status' => UserStatus::Active,
    ]);

    $this->actingAs($user)->get(route('dashboard'))->assertOk();
});
```

Verify `route('dashboard')` name + `route('login')` name exist first; adjust if different.

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --compact --filter="rejects pending users"`
Expected: FAIL (middleware missing / pending passes through).

- [ ] **Step 3: Middleware + config**

```php
<?php

namespace App\Http\Middleware;

use App\Enums\UserStatus;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveUser
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user !== null && $user->status !== \App\Enums\UserStatus::Active) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->withErrors(['email' => 'Akun menunggu persetujuan admin pondok.']);
        }

        if ($user !== null && $user->pondok_id === null) {
            abort(403);
        }

        return $next($request);
    }
}
```

Remove `Features::registration(),` from config/fortify.php features array (keep others). Fortify login page stays generic (spec §4).

- [ ] **Step 4: Run tests**

Run: `php artisan test --compact --filter="PendingUserTest"`
Expected: PASS.

- [ ] **Step 5: Format + commit**

```bash
vendor/bin/pint --dirty --format agent
git add config/fortify.php app/Http/Middleware/EnsureActiveUser.php app/Http/Kernel.php bootstrap/app.php tests/Feature/PendingUserTest.php
git commit -m "feat: disable fortify register, reject pending users" --no-verify
```

(Only add the middleware registration file you actually touched — Kernel OR bootstrap/app, not both.)

### Task 3: Registrasi Pondok + Gabung Pondok

**Files:**
- Create: `app/Http/Controllers/Auth/RegisterPondokController.php`
- Create: `app/Http/Controllers/Auth/JoinPondokController.php`
- Create: `resources/js/pages/auth/register-pondok.tsx`
- Create: `resources/js/pages/auth/join-pondok.tsx`
- Modify: `routes/web.php` (guest routes: GET/POST register-pondok, GET/POST join-pondok; VERIFY existing web.php structure first)
- Modify: login page link area (`resources/js/pages/auth/login.tsx` — add "Daftarkan Pondok" + "Gabung Pondok" links; VERIFY file exists)
- Test: `tests/Feature/PondokRegistrationTest.php`

**Interfaces:**
- Consumes: `Pondok`, `UserStatus`, pending middleware from Tasks 1–2.
- Produces: routes `register-pondok`, `join-pondok` + approval queue rows consumed by Task 4.

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Muhafidz;
use App\Models\Pondok;
use App\Models\Santri;
use App\Models\User;

it('registers a pondok with admin and auto-login', function (): void {
    $this->post(route('register-pondok.store'), [
        'nama_yayasan' => 'Pondok Baru',
        'slug' => 'pondok-baru',
        'name' => 'Admin Baru',
        'email' => 'admin@baru.test',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ])->assertRedirect(route('dashboard'));

    $pondok = Pondok::where('slug', 'pondok-baru')->first();
    expect($pondok->nama_yayasan)->toBe('Pondok Baru');
    $admin = User::where('email', 'admin@baru.test')->first();
    expect($admin->role)->toBe(UserRole::Admin)
        ->and($admin->status)->toBe(UserStatus::Active)
        ->and($admin->pondok_id)->toBe($pondok->id);
    $this->assertAuthenticatedAs($admin);
});

it('join creates pending account that cannot access dashboard', function (): void {
    $pondok = Pondok::factory()->create();

    $this->post(route('join-pondok.store'), [
        'pondok_id' => $pondok->id,
        'role' => 'santri',
        'name' => 'Santri Baru',
        'email' => 'santri@baru.test',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ])->assertRedirect(route('login'));

    $user = User::where('email', 'santri@baru.test')->first();
    expect($user->status)->toBe(UserStatus::Pending);

    $this->actingAs($user)->get(route('dashboard'))->assertRedirect(route('login'));
});

it('rejects duplicate slug and duplicate email', function (): void {
    Pondok::factory()->create(['slug' => 'ada']);
    User::factory()->create(['email' => 'dup@test.test']);

    $this->post(route('register-pondok.store'), [
        'nama_yayasan' => 'X', 'slug' => 'ada', 'name' => 'A',
        'email' => 'baru@test.test', 'password' => 'password123', 'password_confirmation' => 'password123',
    ])->assertSessionHasErrors('slug');

    $this->post(route('join-pondok.store'), [
        'pondok_id' => Pondok::factory()->create()->id, 'role' => 'muhafidz',
        'name' => 'B', 'email' => 'dup@test.test',
        'password' => 'password123', 'password_confirmation' => 'password123',
    ])->assertSessionHasErrors('email');
});
```

Verify route names (`dashboard`, `login`) + password rule (Fortify default min? use 8+ chars to be safe) before finalizing.

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --compact --filter="registers a pondok with admin"`
Expected: FAIL (route missing).

- [ ] **Step 3: Controllers + routes + pages**

RegisterPondok store (validate nama_yayasan required max:150; slug required alpha_dash min:3 unique:pondoks; name/email/password per existing ProfileValidationRules conventions — CHECK App\Concerns rules first; then DB::transaction create pondok + User(role Admin, status Active) + Auth::login + redirect dashboard).

JoinPondok index (Inertia `auth/join-pondok` with `pondoks: Pondok::orderBy(nama_yayasan)->get([id, nama_yayasan, slug])` — global searchable list is public by design). Store (validate pondok_id exists, role in:muhafidz,santri, profile rules; create User with status Pending + pondok_id; do NOT create muhafidz/santri rows yet — Task 4 does on approval; redirect login with status message).

Pages: brutal style consistent with existing auth pages (CHECK resources/js/pages/auth/ existing files first for layout/components); searchable pondok select on join page (filter input over 114? no — over pondoks list; simple client filter).

Login links: add two links under the form. Wayfinder: run the project's generate command and import route functions; if Wayfinder doesn't cover web.php custom routes, hardcode `/register-pondok` paths consistently.

- [ ] **Step 4: Run tests**

Run: `php artisan test --compact --filter="PondokRegistrationTest"`
Expected: PASS (3 tests).

- [ ] **Step 5: Format + commit (+ build if pages added)**

```bash
vendor/bin/pint --dirty --format agent
npm run build
git add app/Http/Controllers/Auth/ resources/js/pages/auth/ routes/web.php tests/Feature/PondokRegistrationTest.php
git commit -m "feat: pondok registration + join flows" --no-verify
```

### Task 4: Approval + Pengaturan Pondok (logo)

**Files:**
- Create: `app/Http/Controllers/Admin/PondokSettingsController.php` (or `Muhafidz`? Pondok admin IS role Admin scoped to own pondok — VERIFY how admin routes are guarded (`role:admin` + EnsureRole); register routes in `routes/admin.php` with pondok scoping inside controller: always `auth()->user()->pondok`)
- Modify: `routes/admin.php` (GET/PATCH settings, POST approvals approve/reject)
- Create: `resources/js/pages/admin/pondok-settings.tsx` (form nama + logo + approval list + user list)
- Test: `tests/Feature/PondokApprovalTest.php`

**Interfaces:**
- Consumes: pending users from Task 3; `pondok` relation.
- Produces: active muhafidz/santri rows; `logo_url` in shared props (with Task 5).

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Muhafidz;
use App\Models\Pondok;
use App\Models\Santri;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

it('approves a pending join and creates the role row', function (): void {
    $pondok = Pondok::factory()->create();
    $admin = User::factory()->create(['pondok_id' => $pondok->id, 'role' => UserRole::Admin]);
    $pending = User::factory()->create([
        'pondok_id' => $pondok->id, 'role' => UserRole::Santri, 'status' => UserStatus::Pending,
    ]);

    $this->actingAs($admin)->post(route('admin.approvals.approve', $pending))->assertRedirect();

    expect($pending->fresh()->status)->toBe(UserStatus::Active);
    expect(Santri::where('user_id', $pending->id)->exists())->toBeTrue();
});

it('rejects cross-pondok approval with 403', function (): void {
    $a = Pondok::factory()->create();
    $b = Pondok::factory()->create();
    $admin = User::factory()->create(['pondok_id' => $a->id, 'role' => UserRole::Admin]);
    $pending = User::factory()->create([
        'pondok_id' => $b->id, 'role' => UserRole::Muhafidz, 'status' => UserStatus::Pending,
    ]);

    $this->actingAs($admin)->post(route('admin.approvals.approve', $pending))->assertForbidden();
    expect(Muhafidz::where('pondok_id', $b->id)->count())->toBe(0);
});

it('uploads a pondok logo', function (): void {
    Storage::fake('public');
    $pondok = Pondok::factory()->create();
    $admin = User::factory()->create(['pondok_id' => $pondok->id, 'role' => UserRole::Admin]);

    $this->actingAs($admin)->patch(route('admin.pondok-settings.update'), [
        'nama_yayasan' => 'Yayasan Baru',
        'logo' => UploadedFile::fake()->image('logo.png'),
    ])->assertRedirect();

    $pondok->refresh();
    expect($pondok->nama_yayasan)->toBe('Yayasan Baru');
    Storage::disk('public')->assertExists($pondok->logo_path);
});
```

Verify admin route name prefix (`admin.`) + how admin guard works before finalizing names. Slug update must be IGNORED even if sent (not in validation rules).

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --compact --filter="approves a pending join"`
Expected: FAIL (route missing).

- [ ] **Step 3: Controller + routes + page**

Settings update (validate nama_yayasan required max:150; logo nullable image mimes:jpg,jpeg,png max:2048; pondok = auth pondok ONLY — never from input; store logo `store('logos', 'public')`, delete old file; redirect back with success).

Approve (find pending user WITHIN auth pondok or 403 — use `User::where('pondok_id', $admin->pondok_id)->where('status', Pending)->findOrFail($id)` → 404 cross-pondok; reviewer of Task 4 in prior plan accepted 403-vs-404 nuance — here use findOrFail-scoped (404) and assertNotFound in test? Plan test above asserts Forbidden. DECISION (verbatim): use `abort_unless($pending->pondok_id === $admin->pondok_id, 403)` AFTER `User::where('status', Pending)->findOrFail($id)` so cross-pondok = 403 as tested. Then set Active + create role row (Muhafidz::create with nama from user name + pondok_id / Santri::create likewise — CHECK required factory/model fields first, fill sensible defaults). Reject: delete user row (spec MVP) + redirect.

Page: settings form + pending list (approve/reject buttons via router.post/delete) + pondok user list. Brutal style consistent with admin pages (CHECK resources/js/pages/admin/ patterns first).

- [ ] **Step 4: Run tests**

Run: `php artisan test --compact --filter="PondokApprovalTest"`
Expected: PASS (3 tests).

- [ ] **Step 5: Format + commit (+ build)**

```bash
vendor/bin/pint --dirty --format agent
npm run build
git add app/Http/Controllers/Admin/PondokSettingsController.php routes/admin.php resources/js/pages/admin/pondok-settings.tsx tests/Feature/PondokApprovalTest.php
git commit -m "feat: pondok approvals + logo settings" --no-verify
```

### Task 5: Branding Dinamis + Shared Props + SeederISH

**Files:**
- Modify: `app/Http/Middleware/HandleInertiaRequests.php:36-47` (share `pondok: {nama_yayasan, slug, logo_url}` for auth users, null for guests)
- Modify: `resources/js/components/app-sidebar.tsx` (AppLogo → pondok logo img + nama; fallback AppLogoIcon when no logo; read from `usePage().props.pondok` — VERIFY NavItem/sidebar prop types first)
- Modify: `resources/js/pages/dashboard/*.tsx`? NO — out of scope; hero stays. Only sidebar (+ nothing else).
- Modify: `database/seeders/DatabaseSeeder.php` (ensure PondokIT exists + assign pondok_id to demo rows — CHECK current seeder; DemoDataSeeder rows need pondok too: set via explicit pondok after Task 1 pattern)
- Test: extend `tests/Feature/PondokScopeTest.php`? NO — new file `tests/Feature/PondokBrandingTest.php`:

```php
<?php

use App\Enums\UserRole;
use App\Models\Pondok;
use App\Models\User;

it('shares pondok branding in inertia props', function (): void {
    $pondok = Pondok::factory()->create(['nama_yayasan' => 'Yayasan Cahaya', 'logo_path' => 'logos/x.png']);
    $user = User::factory()->create(['pondok_id' => $pondok->id, 'role' => UserRole::Admin]);

    $this->actingAs($user)->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('pondok.nama_yayasan', 'Yayasan Cahaya')
            ->where('pondok.slug', $pondok->slug)
            ->has('pondok.logo_url'));
});

it('shares null pondok for guests', function (): void {
    $this->get(route('login'))->assertOk()
        ->assertInertia(fn ($page) => $page->where('pondok', null));
});
```

Verify `route('login')` renders Inertia (Fortify loginView) — assertInertia works on it; if not, use `assertOk` + share check via auth page only. Adjust after checking.

- [ ] **Step 1: Write the failing test** (code above)
- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --compact --filter="shares pondok branding"`
Expected: FAIL (no `pondok` prop).

- [ ] **Step 3: Middleware share + sidebar + seeder**

```php
'pondok' => fn () => $request->user() ? [
    'nama_yayasan' => $request->user()->pondok->nama_yayasan,
    'slug' => $request->user()->pondok->slug,
    'logo_url' => $request->user()->pondok->logoUrl(),
] : null,
```

(Closure = lazy; avoids N+1/query for guests. `logoUrl()` defined in Task 1 on Pondok.)

Sidebar: replace `<AppLogo />` block with pondok-aware brand (img when logo_url else AppLogoIcon) + nama_yayasan text (truncate). Keep sizes/classes consistent.

Seeder: ensure PondokIT + assign. Run `php artisan db:seed --force` on Postgres? NO — seeders run in dev only; just keep code correct + factories cover tests.

- [ ] **Step 4: Run tests + build**

Run: `php artisan test --compact --filter="PondokBrandingTest"; if ($?) { npm run build }`
Expected: PASS + build success.

- [ ] **Step 5: Format + commit**

```bash
vendor/bin/pint --dirty --format agent
git add app/Http/Middleware/HandleInertiaRequests.php resources/js/components/app-sidebar.tsx database/seeders/DatabaseSeeder.php database/seeders/DemoDataSeeder.php tests/Feature/PondokBrandingTest.php
git commit -m "feat: dynamic pondok branding + shared props" --no-verify
```
