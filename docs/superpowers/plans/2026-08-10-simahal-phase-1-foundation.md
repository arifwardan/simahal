# SIMAHAL Phase 1: Foundation (Enums, Roles, Schema, Models, Factories, Seeders) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lay the entire data foundation for SIMAHAL: role system on `users`, enums, all domain tables/migrations, Eloquent models with relationships and casts, factories, a role-guarding middleware, and a seeder with one account per role.

**Architecture:** Single Eloquent models per PRD entity (`Santri`, `Ustadz`, `OrangTua`, `Halaqah`, `HalaqahMember`, `TargetHafalan`, `Mutabaah`), each backed by an Eloquent model with a `user_id` FK to `users`. Roles are a backed-string enum on `users.role`. Authorization uses a custom `role:` middleware alias so route groups can do `->middleware('role:admin')`.

**Tech Stack:** Laravel 13, PHP 8.5, Eloquent (string-backed enums cast on models), Pest + RefreshDatabase for tests, SQLite for dev/tests.

## Global Constraints

- Database: dev uses SQLite (`.env`), tests use in-memory SQLite (`phpunit.xml`). PRD lists PostgreSQL for production, but no migration code should be PostgreSQL-specific — keep column types portable (`string` for enum-ish codes, `integer` for counts).
- Follow the existing model style in `app/Models/User.php`: use the `#[Fillable]`, `#[Hidden]`, and `casts()` conventions (Laravel 13 attribute-based Eloquent).
- Every enum case name is TitleCase with a lowercase `value` for storage: `case Admin = 'admin'`.
- All tests are Pest and placed under `tests/Unit` or `tests/Feature`. Every task ends with passing tests.
- `users.role` default value is `UserRole::Santri`.
- Public registration stays enabled (Fortify) and creates Santri-role users; admins/ustadz/orang tua accounts are created by the seeder and (later) the admin CRUD.
- Run `vendor/bin/pint --dirty --format agent` after PHP edits in each task.

---

### Task 1: Enum classes

**Files:**
- Create: `app/Enums/UserRole.php`
- Create: `app/Enums/SantriStatus.php`
- Create: `app/Enums/HalaqahStatus.php`
- Create: `app/Enums/HalaqahMemberStatus.php`
- Create: `app/Enums/TargetHafalanStatus.php`
- Create: `app/Enums/MutabaahJenis.php`
- Create: `app/Enums/MutabaahStatus.php`
- Test: `tests/Unit/EnumsTest.php`

**Interfaces:**
- Consumes: nothing.
- Produces: `App\Enums\UserRole`, `App\Enums\SantriStatus`, `App\Enums\HalaqahStatus`, `App\Enums\HalaqahMemberStatus`, `App\Enums\TargetHafalanStatus`, `App\Enums\MutabaahJenis`, `App\Enums\MutabaahStatus`. Each is a backed-string enum (`enum X: string`) with a `label(): string` method returning the human-readable Indonesian label.

- [ ] **Step 1: Write the failing test**

Create `tests/Unit/EnumsTest.php`:

```php
<?php

use App\Enums\HalaqahMemberStatus;
use App\Enums\HalaqahStatus;
use App\Enums\MutabaahJenis;
use App\Enums\MutabaahStatus;
use App\Enums\SantriStatus;
use App\Enums\TargetHafalanStatus;
use App\Enums\UserRole;

test('user role enum has all SIMAHAL roles', function () {
    expect(UserRole::cases())
        ->toHaveCount(4)
        ->and(UserRole::Admin->value)->toBe('admin')
        ->and(UserRole::Ustadz->value)->toBe('ustadz')
        ->and(UserRole::Santri->value)->toBe('santri')
        ->and(UserRole::OrangTua->value)->toBe('orang_tua');
});

test('all enum cases have labels', function () {
    $all = [
        ...UserRole::cases(),
        ...SantriStatus::cases(),
        ...HalaqahStatus::cases(),
        ...HalaqahMemberStatus::cases(),
        ...TargetHafalanStatus::cases(),
        ...MutabaahJenis::cases(),
        ...MutabaahStatus::cases(),
    ];

    expect($all)->not->toBeEmpty();

    foreach ($all as $case) {
        expect($case->label())->toBeString()->not->toBeEmpty();
    }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --compact tests/Unit/EnumsTest.php`
Expected: FAIL — classes `App\Enums\UserRole` etc. not found.

- [ ] **Step 3: Write the enum classes**

Create `app/Enums/UserRole.php`:

```php
<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Ustadz = 'ustadz';
    case Santri = 'santri';
    case OrangTua = 'orang_tua';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Admin',
            self::Ustadz => 'Ustadz',
            self::Santri => 'Santri',
            self::OrangTua => 'Orang Tua',
        };
    }
}
```

Create `app/Enums/SantriStatus.php`:

```php
<?php

namespace App\Enums;

enum SantriStatus: string
{
    case Aktif = 'aktif';
    case Nonaktif = 'nonaktif';

    public function label(): string
    {
        return match ($this) {
            self::Aktif => 'Aktif',
            self::Nonaktif => 'Nonaktif',
        };
    }
}
```

Create `app/Enums/HalaqahStatus.php`:

```php
<?php

namespace App\Enums;

enum HalaqahStatus: string
{
    case Aktif = 'aktif';
    case Nonaktif = 'nonaktif';

    public function label(): string
    {
        return match ($this) {
            self::Aktif => 'Aktif',
            self::Nonaktif => 'Nonaktif',
        };
    }
}
```

Create `app/Enums/HalaqahMemberStatus.php`:

```php
<?php

namespace App\Enums;

enum HalaqahMemberStatus: string
{
    case Aktif = 'aktif';
    case Keluar = 'keluar';

    public function label(): string
    {
        return match ($this) {
            self::Aktif => 'Aktif',
            self::Keluar => 'Keluar',
        };
    }
}
```

Create `app/Enums/TargetHafalanStatus.php`:

```php
<?php

namespace App\Enums;

enum TargetHafalanStatus: string
{
    case Berlangsung = 'berlangsung';
    case Selesai = 'selesai';

    public function label(): string
    {
        return match ($this) {
            self::Berlangsung => 'Berlangsung',
            self::Selesai => 'Selesai',
        };
    }
}
```

Create `app/Enums/MutabaahJenis.php`:

```php
<?php

namespace App\Enums;

enum MutabaahJenis: string
{
    case Setoran = 'setoran';
    case Murajaah = 'murajaah';

    public function label(): string
    {
        return match ($this) {
            self::Setoran => 'Setoran',
            self::Murajaah => 'Murajaah',
        };
    }
}
```

Create `app/Enums/MutabaahStatus.php`:

```php
<?php

namespace App\Enums;

enum MutabaahStatus: string
{
    case Lulus = 'lulus';
    case PerluMurajaah = 'perlu_murajaah';
    case Mengulang = 'mengulang';

    public function label(): string
    {
        return match ($this) {
            self::Lulus => 'Lulus',
            self::PerluMurajaah => 'Perlu Murajaah',
            self::Mengulang => 'Mengulang',
        };
    }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `php artisan test --compact tests/Unit/EnumsTest.php`
Expected: PASS (2 tests).

- [ ] **Step 5: Format and commit**

```bash
vendor/bin/pint --dirty --format agent
git add app/Enums tests/Unit/EnumsTest.php
git commit -m "feat: add SIMAHAL enums"
```

---

### Task 2: Add role column to users

**Files:**
- Create: `database/migrations/<timestamp>_add_role_to_users_table.php`
- Modify: `app/Models/User.php`
- Test: `tests/Unit/EnumsTest.php` (extend) or new `tests/Feature/UserRoleTest.php`

**Interfaces:**
- Consumes: `App\Enums\UserRole` (Task 1).
- Produces: `users.role` string column defaulting to `santri`; `User` model casts `role` to `App\Enums\UserRole` and gains `hasRole(UserRole ...$roles): bool` and `roleLabel(): string` helper methods.

- [ ] **Step 1: Generate migration**

Run: `php artisan make:migration add_role_to_users_table --table=users --no-interaction`

- [ ] **Step 2: Write the migration**

Edit the generated file to:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('santri')->after('email');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }
};
```

- [ ] **Step 3: Run migration**

Run: `php artisan migrate --no-interaction`
Expected: `users.role` column exists.

- [ ] **Step 4: Update the User model**

Edit `app/Models/User.php`:

- Add `use App\Enums\UserRole;`
- Add `'role'` to the `#[Fillable]` list.
- Add `'role' => UserRole::class` to `casts()`.
- Add methods:

```php
public function hasRole(UserRole ...$roles): bool
{
    return in_array($this->role, $roles, true);
}

public function roleLabel(): string
{
    return $this->role->label();
}
```

- [ ] **Step 5: Write tests**

Create `tests/Feature/UserRoleTest.php`:

```php
<?php

use App\Enums\UserRole;
use App\Models\User;

test('user defaults to santri role', function () {
    $user = User::factory()->create();

    expect($user->role)->toBe(UserRole::Santri);
});

test('hasRole matches the assigned role', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);

    expect($admin->hasRole(UserRole::Admin))->toBeTrue()
        ->and($admin->hasRole(UserRole::Ustadz))->toBeFalse()
        ->and($admin->roleLabel())->toBe('Admin');
});
```

- [ ] **Step 6: Run tests to verify**

Run: `php artisan test --compact tests/Feature/UserRoleTest.php`
Expected: PASS.

- [ ] **Step 7: Format and commit**

```bash
vendor/bin/pint --dirty --format agent
git add database/migrations app/Models/User.php tests/Feature/UserRoleTest.php
git commit -m "feat: add role to users"
```

---

### Task 3: Domain migrations (7 tables)

**Files:**
- Create: `database/migrations/<ts1>_create_ustadzs_table.php`
- Create: `database/migrations/<ts2>_create_orang_tuas_table.php`
- Create: `database/migrations/<ts3>_create_santris_table.php`
- Create: `database/migrations/<ts4>_create_halaqahs_table.php`
- Create: `database/migrations/<ts5>_create_halaqah_members_table.php`
- Create: `database/migrations/<ts6>_create_target_hafalans_table.php`
- Create: `database/migrations/<ts7>_create_mutabaahs_table.php`
- Test: `tests/Feature/SchemaTest.php`

**Interfaces:**
- Consumes: none beyond Laravel Schema.
- Produces tables (note: `orang_tuas`, `santris` come before `halaqahs`/`mutabaahs` because of FK ordering):

| table | columns |
|---|---|
| `ustadzs` | `id`, `user_id` (FK unique), `nama`, `kontak` nullable, timestamps |
| `orang_tuas` | `id`, `user_id` (FK unique), `nama`, `kontak` nullable, timestamps |
| `santris` | `id`, `user_id` (FK unique), `orang_tua_id` (FK nullable), `nis` nullable unique, `nama`, `tanggal_lahir` nullable date, `status` default `aktif`, timestamps |
| `halaqahs` | `id`, `nama`, `ustadz_id` (FK), `jadwal` nullable, `status` default `aktif`, timestamps |
| `halaqah_members` | `id`, `halaqah_id` (FK), `santri_id` (FK), `joined_at` nullable date, `status` default `aktif`, unique(`halaqah_id`,`santri_id`), timestamps |
| `target_hafalans` | `id`, `santri_id` (FK), `periode`, `target` integer, `progress` integer default 0, `status` default `berlangsung`, timestamps |
| `mutabaahs` | `id`, `santri_id` (FK), `ustadz_id` (FK), `tanggal` date, `jenis` default `setoran`, `surah`, `ayat_mulai` integer, `ayat_selesai` integer, `nilai` integer nullable, `status` default `lulus`, `catatan` text nullable, timestamps |

All FK columns use `->constrained()` with `->cascadeOnDelete()`.

- [ ] **Step 1: Generate the migrations**

```bash
php artisan make:migration create_ustadzs_table --no-interaction
php artisan make:migration create_orang_tuas_table --no-interaction
php artisan make:migration create_santris_table --no-interaction
php artisan make:migration create_halaqahs_table --no-interaction
php artisan make:migration create_halaqah_members_table --no-interaction
php artisan make:migration create_target_hafalans_table --no-interaction
php artisan make:migration create_mutabaahs_table --no-interaction
```

- [ ] **Step 2: Fill in each migration**

`create_ustadzs_table`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ustadzs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('nama');
            $table->string('kontak')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ustadzs');
    }
};
```

`create_orang_tuas_table`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orang_tuas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('nama');
            $table->string('kontak')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orang_tuas');
    }
};
```

`create_santris_table`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('santris', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('orang_tua_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('nis')->nullable()->unique();
            $table->string('nama');
            $table->date('tanggal_lahir')->nullable();
            $table->string('status')->default('aktif');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('santris');
    }
};
```

`create_halaqahs_table`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('halaqahs', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->foreignId('ustadz_id')->constrained()->cascadeOnDelete();
            $table->string('jadwal')->nullable();
            $table->string('status')->default('aktif');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('halaqahs');
    }
};
```

`create_halaqah_members_table`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('halaqah_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('halaqah_id')->constrained()->cascadeOnDelete();
            $table->foreignId('santri_id')->constrained()->cascadeOnDelete();
            $table->date('joined_at')->nullable();
            $table->string('status')->default('aktif');
            $table->unique(['halaqah_id', 'santri_id']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('halaqah_members');
    }
};
```

`create_target_hafalans_table`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('target_hafalans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('santri_id')->constrained()->cascadeOnDelete();
            $table->string('periode');
            $table->integer('target');
            $table->integer('progress')->default(0);
            $table->string('status')->default('berlangsung');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('target_hafalans');
    }
};
```

`create_mutabaahs_table`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mutabaahs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('santri_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ustadz_id')->constrained()->cascadeOnDelete();
            $table->date('tanggal');
            $table->string('jenis')->default('setoran');
            $table->string('surah');
            $table->integer('ayat_mulai');
            $table->integer('ayat_selesai');
            $table->integer('nilai')->nullable();
            $table->string('status')->default('lulus');
            $table->text('catatan')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mutabaahs');
    }
};
```

- [ ] **Step 3: Run migrations**

Run: `php artisan migrate --no-interaction`
Expected: 7 new tables created.

- [ ] **Step 4: Write the schema test**

Create `tests/Feature/SchemaTest.php`:

```php
<?php

use Illuminate\Support\Facades\Schema;

test('all SIMAHAL domain tables exist', function () {
    $tables = ['ustadzs', 'orang_tuas', 'santris', 'halaqahs', 'halaqah_members', 'target_hafalans', 'mutabaahs'];

    foreach ($tables as $table) {
        expect(Schema::hasTable($table))->toBeTrue("table {$table} should exist");
    }
});
```

- [ ] **Step 5: Run tests to verify**

Run: `php artisan test --compact tests/Feature/SchemaTest.php`
Expected: PASS.

- [ ] **Step 6: Format and commit**

```bash
vendor/bin/pint --dirty --format agent
git add database/migrations tests/Feature/SchemaTest.php
git commit -m "feat: add SIMAHAL domain tables"
```

---

### Task 4: Domain Eloquent models

**Files:**
- Create: `app/Models/Ustadz.php`
- Create: `app/Models/OrangTua.php`
- Create: `app/Models/Santri.php`
- Create: `app/Models/Halaqah.php`
- Create: `app/Models/HalaqahMember.php`
- Create: `app/Models/TargetHafalan.php`
- Create: `app/Models/Mutabaah.php`
- Test: `tests/Feature/ModelRelationshipsTest.php`

**Interfaces:**
- Consumes: Task 2 (`User`), Task 3 tables.
- Produces models with these relationship method names (used by later tasks and factories):

| Model | Fillable | Relationships |
|---|---|---|
| `Ustadz` | `user_id`, `nama`, `kontak` | `user()`, `halaqahs()`, `mutabaahs()` |
| `OrangTua` | `user_id`, `nama`, `kontak` | `user()`, `santris()` |
| `Santri` | `user_id`, `orang_tua_id`, `nis`, `nama`, `tanggal_lahir`, `status` | `user()`, `orangTua()`, `halaqahs()`, `memberships()`, `targetHafalans()`, `mutabaahs()` |
| `Halaqah` | `nama`, `ustadz_id`, `jadwal`, `status` | `ustadz()`, `members()`, `santris()` |
| `HalaqahMember` | `halaqah_id`, `santri_id`, `joined_at`, `status` | `halaqah()`, `santri()` |
| `TargetHafalan` | `santri_id`, `periode`, `target`, `progress`, `status` | `santri()`, plus `progressPercent()` helper |
| `Mutabaah` | `santri_id`, `ustadz_id`, `tanggal`, `jenis`, `surah`, `ayat_mulai`, `ayat_selesai`, `nilai`, `status`, `catatan` | `santri()`, `ustadz()` |

`User` gains `santri()`, `ustadz()`, `orangTua()` (`hasOne`) in Step 3.

- [ ] **Step 1: Write the failing relationship test**

Create `tests/Feature/ModelRelationshipsTest.php`:

```php
<?php

use App\Enums\HalaqahStatus;
use App\Enums\SantriStatus;
use App\Enums\TargetHafalanStatus;
use App\Enums\UserRole;
use App\Models\Halaqah;
use App\Models\Mutabaah;
use App\Models\OrangTua;
use App\Models\Santri;
use App\Models\TargetHafalan;
use App\Models\Ustadz;
use App\Models\User;

test('user has one profile per role', function () {
    $user = User::factory()->create(['role' => UserRole::Ustadz]);
    $ustadz = Ustadz::factory()->create(['user_id' => $user->id]);

    expect($user->ustadz->id)->toBe($ustadz->id);
});

test('santri belongs to user, ustadz and orang tua', function () {
    $user = User::factory()->create(['role' => UserRole::Santri]);
    $santri = Santri::factory()->create(['user_id' => $user->id]);
    $ustadz = Ustadz::factory()->create();
    $orangTua = OrangTua::factory()->create();

    $santri->update(['orang_tua_id' => $orangTua->id]);

    expect($santri->user->id)->toBe($user->id)
        ->and($santri->orangTua->id)->toBe($orangTua->id);
});

test('halaqah belongs to ustadz and has many santri through members', function () {
    $ustadz = Ustadz::factory()->create();
    $halaqah = Halaqah::factory()->create(['ustadz_id' => $ustadz->id]);

    $santriA = Santri::factory()->create();
    $santriB = Santri::factory()->create();

    $halaqah->santris()->attach([$santriA->id, $santriB->id]);

    expect($halaqah->ustadz->id)->toBe($ustadz->id)
        ->and($halaqah->santris)->toHaveCount(2)
        ->and($santriA->halaqahs)->toHaveCount(1);
});

test('target hafalan belongs to santri and reports progress percent', function () {
    $santri = Santri::factory()->create();
    $target = TargetHafalan::factory()->create([
        'santri_id' => $santri->id,
        'target' => 120,
        'progress' => 30,
    ]);

    expect($target->santri->id)->toBe($santri->id)
        ->and($target->progressPercent())->toBe(25);
});

test('mutabaah belongs to santri and ustadz', function () {
    $santri = Santri::factory()->create();
    $ustadz = Ustadz::factory()->create();
    $mutabaah = Mutabaah::factory()->create([
        'santri_id' => $santri->id,
        'ustadz_id' => $ustadz->id,
    ]);

    expect($mutabaah->santri->id)->toBe($santri->id)
        ->and($mutabaah->ustadz->id)->toBe($ustadz->id);
});

test('santri status and halaqah status enum casts work', function () {
    $santri = Santri::factory()->create(['status' => SantriStatus::Aktif]);
    $halaqah = Halaqah::factory()->create(['status' => HalaqahStatus::Aktif]);
    $target = TargetHafalan::factory()->create(['status' => TargetHafalanStatus::Berlangsung]);

    expect($santri->status)->toBe(SantriStatus::Aktif)
        ->and($halaqah->status)->toBe(HalaqahStatus::Aktif)
        ->and($target->status)->toBe(TargetHafalanStatus::Berlangsung);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --compact tests/Feature/ModelRelationshipsTest.php`
Expected: FAIL — classes/factories not found.

- [ ] **Step 3: Create the models**

Use `php artisan make:model Ustadz --no-interaction` for each, then replace content.

`app/Models/Ustadz.php`:

```php
<?php

namespace App\Models;

use Database\Factories\UstadzFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $user_id
 * @property string $nama
 * @property string|null $kontak
 */
#[Fillable(['user_id', 'nama', 'kontak'])]
class Ustadz extends Model
{
    /** @use HasFactory<UstadzFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<Halaqah, $this>
     */
    public function halaqahs(): HasMany
    {
        return $this->hasMany(Halaqah::class);
    }

    /**
     * @return HasMany<Mutabaah, $this>
     */
    public function mutabaahs(): HasMany
    {
        return $this->hasMany(Mutabaah::class);
    }
}
```

`app/Models/OrangTua.php`:

```php
<?php

namespace App\Models;

use Database\Factories\OrangTuaFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $user_id
 * @property string $nama
 * @property string|null $kontak
 */
#[Fillable(['user_id', 'nama', 'kontak'])]
class OrangTua extends Model
{
    /** @use HasFactory<OrangTuaFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<Santri, $this>
     */
    public function santris(): HasMany
    {
        return $this->hasMany(Santri::class);
    }
}
```

`app/Models/Santri.php`:

```php
<?php

namespace App\Models;

use App\Enums\SantriStatus;
use Database\Factories\SantriFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property int|null $orang_tua_id
 * @property string|null $nis
 * @property string $nama
 * @property Carbon|null $tanggal_lahir
 * @property SantriStatus $status
 */
#[Fillable(['user_id', 'orang_tua_id', 'nis', 'nama', 'tanggal_lahir', 'status'])]
class Santri extends Model
{
    /** @use HasFactory<SantriFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tanggal_lahir' => 'date',
            'status' => SantriStatus::class,
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<OrangTua, $this>
     */
    public function orangTua(): BelongsTo
    {
        return $this->belongsTo(OrangTua::class);
    }

    /**
     * @return BelongsToMany<Halaqah, $this>
     */
    public function halaqahs(): BelongsToMany
    {
        return $this->belongsToMany(Halaqah::class, 'halaqah_members')
            ->using(HalaqahMember::class)
            ->withPivot('joined_at', 'status')
            ->withTimestamps();
    }

    /**
     * @return HasMany<HalaqahMember, $this>
     */
    public function memberships(): HasMany
    {
        return $this->hasMany(HalaqahMember::class);
    }

    /**
     * @return HasMany<TargetHafalan, $this>
     */
    public function targetHafalans(): HasMany
    {
        return $this->hasMany(TargetHafalan::class);
    }

    /**
     * @return HasMany<Mutabaah, $this>
     */
    public function mutabaahs(): HasMany
    {
        return $this->hasMany(Mutabaah::class);
    }
}
```

`app/Models/Halaqah.php`:

```php
<?php

namespace App\Models;

use App\Enums\HalaqahStatus;
use Database\Factories\HalaqahFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $nama
 * @property int $ustadz_id
 * @property string|null $jadwal
 * @property HalaqahStatus $status
 */
#[Fillable(['nama', 'ustadz_id', 'jadwal', 'status'])]
class Halaqah extends Model
{
    /** @use HasFactory<HalaqahFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => HalaqahStatus::class,
        ];
    }

    /**
     * @return BelongsTo<Ustadz, $this>
     */
    public function ustadz(): BelongsTo
    {
        return $this->belongsTo(Ustadz::class);
    }

    /**
     * @return HasMany<HalaqahMember, $this>
     */
    public function members(): HasMany
    {
        return $this->hasMany(HalaqahMember::class);
    }

    /**
     * @return BelongsToMany<Santri, $this>
     */
    public function santris(): BelongsToMany
    {
        return $this->belongsToMany(Santri::class, 'halaqah_members')
            ->using(HalaqahMember::class)
            ->withPivot('joined_at', 'status')
            ->withTimestamps();
    }
}
```

`app/Models/HalaqahMember.php`:

```php
<?php

namespace App\Models;

use App\Enums\HalaqahMemberStatus;
use Database\Factories\HalaqahMemberFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Support\Carbon;

/**
 * @property int $halaqah_id
 * @property int $santri_id
 * @property Carbon|null $joined_at
 * @property HalaqahMemberStatus $status
 */
#[Fillable(['halaqah_id', 'santri_id', 'joined_at', 'status'])]
class HalaqahMember extends Pivot
{
    /** @use HasFactory<HalaqahMemberFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'joined_at' => 'date',
            'status' => HalaqahMemberStatus::class,
        ];
    }

    /**
     * @return BelongsTo<Halaqah, $this>
     */
    public function halaqah(): BelongsTo
    {
        return $this->belongsTo(Halaqah::class);
    }

    /**
     * @return BelongsTo<Santri, $this>
     */
    public function santri(): BelongsTo
    {
        return $this->belongsTo(Santri::class);
    }
}
```

`app/Models/TargetHafalan.php`:

```php
<?php

namespace App\Models;

use App\Enums\TargetHafalanStatus;
use Database\Factories\TargetHafalanFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $santri_id
 * @property string $periode
 * @property int $target
 * @property int $progress
 * @property TargetHafalanStatus $status
 */
#[Fillable(['santri_id', 'periode', 'target', 'progress', 'status'])]
class TargetHafalan extends Model
{
    /** @use HasFactory<TargetHafalanFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => TargetHafalanStatus::class,
        ];
    }

    /**
     * @return BelongsTo<Santri, $this>
     */
    public function santri(): BelongsTo
    {
        return $this->belongsTo(Santri::class);
    }

    public function progressPercent(): int
    {
        if ($this->target <= 0) {
            return 0;
        }

        return (int) floor(($this->progress / $this->target) * 100);
    }
}
```

`app/Models/Mutabaah.php`:

```php
<?php

namespace App\Models;

use App\Enums\MutabaahJenis;
use App\Enums\MutabaahStatus;
use Database\Factories\MutabaahFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $santri_id
 * @property int $ustadz_id
 * @property Carbon $tanggal
 * @property MutabaahJenis $jenis
 * @property string $surah
 * @property int $ayat_mulai
 * @property int $ayat_selesai
 * @property int|null $nilai
 * @property MutabaahStatus $status
 * @property string|null $catatan
 */
#[Fillable(['santri_id', 'ustadz_id', 'tanggal', 'jenis', 'surah', 'ayat_mulai', 'ayat_selesai', 'nilai', 'status', 'catatan'])]
class Mutabaah extends Model
{
    /** @use HasFactory<MutabaahFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
            'jenis' => MutabaahJenis::class,
            'status' => MutabaahStatus::class,
        ];
    }

    /**
     * @return BelongsTo<Santri, $this>
     */
    public function santri(): BelongsTo
    {
        return $this->belongsTo(Santri::class);
    }

    /**
     * @return BelongsTo<Ustadz, $this>
     */
    public function ustadz(): BelongsTo
    {
        return $this->belongsTo(Ustadz::class);
    }
}
```

Then update `app/Models/User.php` with the three `hasOne` relationships:

```php
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * @return HasOne<Santri, $this>
 */
public function santri(): HasOne
{
    return $this->hasOne(Santri::class);
}

/**
 * @return HasOne<Ustadz, $this>
 */
public function ustadz(): HasOne
{
    return $this->hasOne(Ustadz::class);
}

/**
 * @return HasOne<OrangTua, $this>
 */
public function orangTua(): HasOne
{
    return $this->hasOne(OrangTua::class);
}
```

- [ ] **Step 4: Run test to verify it fails (factories missing)**

Run: `php artisan test --compact tests/Feature/ModelRelationshipsTest.php`
Expected: FAIL — factory classes `Database\Factories\UstadzFactory` etc. not found. Continue to Task 5.

---

### Task 5: Factories for domain models

**Files:**
- Create: `database/factories/UstadzFactory.php`
- Create: `database/factories/OrangTuaFactory.php`
- Create: `database/factories/SantriFactory.php`
- Create: `database/factories/HalaqahFactory.php`
- Create: `database/factories/HalaqahMemberFactory.php`
- Create: `database/factories/TargetHafalanFactory.php`
- Create: `database/factories/MutabaahFactory.php`
- Modify: `database/factories/UserFactory.php`
- Test: `tests/Feature/ModelRelationshipsTest.php` (finish)

**Interfaces:**
- Consumes: Task 4 models.
- Produces factories matching the model fillables, with sensible Faker data, and `UserFactory` gained a `role(UserRole $role)` state method.

- [ ] **Step 1: Update UserFactory with a role state**

Edit `database/factories/UserFactory.php` — add `use App\Enums\UserRole;`, add `'role' => UserRole::Santri` to the definition array, and add a state method:

```php
public function role(UserRole $role): static
{
    return $this->state(fn (array $attributes) => [
        'role' => $role,
    ]);
}
```

- [ ] **Step 2: Create the factories**

`database/factories/UstadzFactory.php`:

```php
<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\Ustadz;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Ustadz>
 */
class UstadzFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->role(UserRole::Ustadz),
            'nama' => fake()->name(),
            'kontak' => fake()->phoneNumber(),
        ];
    }
}
```

`database/factories/OrangTuaFactory.php`:

```php
<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\OrangTua;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OrangTua>
 */
class OrangTuaFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->role(UserRole::OrangTua),
            'nama' => fake()->name(),
            'kontak' => fake()->phoneNumber(),
        ];
    }
}
```

`database/factories/SantriFactory.php`:

```php
<?php

namespace Database\Factories;

use App\Enums\SantriStatus;
use App\Enums\UserRole;
use App\Models\Santri;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Santri>
 */
class SantriFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->role(UserRole::Santri),
            'orang_tua_id' => null,
            'nis' => (string) fake()->unique()->numberBetween(100000, 999999),
            'nama' => fake()->name(),
            'tanggal_lahir' => fake()->date(),
            'status' => SantriStatus::Aktif,
        ];
    }
}
```

`database/factories/HalaqahFactory.php`:

```php
<?php

namespace Database\Factories;

use App\Enums\HalaqahStatus;
use App\Models\Halaqah;
use App\Models\Ustadz;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Halaqah>
 */
class HalaqahFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nama' => 'Halaqah '.fake()->word(),
            'ustadz_id' => Ustadz::factory(),
            'jadwal' => fake()->sentence(3),
            'status' => HalaqahStatus::Aktif,
        ];
    }
}
```

`database/factories/HalaqahMemberFactory.php`:

```php
<?php

namespace Database\Factories;

use App\Enums\HalaqahMemberStatus;
use App\Models\Halaqah;
use App\Models\HalaqahMember;
use App\Models\Santri;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<HalaqahMember>
 */
class HalaqahMemberFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'halaqah_id' => Halaqah::factory(),
            'santri_id' => Santri::factory(),
            'joined_at' => now(),
            'status' => HalaqahMemberStatus::Aktif,
        ];
    }
}
```

`database/factories/TargetHafalanFactory.php`:

```php
<?php

namespace Database\Factories;

use App\Enums\TargetHafalanStatus;
use App\Models\Santri;
use App\Models\TargetHafalan;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TargetHafalan>
 */
class TargetHafalanFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'santri_id' => Santri::factory(),
            'periode' => now()->year.'-'.(now()->year + 1),
            'target' => fake()->numberBetween(30, 600),
            'progress' => 0,
            'status' => TargetHafalanStatus::Berlangsung,
        ];
    }
}
```

`database/factories/MutabaahFactory.php`:

```php
<?php

namespace Database\Factories;

use App\Enums\MutabaahJenis;
use App\Enums\MutabaahStatus;
use App\Models\Mutabaah;
use App\Models\Santri;
use App\Models\Ustadz;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Mutabaah>
 */
class MutabaahFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $mulai = fake()->numberBetween(1, 250);

        return [
            'santri_id' => Santri::factory(),
            'ustadz_id' => Ustadz::factory(),
            'tanggal' => now(),
            'jenis' => MutabaahJenis::Setoran,
            'surah' => 'Al-Baqarah',
            'ayat_mulai' => $mulai,
            'ayat_selesai' => $mulai + fake()->numberBetween(1, 20),
            'nilai' => fake()->numberBetween(60, 100),
            'status' => MutabaahStatus::Lulus,
            'catatan' => null,
        ];
    }
}
```

- [ ] **Step 3: Run the relationship tests**

Run: `php artisan test --compact tests/Feature/ModelRelationshipsTest.php`
Expected: PASS.

- [ ] **Step 4: Format and commit**

```bash
vendor/bin/pint --dirty --format agent
git add database/factories app/Models/User.php tests/Feature/ModelRelationshipsTest.php
git commit -m "feat: add domain model factories"
```

---

### Task 6: Role-guarding middleware

**Files:**
- Create: `app/Http/Middleware/EnsureRole.php`
- Modify: `bootstrap/app.php`
- Test: `tests/Feature/EnsureRoleTest.php`

**Interfaces:**
- Consumes: `App\Enums\UserRole` (Task 1).
- Produces middleware alias `role` that accepts one or more role values (`'role:admin'`, `'role:admin,ustadz'`).

- [ ] **Step 1: Write the failing test**

Create `tests/Feature/EnsureRoleTest.php`:

```php
<?php

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Support\Facades\Route;

beforeEach(function () {
    Route::middleware(['auth', 'role:admin'])->get('/_admin-only', fn () => 'ok');
});

test('admin can access admin-only route', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);

    $this->actingAs($admin)->get('/_admin-only')
        ->assertOk()
        ->assertSee('ok');
});

test('non-admin is forbidden from admin-only route', function () {
    $ustadz = User::factory()->create(['role' => UserRole::Ustadz]);

    $this->actingAs($ustadz)->get('/_admin-only')
        ->assertForbidden();
});

test('guest is redirected to login on protected route', function () {
    $this->get('/_admin-only')
        ->assertRedirect(route('login'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --compact tests/Feature/EnsureRoleTest.php`
Expected: FAIL — `Target class [role] does not exist` (unknown middleware alias).

- [ ] **Step 3: Create the middleware**

Run: `php artisan make:middleware EnsureRole --no-interaction`, then replace content:

```php
<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    /**
     * @param  array<int, string>  $roles
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if ($user === null || ! $user->hasRole(...array_map(fn (string $role) => UserRole::from($role), $roles))) {
            abort(403);
        }

        return $next($request);
    }
}
```

- [ ] **Step 4: Register the alias in bootstrap/app.php**

Edit `bootstrap/app.php` — inside the `withMiddleware` closure. The current file has:

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);
```

add after the `encryptCookies` line:

```php
    $middleware->alias([
        'role' => \App\Http\Middleware\EnsureRole::class,
    ]);
```

- [ ] **Step 5: Run tests to verify**

Run: `php artisan test --compact tests/Feature/EnsureRoleTest.php`
Expected: PASS.

- [ ] **Step 6: Format and commit**

```bash
vendor/bin/pint --dirty --format agent
git add app/Http/Middleware/EnsureRole.php bootstrap/app.php tests/Feature/EnsureRoleTest.php
git commit -m "feat: add role middleware"
```

---

### Task 7: Seed demo accounts and domain data

**Files:**
- Modify: `database/seeders/DatabaseSeeder.php`
- Test: `tests/Feature/DatabaseSeederTest.php`

**Interfaces:**
- Consumes: all factories (Task 5) and enums (Task 1).
- Produces a seeded database with one account per role (admin, ustadz, santri, orang tua), plus one halaqah, one target hafalan, and a sample mutabaah, all interconnected.

- [ ] **Step 1: Write the failing test**

Create `tests/Feature/DatabaseSeederTest.php`:

```php
<?php

use App\Enums\UserRole;
use App\Models\Halaqah;
use App\Models\Mutabaah;
use App\Models\OrangTua;
use App\Models\Santri;
use App\Models\Ustadz;
use Illuminate\Foundation\Testing\RefreshDatabase;

test('seeder creates one account of each role', function () {
    $this->seed();

    expect(UserRole::cases())->each(fn ($role) => expect(
        \App\Models\User::where('role', $role->value)->count()
    )->toBeGreaterThanOrEqual(1));
});

test('seeder creates interconnected demo data', function () {
    $this->seed();

    expect(Ustadz::count())->toBeGreaterThanOrEqual(1)
        ->and(Santri::count())->toBeGreaterThanOrEqual(1)
        ->and(OrangTua::count())->toBeGreaterThanOrEqual(1)
        ->and(Halaqah::count())->toBeGreaterThanOrEqual(1)
        ->and(Mutabaah::count())->toBeGreaterThanOrEqual(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --compact tests/Feature/DatabaseSeederTest.php`
Expected: FAIL — only the default `Test User` (santri) exists; admin etc. counts are 0.

- [ ] **Step 3: Rewrite the DatabaseSeeder**

Replace `database/seeders/DatabaseSeeder.php`:

```php
<?php

namespace Database\Seeders;

use App\Enums\HalaqahStatus;
use App\Enums\MutabaahJenis;
use App\Enums\MutabaahStatus;
use App\Enums\TargetHafalanStatus;
use App\Enums\UserRole;
use App\Models\Halaqah;
use App\Models\Mutabaah;
use App\Models\OrangTua;
use App\Models\Santri;
use App\Models\TargetHafalan;
use App\Models\Ustadz;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $admin = User::factory()->role(UserRole::Admin)->create([
            'name' => 'Admin SIMAHAL',
            'email' => 'admin@simahal.test',
        ]);

        $ustadzUser = User::factory()->role(UserRole::Ustadz)->create([
            'name' => 'Ustadz Ahmad',
            'email' => 'ustadz@simahal.test',
        ]);
        $ustadz = Ustadz::factory()->create([
            'user_id' => $ustadzUser->id,
            'nama' => 'Ustadz Ahmad',
            'kontak' => '081234567890',
        ]);

        $santriUser = User::factory()->role(UserRole::Santri)->create([
            'name' => 'Santri Budi',
            'email' => 'santri@simahal.test',
        ]);
        $santri = Santri::factory()->create([
            'user_id' => $santriUser->id,
            'nis' => '2024001',
            'nama' => 'Santri Budi',
            'tanggal_lahir' => '2012-05-14',
        ]);

        $orangTuaUser = User::factory()->role(UserRole::OrangTua)->create([
            'name' => 'Bapak Budi',
            'email' => 'ortu@simahal.test',
        ]);
        $orangTua = OrangTua::factory()->create([
            'user_id' => $orangTuaUser->id,
            'nama' => 'Bapak Budi',
            'kontak' => '089876543210',
        ]);

        $santri->update(['orang_tua_id' => $orangTua->id]);

        $halaqah = Halaqah::factory()->create([
            'nama' => 'Halaqah Fajar',
            'ustadz_id' => $ustadz->id,
            'jadwal' => 'Setiap pagi setelah Subuh, Masjid PondokIT',
            'status' => HalaqahStatus::Aktif,
        ]);

        $halaqah->santris()->attach($santri->id, ['joined_at' => now(), 'status' => 'aktif']);

        TargetHafalan::factory()->create([
            'santri_id' => $santri->id,
            'periode' => now()->year.'-'.(now()->year + 1),
            'target' => 1140,
            'progress' => 0,
            'status' => TargetHafalanStatus::Berlangsung,
        ]);

        Mutabaah::factory()->create([
            'santri_id' => $santri->id,
            'ustadz_id' => $ustadz->id,
            'tanggal' => now(),
            'jenis' => MutabaahJenis::Setoran,
            'surah' => 'Al-Fatihah',
            'ayat_mulai' => 1,
            'ayat_selesai' => 7,
            'nilai' => 95,
            'status' => MutabaahStatus::Lulus,
            'catatan' => 'Lancar, tajwid baik.',
        ]);
    }
}
```

- [ ] **Step 4: Run tests to verify**

Run: `php artisan test --compact tests/Feature/DatabaseSeederTest.php`
Expected: PASS. Then run the full suite once:

Run: `php artisan test --compact`
Expected: all green.

- [ ] **Step 5: Format and commit**

```bash
vendor/bin/pint --dirty --format agent
git add database/seeders tests/Feature/DatabaseSeederTest.php
git commit -m "feat: seed demo accounts and data"
```

---

## Self-Review

1. **Spec coverage:** Covers PRD §3 (roles), §4 (core data model entities), §2 (Eloquent). Auth/login already exists from the starter kit and PRD §5 login flow is unchanged.
2. **Placeholder scan:** No TBDs. Migration timestamps use `<ts*>` placeholders which resolve when `make:migration` stamps them — spelled out per migration.
3. **Type consistency:** Model relationship names in Task 4 match the test in Task 4 and factories in Task 5. `progressPercent`, `hasRole`, `roleLabel` are defined where used.