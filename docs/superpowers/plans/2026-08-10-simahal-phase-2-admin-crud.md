# SIMAHAL Phase 2: Admin CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the admin management module: CRUD for users, santri, ustadz, orang tua, and halaqah (including halaqah members), all admin-only, with server-side role authorization and Inertia React UIs matching the starter-kit conventions.

**Architecture:** One resource controller per entity under `App\Http\Controllers\Admin\`, thin and backed by FormRequests. All admin routes live in `routes/admin.php` inside a `role:admin` middleware group. Profile entities (santri/ustadz/orang tua) manage their linked `User` account inline. A separate user-management page handles role assignment and generic account creation.

**Tech Stack:** Laravel 13, Inertia v3 + React 19 + TypeScript, shadcn/ui, Wayfinder generated actions/routes, Pest.

## Global Constraints

- Every admin route requires `middleware(['auth', 'verified', 'role:admin'])`.
- Follow existing conventions: `Inertia::render` pages, `Inertia::flash('toast', ...)` for feedback, FormRequests, `InputError` for error display.
- Use the existing `Form` + Wayfinder `action.form()` pattern (see `resources/js/pages/settings/profile.tsx`) for all non-GET forms and `Link` with wayfinder route functions for navigation.
- Indonesian labels and UI copy (PRD is Indonesian).
- Pages use the automatic `AppLayout` (no page layout block). Set `page.layout = { breadcrumbs: [...] }` like `dashboard.tsx`.
- Wayfinder must regenerate after adding PHP routes/actions: run `php artisan wayfinder:generate` so `resources/js/actions` and `resources/js/routes` update; TypeScript errors until regenerated. Delete stale generated files after renames.
- Run `vendor/bin/pint --dirty --format agent` after PHP edits.
- No `table.tsx` exists yet; build list tables with `card.tsx`, `badge.tsx`, and simple rows.

---

### Task 1: User management (admin)

**Files:**
- Create: `routes/admin.php`
- Modify: `routes/web.php`
- Create: `app/Http/Controllers/Admin/UserController.php`
- Create: `app/Http/Requests/Admin/User/StoreUserRequest.php`
- Create: `app/Http/Requests/Admin/User/UpdateUserRequest.php`
- Create: `resources/js/pages/admin/users/index.tsx`
- Test: `tests/Feature/Admin/UserManagementTest.php`

**Interfaces:**
- Consumes: `App\Enums\UserRole`, `App\Models\User`, `role` middleware (Phase 1).
- Produces routes `admin.users.index|store|update|destroy`, admin route group prefix `admin`, and page `resources/js/pages/admin/users/index.tsx` receiving props `users` (paginated `{ data, from, to, total, links }`) and `roles` (`Array<{ value, label }>`).

- [ ] **Step 1: Write the failing feature test**

Create `tests/Feature/Admin/UserManagementTest.php`:

```php
<?php

use App\Enums\UserRole;
use App\Models\User;

test('only admins can access the user list', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    $this->actingAs($admin)->get(route('admin.users.index'))->assertOk();
});

test('non-admin cannot access the user list', function () {
    $ustadz = User::factory()->create(['role' => UserRole::Ustadz]);
    $this->actingAs($ustadz)->get(route('admin.users.index'))->assertForbidden();
});

test('admin can create a user with a role', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);

    $this->actingAs($admin)->post(route('admin.users.store'), [
        'name' => 'New User',
        'email' => 'new@simahal.test',
        'password' => 'password',
        'role' => UserRole::Ustadz->value,
    ])->assertRedirect(route('admin.users.index'));

    $this->assertDatabaseHas('users', [
        'email' => 'new@simahal.test',
        'role' => UserRole::Ustadz->value,
    ]);
});

test('admin can update a user role', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    $user = User::factory()->create(['role' => UserRole::Santri]);

    $this->actingAs($admin)->patch(route('admin.users.update', $user), [
        'name' => $user->name,
        'email' => $user->email,
        'role' => UserRole::OrangTua->value,
    ])->assertRedirect(route('admin.users.index'));

    expect($user->fresh()->role)->toBe(UserRole::OrangTua);
});

test('admin cannot delete themselves', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);

    $this->actingAs($admin)->delete(route('admin.users.destroy', $admin))
        ->assertForbidden();

    expect($admin->fresh())->not->toBeNull();
});

test('admin can delete another user', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    $other = User::factory()->create(['role' => UserRole::Santri]);

    $this->actingAs($admin)->delete(route('admin.users.destroy', $other))
        ->assertRedirect(route('admin.users.index'));

    expect($other->fresh())->toBeNull();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --compact tests/Feature/Admin/UserManagementTest.php`
Expected: FAIL — route `admin.users.index` not defined.

- [ ] **Step 3: Create the admin routes file**

Create `routes/admin.php`:

```php
<?php

use App\Http\Controllers\Admin\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('users', [UserController::class, 'index'])->name('users.index');
    Route::post('users', [UserController::class, 'store'])->name('users.store');
    Route::patch('users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
});
```

- [ ] **Step 4: Register the routes file**

Edit `routes/web.php` — add at the very end:

```php
require __DIR__.'/admin.php';
```

- [ ] **Step 5: Create the FormRequests**

Create `app/Http/Requests/Admin/User/StoreUserRequest.php`:

```php
<?php

namespace App\Http\Requests\Admin\User;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', Password::min(8)],
            'role' => ['required', new Enum(UserRole::class)],
        ];
    }
}
```

Create `app/Http/Requests/Admin/User/UpdateUserRequest.php`:

```php
<?php

namespace App\Http\Requests\Admin\User;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

class UpdateUserRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $user = $this->route('user');

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'role' => ['required', new Enum(UserRole::class)],
        ];
    }
}
```

- [ ] **Step 6: Create the controller**

Create `app/Http/Controllers/Admin/UserController.php`:

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\User\StoreUserRequest;
use App\Http\Requests\Admin\User\UpdateUserRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $users = User::query()
            ->with(['santri', 'ustadz', 'orangTua'])
            ->orderBy('name')
            ->paginate(15);

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'roles' => collect(UserRole::cases())->map(fn (UserRole $role) => [
                'value' => $role->value,
                'label' => $role->label(),
            ]),
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        User::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('User created.')]);

        return to_route('admin.users.index');
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $user->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('User updated.')]);

        return to_route('admin.users.index');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($user->id === $request->user()->id) {
            abort(403, __('You cannot delete your own account.'));
        }

        $user->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('User deleted.')]);

        return to_route('admin.users.index');
    }
}
```

- [ ] **Step 7: Regenerate Wayfinder**

Run: `php artisan wayfinder:generate`
Expected: `resources/js/actions/App/Http/Controllers/Admin/UserController.ts` and `resources/js/routes/admin/users/index.ts` exist.

- [ ] **Step 8: Run tests to verify the backend passes**

Run: `php artisan test --compact tests/Feature/Admin/UserManagementTest.php`
Expected: PASS.

- [ ] **Step 9: Create the Inertia page**

Create `resources/js/pages/admin/users/index.tsx`:

```tsx
import { Form, Link, usePage } from '@inertiajs/react';
import UserController from '@/actions/App/Http/Controllers/Admin/UserController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { index } from '@/routes/admin/users';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';

type RoleOption = { value: string; label: string };
type UserRow = {
    id: number;
    name: string;
    email: string;
    role: string;
    role_label: string;
};

type PageProps = {
    users: { data: UserRow[]; total: number };
    roles: RoleOption[];
};

export default function AdminUsersIndex({ users, roles }: PageProps) {
    const { auth } = usePage().props;
    const [editing, setEditing] = useState<UserRow | null>(null);
    const [showForm, setShowForm] = useState(false);

    return (
        <>
            <Heading title="Manajemen User" description="Kelola akun dan peran pengguna SIMAHAL." />

            <Card>
                <CardHeader>
                    <CardTitle>Daftar User ({users.total})</CardTitle>
                    <CardDescription>Klik "Buat User" untuk menambah akun baru.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button onClick={() => setShowForm(true)}>Buat User</Button>

                    {showForm && (
                        <Form
                            {...UserController.store.form()}
                            onSuccess={() => setShowForm(false)}
                            className="space-y-4 rounded-lg border p-4"
                        >
                            {({ errors }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Nama</Label>
                                        <Input id="name" name="name" required placeholder="Nama lengkap" />
                                        <InputError message={errors.name} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" name="email" type="email" required placeholder="email@example.com" />
                                        <InputError message={errors.email} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="password">Password</Label>
                                        <Input id="password" name="password" type="password" required />
                                        <InputError message={errors.password} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="role">Role</Label>
                                        <Select name="role" required defaultValue="santri">
                                            <SelectTrigger id="role"><SelectValue placeholder="Pilih role" /></SelectTrigger>
                                            <SelectContent>
                                                {roles.map((r) => (
                                                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.role} />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button type="submit">Simpan</Button>
                                        <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    )}

                    <ul className="divide-y rounded-lg border">
                        {users.data.map((user) => (
                            <li key={user.id} className="flex items-center justify-between gap-4 p-4">
                                <div>
                                    <p className="font-medium">{user.name}</p>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary">{user.role_label}</Badge>
                                    {auth.user.id !== user.id && (
                                        <Form {...UserController.destroy.form({ user: user.id })}>
                                            <Button type="submit" variant="ghost" className="text-destructive">
                                                Hapus
                                            </Button>
                                        </Form>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </>
    );
}

AdminUsersIndex.layout = {
    breadcrumbs: [{
        title: 'Manajemen User',
        href: index(),
    }],
};
```

- [ ] **Step 10: Verify frontend types**

Run: `npm run types:check`
Expected: no new errors reference `Admin/UserController` or `admin/users`.

- [ ] **Step 11: Format and commit**

```bash
vendor/bin/pint --dirty --format agent
git add routes/admin.php routes/web.php app/Http/Controllers/Admin app/Http/Requests/Admin resources/js/pages/admin/users tests/Feature/Admin/UserManagementTest.php
git commit -m "feat: admin user management"
```

---

### Task 2: Santri management (admin)

**Files:**
- Modify: `routes/admin.php`
- Create: `app/Http/Controllers/Admin/SantriController.php`
- Create: `app/Http/Requests/Admin/Santri/StoreSantriRequest.php`
- Create: `app/Http/Requests/Admin/Santri/UpdateSantriRequest.php`
- Create: `resources/js/pages/admin/santris/index.tsx`
- Test: `tests/Feature/Admin/SantriManagementTest.php`

**Interfaces:**
- Consumes: `Santri`, `Ustadz`, `OrangTua` models, `UserRole` enum, `role` middleware (Phase 1).
- Produces routes `admin.santris.index|store|update|destroy` and page `resources/js/pages/admin/santris/index.tsx` receiving props `santris` (paginated), `orangTuas` (`Array<{id, nama}>`), and `statuses` (`Array<{value, label}>`).
- Creating a santri atomically creates its linked `User` (role `santri`) and a `Santri` row; updating also updates the linked user name/email; deleting removes both.

- [ ] **Step 1: Write the failing feature test**

Create `tests/Feature/Admin/SantriManagementTest.php`:

```php
<?php

use App\Enums\SantriStatus;
use App\Enums\UserRole;
use App\Models\OrangTua;
use App\Models\Santri;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => UserRole::Admin]);
    $this->actingAs($this->admin);
});

test('admin can list santri with their user account', function () {
    Santri::factory()->count(3)->create();

    $this->get(route('admin.santris.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/santris/index'));
});

test('admin can create a santri with a new user account', function () {
    $orangTua = OrangTua::factory()->create();

    $this->post(route('admin.santris.store'), [
        'name' => 'Santri Cinta',
        'email' => 'cinta@simahal.test',
        'password' => 'password',
        'nis' => '2024009',
        'tanggal_lahir' => '2012-03-10',
        'status' => SantriStatus::Aktif->value,
        'orang_tua_id' => $orangTua->id,
    ])->assertRedirect(route('admin.santris.index'));

    $this->assertDatabaseHas('users', [
        'email' => 'cinta@simahal.test',
        'role' => UserRole::Santri->value,
    ]);

    $this->assertDatabaseHas('santris', [
        'nis' => '2024009',
        'nama' => 'Santri Cinta',
        'orang_tua_id' => $orangTua->id,
        'status' => SantriStatus::Aktif->value,
    ]);
});

test('admin can update a santri and its user account', function () {
    $santri = Santri::factory()->create();

    $this->patch(route('admin.santris.update', $santri), [
        'name' => 'Santri Update',
        'email' => $santri->user->email,
        'nis' => $santri->nis,
        'status' => SantriStatus::Aktif->value,
    ])->assertRedirect(route('admin.santris.index'));

    expect($santri->fresh()->nama)->toBe('Santri Update')
        ->and($santri->fresh()->user->name)->toBe('Santri Update');
});

test('admin can delete a santri and its user account', function () {
    $santri = Santri::factory()->create();

    $this->delete(route('admin.santris.destroy', $santri))
        ->assertRedirect(route('admin.santris.index'));

    expect($santri->fresh())->toBeNull()
        ->and(User::find($santri->user_id))->toBeNull();
});

test('non-admin cannot access santri management', function () {
    $ustadz = User::factory()->create(['role' => UserRole::Ustadz]);
    $this->actingAs($ustadz);

    $this->get(route('admin.santris.index'))->assertForbidden();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --compact tests/Feature/Admin/SantriManagementTest.php`
Expected: FAIL — route `admin.santris.index` not defined.

- [ ] **Step 3: Register the routes**

Edit `routes/admin.php` — add the `use` and routes inside the existing group:

```php
use App\Http\Controllers\Admin\SantriController;

Route::get('santris', [SantriController::class, 'index'])->name('santris.index');
Route::post('santris', [SantriController::class, 'store'])->name('santris.store');
Route::patch('santris/{santri}', [SantriController::class, 'update'])->name('santris.update');
Route::delete('santris/{santri}', [SantriController::class, 'destroy'])->name('santris.destroy');
```

- [ ] **Step 4: Create the FormRequests**

Create `app/Http/Requests/Admin/Santri/StoreSantriRequest.php`:

```php
<?php

namespace App\Http\Requests\Admin\Santri;

use App\Enums\SantriStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;
use Illuminate\Validation\Rules\Password;

class StoreSantriRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', Password::min(8)],
            'nis' => ['nullable', 'string', 'max:50', 'unique:santris,nis'],
            'tanggal_lahir' => ['nullable', 'date'],
            'status' => ['required', new Enum(SantriStatus::class)],
            'orang_tua_id' => ['nullable', 'exists:orang_tuas,id'],
        ];
    }
}
```

Create `app/Http/Requests/Admin/Santri/UpdateSantriRequest.php`:

```php
<?php

namespace App\Http\Requests\Admin\Santri;

use App\Enums\SantriStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

class UpdateSantriRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $santri = $this->route('santri');
        $user = $santri->user;

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', $user ? Rule::unique('users', 'email')->ignore($user->id) : 'unique:users,email'],
            'nis' => ['nullable', 'string', 'max:50', Rule::unique('santris', 'nis')->ignore($santri->id)],
            'tanggal_lahir' => ['nullable', 'date'],
            'status' => ['required', new Enum(SantriStatus::class)],
            'orang_tua_id' => ['nullable', 'exists:orang_tuas,id'],
        ];
    }
}
```

- [ ] **Step 5: Create the controller**

Create `app/Http/Controllers/Admin/SantriController.php`:

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Enums\SantriStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Santri\StoreSantriRequest;
use App\Http\Requests\Admin\Santri\UpdateSantriRequest;
use App\Models\OrangTua;
use App\Models\Santri;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SantriController extends Controller
{
    public function index(Request $request): Response
    {
        $santris = Santri::query()
            ->with(['user', 'orangTua'])
            ->orderBy('nama')
            ->paginate(15);

        return Inertia::render('admin/santris/index', [
            'santris' => $santris,
            'orangTuas' => OrangTua::query()->orderBy('nama')->get(['id', 'nama']),
            'statuses' => collect(SantriStatus::cases())->map(fn (SantriStatus $status) => [
                'value' => $status->value,
                'label' => $status->label(),
            ]),
        ]);
    }

    public function store(StoreSantriRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => UserRole::Santri,
        ]);

        Santri::create([
            'user_id' => $user->id,
            'orang_tua_id' => $validated['orang_tua_id'] ?? null,
            'nis' => $validated['nis'] ?? null,
            'nama' => $validated['name'],
            'tanggal_lahir' => $validated['tanggal_lahir'] ?? null,
            'status' => $validated['status'],
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Santri created.')]);

        return to_route('admin.santris.index');
    }

    public function update(UpdateSantriRequest $request, Santri $santri): RedirectResponse
    {
        $validated = $request->validated();

        $santri->update([
            'orang_tua_id' => $validated['orang_tua_id'] ?? null,
            'nis' => $validated['nis'] ?? null,
            'nama' => $validated['name'],
            'tanggal_lahir' => $validated['tanggal_lahir'] ?? null,
            'status' => $validated['status'],
        ]);

        $santri->user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Santri updated.')]);

        return to_route('admin.santris.index');
    }

    public function destroy(Request $request, Santri $santri): RedirectResponse
    {
        $santri->user->delete();
        $santri->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Santri deleted.')]);

        return to_route('admin.santris.index');
    }
}
```

- [ ] **Step 6: Regenerate Wayfinder**

Run: `php artisan wayfinder:generate`
Expected: `resources/js/actions/App/Http/Controllers/Admin/SantriController.ts` exists.

- [ ] **Step 7: Run backend tests**

Run: `php artisan test --compact tests/Feature/Admin/SantriManagementTest.php`
Expected: PASS.

- [ ] **Step 8: Create the Inertia page**

Create `resources/js/pages/admin/santris/index.tsx`:

```tsx
import { Form } from '@inertiajs/react';
import SantriController from '@/actions/App/Http/Controllers/Admin/SantriController';
import Heading from '@/components/heading';
import { index } from '@/routes/admin/santris';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';

type Option = { value: string; label: string };
type SantriRow = {
    id: number;
    nis: string | null;
    nama: string;
    status: string;
    user: { email: string };
    orang_tua: { id: number; nama: string } | null;
};

type PageProps = {
    santris: { data: SantriRow[]; total: number };
    orangTuas: { id: number; nama: string }[];
    statuses: Option[];
};

export default function AdminSantrisIndex({ santris, orangTuas, statuses }: PageProps) {
    const [showForm, setShowForm] = useState(false);

    return (
        <>
            <Heading title="Manajemen Santri" description="Kelola data santri dan akun loginnya." />

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Santri ({santris.total})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button onClick={() => setShowForm(true)}>Tambah Santri</Button>

                    {showForm && (
                        <Form
                            {...SantriController.store.form()}
                            onSuccess={() => setShowForm(false)}
                            className="space-y-4 rounded-lg border p-4"
                        >
                            {({ errors }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Nama</Label>
                                        <Input id="name" name="name" required />
                                        <InputError message={errors.name} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" name="email" type="email" required />
                                        <InputError message={errors.email} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="password">Password</Label>
                                        <Input id="password" name="password" type="password" required />
                                        <InputError message={errors.password} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="nis">NIS</Label>
                                        <Input id="nis" name="nis" />
                                        <InputError message={errors.nis} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="tanggal_lahir">Tanggal Lahir</Label>
                                        <Input id="tanggal_lahir" name="tanggal_lahir" type="date" />
                                        <InputError message={errors.tanggal_lahir} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="status">Status</Label>
                                        <Select name="status" required defaultValue="aktif">
                                            <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {statuses.map((s) => (
                                                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.status} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="orang_tua_id">Orang Tua</Label>
                                        <Select name="orang_tua_id">
                                            <SelectTrigger id="orang_tua_id"><SelectValue placeholder="Tanpa orang tua" /></SelectTrigger>
                                            <SelectContent>
                                                {orangTuas.map((o) => (
                                                    <SelectItem key={o.id} value={String(o.id)}>{o.nama}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.orang_tua_id} />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button type="submit">Simpan</Button>
                                        <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    )}

                    <ul className="divide-y rounded-lg border">
                        {santris.data.map((santri) => (
                            <li key={santri.id} className="flex items-center justify-between gap-4 p-4">
                                <div>
                                    <p className="font-medium">{santri.nama} {santri.nis ? `(${santri.nis})` : ''}</p>
                                    <p className="text-sm text-muted-foreground">{santri.user.email}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary">{santri.status}</Badge>
                                    <Form {...SantriController.destroy.form({ santri: santri.id })}>
                                        <Button type="submit" variant="ghost" className="text-destructive">Hapus</Button>
                                    </Form>
                                </div>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </>
    );
}

AdminSantrisIndex.layout = {
    breadcrumbs: [{
        title: 'Manajemen Santri',
        href: index(),
    }],
};
```

Note: `InputError` and the santri status label mapping must import `InputError from '@/components/input-error'` (used in the form). For the status badge, map `santri.status` through the `statuses` prop.

- [ ] **Step 9: Verify frontend types**

Run: `npm run types:check`
Expected: no new errors.

- [ ] **Step 10: Format and commit**

```bash
vendor/bin/pint --dirty --format agent
git add routes/admin.php app/Http/Controllers/Admin/SantriController.php app/Http/Requests/Admin/Santri resources/js/pages/admin/santris tests/Feature/Admin/SantriManagementTest.php
git commit -m "feat: admin santri management"
```

---

### Task 3: Ustadz management (admin)

**Files:**
- Modify: `routes/admin.php`
- Create: `app/Http/Controllers/Admin/UstadzController.php`
- Create: `app/Http/Requests/Admin/Ustadz/StoreUstadzRequest.php`
- Create: `app/Http/Requests/Admin/Ustadz/UpdateUstadzRequest.php`
- Create: `resources/js/pages/admin/ustadzs/index.tsx`
- Test: `tests/Feature/Admin/UstadzManagementTest.php`

**Interfaces:**
- Consumes: `Ustadz`, `User` models, `UserRole` enum, `role` middleware.
- Produces routes `admin.ustadzs.index|store|update|destroy` and page `resources/js/pages/admin/ustadzs/index.tsx` receiving prop `ustadzs` (paginated).
- Creating an ustadz atomically creates its linked `User` (role `ustadz`); deleting removes both.

- [ ] **Step 1: Write the failing feature test**

Create `tests/Feature/Admin/UstadzManagementTest.php`:

```php
<?php

use App\Enums\UserRole;
use App\Models\Ustadz;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => UserRole::Admin]);
    $this->actingAs($this->admin);
});

test('admin can list ustadz', function () {
    Ustadz::factory()->count(3)->create();

    $this->get(route('admin.ustadzs.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/ustadzs/index'));
});

test('admin can create an ustadz with a new user account', function () {
    $this->post(route('admin.ustadzs.store'), [
        'name' => 'Ustadz Fajar',
        'email' => 'fajar@simahal.test',
        'password' => 'password',
        'kontak' => '08122334455',
    ])->assertRedirect(route('admin.ustadzs.index'));

    $this->assertDatabaseHas('users', [
        'email' => 'fajar@simahal.test',
        'role' => UserRole::Ustadz->value,
    ]);

    $this->assertDatabaseHas('ustadzs', [
        'nama' => 'Ustadz Fajar',
        'kontak' => '08122334455',
    ]);
});

test('admin can update an ustadz', function () {
    $ustadz = Ustadz::factory()->create();

    $this->patch(route('admin.ustadzs.update', $ustadz), [
        'name' => 'Ustadz Update',
        'email' => $ustadz->user->email,
        'kontak' => '08199988877',
    ])->assertRedirect(route('admin.ustadzs.index'));

    expect($ustadz->fresh()->nama)->toBe('Ustadz Update');
});

test('admin can delete an ustadz and its user account', function () {
    $ustadz = Ustadz::factory()->create();

    $this->delete(route('admin.ustadzs.destroy', $ustadz))
        ->assertRedirect(route('admin.ustadzs.index'));

    expect($ustadz->fresh())->toBeNull()
        ->and(User::find($ustadz->user_id))->toBeNull();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --compact tests/Feature/Admin/UstadzManagementTest.php`
Expected: FAIL — route `admin.ustadzs.index` not defined.

- [ ] **Step 3: Register the routes**

Edit `routes/admin.php` — add the `use` and four routes inside the group:

```php
use App\Http\Controllers\Admin\UstadzController;

Route::get('ustadzs', [UstadzController::class, 'index'])->name('ustadzs.index');
Route::post('ustadzs', [UstadzController::class, 'store'])->name('ustadzs.store');
Route::patch('ustadzs/{ustadz}', [UstadzController::class, 'update'])->name('ustadzs.update');
Route::delete('ustadzs/{ustadz}', [UstadzController::class, 'destroy'])->name('ustadzs.destroy');
```

- [ ] **Step 4: Create the FormRequests**

Create `app/Http/Requests/Admin/Ustadz/StoreUstadzRequest.php`:

```php
<?php

namespace App\Http\Requests\Admin\Ustadz;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class StoreUstadzRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', Password::min(8)],
            'kontak' => ['nullable', 'string', 'max:50'],
        ];
    }
}
```

Create `app/Http/Requests/Admin/Ustadz/UpdateUstadzRequest.php`:

```php
<?php

namespace App\Http\Requests\Admin\Ustadz;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUstadzRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $ustadz = $this->route('ustadz');
        $user = $ustadz->user;

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', $user ? Rule::unique('users', 'email')->ignore($user->id) : 'unique:users,email'],
            'kontak' => ['nullable', 'string', 'max:50'],
        ];
    }
}
```

- [ ] **Step 5: Create the controller**

Create `app/Http/Controllers/Admin/UstadzController.php`:

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Ustadz\StoreUstadzRequest;
use App\Http\Requests\Admin\Ustadz\UpdateUstadzRequest;
use App\Models\Ustadz;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UstadzController extends Controller
{
    public function index(Request $request): Response
    {
        $ustadzs = Ustadz::query()
            ->with('user')
            ->orderBy('nama')
            ->paginate(15);

        return Inertia::render('admin/ustadzs/index', [
            'ustadzs' => $ustadzs,
        ]);
    }

    public function store(StoreUstadzRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => UserRole::Ustadz,
        ]);

        Ustadz::create([
            'user_id' => $user->id,
            'nama' => $validated['name'],
            'kontak' => $validated['kontak'] ?? null,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Ustadz created.')]);

        return to_route('admin.ustadzs.index');
    }

    public function update(UpdateUstadzRequest $request, Ustadz $ustadz): RedirectResponse
    {
        $validated = $request->validated();

        $ustadz->update([
            'nama' => $validated['name'],
            'kontak' => $validated['kontak'] ?? null,
        ]);

        $ustadz->user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Ustadz updated.')]);

        return to_route('admin.ustadzs.index');
    }

    public function destroy(Request $request, Ustadz $ustadz): RedirectResponse
    {
        $ustadz->user->delete();
        $ustadz->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Ustadz deleted.')]);

        return to_route('admin.ustadzs.index');
    }
}
```

- [ ] **Step 6: Regenerate Wayfinder and run tests**

```bash
php artisan wayfinder:generate
php artisan test --compact tests/Feature/Admin/UstadzManagementTest.php
```

Expected: PASS.

- [ ] **Step 7: Create the Inertia page**

Create `resources/js/pages/admin/ustadzs/index.tsx`:

```tsx
import { Form } from '@inertiajs/react';
import UstadzController from '@/actions/App/Http/Controllers/Admin/UstadzController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { index } from '@/routes/admin/ustadzs';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

type UstadzRow = {
    id: number;
    nama: string;
    kontak: string | null;
    user: { email: string };
};

export default function AdminUstadzsIndex({ ustadzs }: { ustadzs: { data: UstadzRow[]; total: number } }) {
    const [showForm, setShowForm] = useState(false);

    return (
        <>
            <Heading title="Manajemen Ustadz" description="Kelola data ustadz dan akun loginnya." />

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Ustadz ({ustadzs.total})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button onClick={() => setShowForm(true)}>Tambah Ustadz</Button>

                    {showForm && (
                        <Form
                            {...UstadzController.store.form()}
                            onSuccess={() => setShowForm(false)}
                            className="space-y-4 rounded-lg border p-4"
                        >
                            {({ errors }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Nama</Label>
                                        <Input id="name" name="name" required />
                                        <InputError message={errors.name} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" name="email" type="email" required />
                                        <InputError message={errors.email} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="password">Password</Label>
                                        <Input id="password" name="password" type="password" required />
                                        <InputError message={errors.password} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="kontak">Kontak</Label>
                                        <Input id="kontak" name="kontak" />
                                        <InputError message={errors.kontak} />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button type="submit">Simpan</Button>
                                        <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    )}

                    <ul className="divide-y rounded-lg border">
                        {ustadzs.data.map((ustadz) => (
                            <li key={ustadz.id} className="flex items-center justify-between gap-4 p-4">
                                <div>
                                    <p className="font-medium">{ustadz.nama}</p>
                                    <p className="text-sm text-muted-foreground">{ustadz.user.email}</p>
                                </div>
                                <Form {...UstadzController.destroy.form({ ustadz: ustadz.id })}>
                                    <Button type="submit" variant="ghost" className="text-destructive">Hapus</Button>
                                </Form>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </>
    );
}

AdminUstadzsIndex.layout = {
    breadcrumbs: [{
        title: 'Manajemen Ustadz',
        href: index(),
    }],
};
```

Also register the nav link (see Task 6 for the shared nav wiring) and verify:

- [ ] **Step 8: Verify frontend types**

Run: `npm run types:check`
Expected: no new errors.

- [ ] **Step 9: Format and commit**

```bash
vendor/bin/pint --dirty --format agent
git add routes/admin.php app/Http/Controllers/Admin/UstadzController.php app/Http/Requests/Admin/Ustadz resources/js/pages/admin/ustadzs tests/Feature/Admin/UstadzManagementTest.php
git commit -m "feat: admin ustadz management"
```

---

### Task 4: Orang Tua management (admin)

**Files:**
- Modify: `routes/admin.php`
- Create: `app/Http/Controllers/Admin/OrangTuaController.php`
- Create: `app/Http/Requests/Admin/OrangTua/StoreOrangTuaRequest.php`
- Create: `app/Http/Requests/Admin/OrangTua/UpdateOrangTuaRequest.php`
- Create: `resources/js/pages/admin/orang-tuas/index.tsx`
- Test: `tests/Feature/Admin/OrangTuaManagementTest.php`

**Interfaces:**
- Consumes: `OrangTua`, `User` models, `UserRole` enum, `role` middleware.
- Produces routes `admin.orang-tuas.index|store|update|destroy` and page `resources/js/pages/admin/orang-tuas/index.tsx` receiving prop `orangTuas` (paginated, each with `user`, `children_count`).
- Creating an orang tua atomically creates its linked `User` (role `orang_tua`); deleting removes the user (children `orang_tua_id` is set null by migration `->constrained()->cascadeOnDelete` — note: separate `orang_tuas` FK on `santris` uses `cascadeOnDelete`, deleting the `OrangTua` row nulls children only if the FK is `nullOnDelete`; leave as `cascadeOnDelete` default from Task 1 for MVP and document in commit).

- [ ] **Step 1: Write the failing feature test**

Create `tests/Feature/Admin/OrangTuaManagementTest.php`:

```php
<?php

use App\Enums\SantriStatus;
use App\Enums\UserRole;
use App\Models\OrangTua;
use App\Models\Santri;
use App\Models\User;

beforeEach(function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    $this->actingAs($admin);
});

test('admin can list orang tua with child counts', function () {
    $orangTua = OrangTua::factory()->create();
    Santri::factory()->count(2)->create(['orang_tua_id' => $orangTua->id]);

    $this->get(route('admin.orang-tuas.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/orang-tuas/index'));
});

test('admin can create an orang tua with a user account', function () {
    $this->post(route('admin.orang-tuas.store'), [
        'name' => 'Ibu Siti',
        'email' => 'siti@simahal.test',
        'password' => 'password',
        'kontak' => '081111222333',
    ])->assertRedirect(route('admin.orang-tuas.index'));

    $this->assertDatabaseHas('users', [
        'email' => 'siti@simahal.test',
        'role' => UserRole::OrangTua->value,
    ]);

    $this->assertDatabaseHas('orang_tuas', [
        'nama' => 'Ibu Siti',
        'kontak' => '081111222333',
    ]);
});

test('admin can update an orang tua', function () {
    $orangTua = OrangTua::factory()->create();

    $this->patch(route('admin.orang-tuas.update', $orangTua), [
        'name' => 'Ibu Update',
        'email' => $orangTua->user->email,
        'kontak' => '08100000000',
    ])->assertRedirect(route('admin.orang-tuas.index'));

    expect($orangTua->fresh()->nama)->toBe('Ibu Update');
});

test('admin can delete an orang tua and its user account', function () {
    $orangTua = OrangTua::factory()->create();

    $this->delete(route('admin.orang-tuas.destroy', $orangTua))
        ->assertRedirect(route('admin.orang-tuas.index'));

    expect($orangTua->fresh())->toBeNull()
        ->and(User::find($orangTua->user_id))->toBeNull();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --compact tests/Feature/Admin/OrangTuaManagementTest.php`
Expected: FAIL — route `admin.orang-tuas.index` not defined.

- [ ] **Step 3: Register the routes**

Edit `routes/admin.php` — add inside the group:

```php
use App\Http\Controllers\Admin\OrangTuaController;

Route::get('orang-tuas', [OrangTuaController::class, 'index'])->name('orang-tuas.index');
Route::post('orang-tuas', [OrangTuaController::class, 'store'])->name('orang-tuas.store');
Route::patch('orang-tuas/{orangTua}', [OrangTuaController::class, 'update'])->name('orang-tuas.update');
Route::delete('orang-tuas/{orangTua}', [OrangTuaController::class, 'destroy'])->name('orang-tuas.destroy');
```

- [ ] **Step 4: Create the FormRequests**

Create `app/Http/Requests/Admin/OrangTua/StoreOrangTuaRequest.php`:

```php
<?php

namespace App\Http\Requests\Admin\OrangTua;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class StoreOrangTuaRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', Password::min(8)],
            'kontak' => ['nullable', 'string', 'max:50'],
        ];
    }
}
```

Create `app/Http/Requests/Admin/OrangTua/UpdateOrangTuaRequest.php`:

```php
<?php

namespace App\Http\Requests\Admin\OrangTua;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOrangTuaRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $orangTua = $this->route('orangTua');
        $user = $orangTua->user;

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', $user ? Rule::unique('users', 'email')->ignore($user->id) : 'unique:users,email'],
            'kontak' => ['nullable', 'string', 'max:50'],
        ];
    }
}
```

- [ ] **Step 5: Create the controller**

Create `app/Http/Controllers/Admin/OrangTuaController.php`:

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\OrangTua\StoreOrangTuaRequest;
use App\Http\Requests\Admin\OrangTua\UpdateOrangTuaRequest;
use App\Models\OrangTua;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrangTuaController extends Controller
{
    public function index(Request $request): Response
    {
        $orangTuas = OrangTua::query()
            ->with('user')
            ->withCount('santris')
            ->orderBy('nama')
            ->paginate(15);

        return Inertia::render('admin/orang-tuas/index', [
            'orangTuas' => $orangTuas,
        ]);
    }

    public function store(StoreOrangTuaRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => UserRole::OrangTua,
        ]);

        OrangTua::create([
            'user_id' => $user->id,
            'nama' => $validated['name'],
            'kontak' => $validated['kontak'] ?? null,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Orang tua created.')]);

        return to_route('admin.orang-tuas.index');
    }

    public function update(UpdateOrangTuaRequest $request, OrangTua $orangTua): RedirectResponse
    {
        $validated = $request->validated();

        $orangTua->update([
            'nama' => $validated['name'],
            'kontak' => $validated['kontak'] ?? null,
        ]);

        $orangTua->user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Orang tua updated.')]);

        return to_route('admin.orang-tuas.index');
    }

    public function destroy(Request $request, OrangTua $orangTua): RedirectResponse
    {
        $orangTua->user->delete();
        $orangTua->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Orang tua deleted.')]);

        return to_route('admin.orang-tuas.index');
    }
}
```

- [ ] **Step 6: Regenerate Wayfinder and run tests**

```bash
php artisan wayfinder:generate
php artisan test --compact tests/Feature/Admin/OrangTuaManagementTest.php
```

Expected: PASS.

- [ ] **Step 7: Create the Inertia page**

Create `resources/js/pages/admin/orang-tuas/index.tsx`:

```tsx
import { Form } from '@inertiajs/react';
import OrangTuaController from '@/actions/App/Http/Controllers/Admin/OrangTuaController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { index } from '@/routes/admin/orang-tuas';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

type OrangTuaRow = {
    id: number;
    nama: string;
    kontak: string | null;
    santris_count: number;
    user: { email: string };
};

export default function AdminOrangTuasIndex({ orangTuas }: { orangTuas: { data: OrangTuaRow[]; total: number } }) {
    const [showForm, setShowForm] = useState(false);

    return (
        <>
            <Heading title="Manajemen Orang Tua" description="Kelola akun orang tua santri." />

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Orang Tua ({orangTuas.total})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button onClick={() => setShowForm(true)}>Tambah Orang Tua</Button>

                    {showForm && (
                        <Form
                            {...OrangTuaController.store.form()}
                            onSuccess={() => setShowForm(false)}
                            className="space-y-4 rounded-lg border p-4"
                        >
                            {({ errors }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Nama</Label>
                                        <Input id="name" name="name" required />
                                        <InputError message={errors.name} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" name="email" type="email" required />
                                        <InputError message={errors.email} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="password">Password</Label>
                                        <Input id="password" name="password" type="password" required />
                                        <InputError message={errors.password} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="kontak">Kontak</Label>
                                        <Input id="kontak" name="kontak" />
                                        <InputError message={errors.kontak} />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button type="submit">Simpan</Button>
                                        <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    )}

                    <ul className="divide-y rounded-lg border">
                        {orangTuas.data.map((orangTua) => (
                            <li key={orangTua.id} className="flex items-center justify-between gap-4 p-4">
                                <div>
                                    <p className="font-medium">{orangTua.nama}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {orangTua.user.email} · {orangTua.santris_count} anak
                                    </p>
                                </div>
                                <Form {...OrangTuaController.destroy.form({ orangTua: orangTua.id })}>
                                    <Button type="submit" variant="ghost" className="text-destructive">Hapus</Button>
                                </Form>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </>
    );
}

AdminOrangTuasIndex.layout = {
    breadcrumbs: [{
        title: 'Manajemen Orang Tua',
        href: index(),
    }],
};
```

- [ ] **Step 8: Verify types and commit**

```bash
npm run types:check
vendor/bin/pint --dirty --format agent
git add routes/admin.php app/Http/Controllers/Admin/OrangTuaController.php app/Http/Requests/Admin/OrangTua resources/js/pages/admin/orang-tuas tests/Feature/Admin/OrangTuaManagementTest.php
git commit -m "feat: admin orang tua management"
```

---

### Task 5: Halaqah management with members (admin)

**Files:**
- Modify: `routes/admin.php`
- Create: `app/Http/Controllers/Admin/HalaqahController.php`
- Create: `app/Http/Requests/Admin/Halaqah/StoreHalaqahRequest.php`
- Create: `app/Http/Requests/Admin/Halaqah/UpdateHalaqahRequest.php`
- Create: `resources/js/pages/admin/halaqahs/index.tsx`
- Test: `tests/Feature/Admin/HalaqahManagementTest.php`

**Interfaces:**
- Consumes: `Halaqah`, `Ustadz`, `Santri` models, `HalaqahStatus`, `HalaqahMemberStatus` enums, `role` middleware.
- Produces routes `admin.halaqahs.index|store|update|destroy` and page `resources/js/pages/admin/halaqahs/index.tsx` receiving props `halaqahs` (paginated, each with `ustadz`, `santri_count`), `ustadzs` (`Array<{id, nama}>`), `santris` (`Array<{id, nama}>`), `statuses`.
- `store/update` accept `santri_ids` (`Array<int>`) which are synced through the `halaqah_members` pivot.

- [ ] **Step 1: Write the failing feature test**

Create `tests/Feature/Admin/HalaqahManagementTest.php`:

```php
<?php

use App\Enums\HalaqahStatus;
use App\Enums\UserRole;
use App\Models\Halaqah;
use App\Models\HalaqahMember;
use App\Models\Santri;
use App\Models\Ustadz;
use App\Models\User;

beforeEach(function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    $this->actingAs($admin);
});

test('admin can list halaqah', function () {
    Halaqah::factory()->count(2)->create();

    $this->get(route('admin.halaqahs.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/halaqahs/index'));
});

test('admin can create a halaqah with members', function () {
    $ustadz = Ustadz::factory()->create();
    $santris = Santri::factory()->count(2)->create();

    $this->post(route('admin.halaqahs.store'), [
        'nama' => 'Halaqah Tahfidz 1',
        'ustadz_id' => $ustadz->id,
        'jadwal' => 'Setiap pagi',
        'status' => HalaqahStatus::Aktif->value,
        'santri_ids' => $santris->pluck('id')->all(),
    ])->assertRedirect(route('admin.halaqahs.index'));

    $halaqah = Halaqah::where('nama', 'Halaqah Tahfidz 1')->first();

    expect($halaqah->santris)->toHaveCount(2);
});

test('admin can update a halaqah and sync members', function () {
    $halaqah = Halaqah::factory()->create();
    $current = Santri::factory()->create();
    $incoming = Santri::factory()->create();
    $halaqah->santris()->attach($current->id);

    $this->patch(route('admin.halaqahs.update', $halaqah), [
        'nama' => $halaqah->nama,
        'ustadz_id' => $halaqah->ustadz_id,
        'jadwal' => 'Setiap sore',
        'status' => HalaqahStatus::Aktif->value,
        'santri_ids' => [$incoming->id],
    ])->assertRedirect(route('admin.halaqahs.index'));

    expect($halaqah->fresh()->santris)->toHaveCount(1)
        ->and($halaqah->fresh()->santris->first()->id)->toBe($incoming->id);
});

test('admin can delete a halaqah and its memberships', function () {
    $halaqah = Halaqah::factory()->create();
    $santri = Santri::factory()->create();
    $halaqah->santris()->attach($santri->id);

    $this->delete(route('admin.halaqahs.destroy', $halaqah))
        ->assertRedirect(route('admin.halaqahs.index'));

    expect($halaqah->fresh())->toBeNull()
        ->and(HalaqahMember::count())->toBe(0);
});

test('non-admin cannot access halaqah management', function () {
    $ustadz = User::factory()->create(['role' => UserRole::Ustadz]);
    $this->actingAs($ustadz);

    $this->get(route('admin.halaqahs.index'))->assertForbidden();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --compact tests/Feature/Admin/HalaqahManagementTest.php`
Caution: this file has `Santri::factory()->count(2)->create()` where a shared `HalaqahMember` case may trip the unique pivot later; expected FAIL is only "route not defined".

- [ ] **Step 3: Register the routes**

Edit `routes/admin.php` — add inside the group:

```php
use App\Http\Controllers\Admin\HalaqahController;

Route::get('halaqahs', [HalaqahController::class, 'index'])->name('halaqahs.index');
Route::post('halaqahs', [HalaqahController::class, 'store'])->name('halaqahs.store');
Route::patch('halaqahs/{halaqah}', [HalaqahController::class, 'update'])->name('halaqahs.update');
Route::delete('halaqahs/{halaqah}', [HalaqahController::class, 'destroy'])->name('halaqahs.destroy');
```

- [ ] **Step 4: Create the FormRequests**

Create `app/Http/Requests/Admin/Halaqah/StoreHalaqahRequest.php`:

```php
<?php

namespace App\Http\Requests\Admin\Halaqah;

use App\Enums\HalaqahStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreHalaqahRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'nama' => ['required', 'string', 'max:255'],
            'ustadz_id' => ['required', 'exists:ustadzs,id'],
            'jadwal' => ['nullable', 'string', 'max:255'],
            'status' => ['required', new Enum(HalaqahStatus::class)],
            'santri_ids' => ['nullable', 'array'],
            'santri_ids.*' => ['integer', 'exists:santris,id'],
        ];
    }
}
```

Create `app/Http/Requests/Admin/Halaqah/UpdateHalaqahRequest.php` with the same rules but `Route\{halaqah}\->id` ignored for uniqueness (no unique fields present here; identical to store except script path — reuse the same rules array via a shared parent would be ideal, but per repo convention keep two files):

```php
<?php

namespace App\Http\Requests\Admin\Halaqah;

use App\Enums\HalaqahStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdateHalaqahRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'nama' => ['required', 'string', 'max:255'],
            'ustadz_id' => ['required', 'exists:ustadzs,id'],
            'jadwal' => ['nullable', 'string', 'max:255'],
            'status' => ['required', new Enum(HalaqahStatus::class)],
            'santri_ids' => ['nullable', 'array'],
            'santri_ids.*' => ['integer', 'exists:santris,id'],
        ];
    }
}
```

- [ ] **Step 5: Create the controller**

Create `app/Http/Controllers/Admin/HalaqahController.php`:

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Enums\HalaqahStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Halaqah\StoreHalaqahRequest;
use App\Http\Requests\Admin\Halaqah\UpdateHalaqahRequest;
use App\Models\Halaqah;
use App\Models\Santri;
use App\Models\Ustadz;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HalaqahController extends Controller
{
    public function index(Request $request): Response
    {
        $halaqahs = Halaqah::query()
            ->with('ustadz')
            ->withCount('santris')
            ->orderBy('nama')
            ->paginate(15);

        return Inertia::render('admin/halaqahs/index', [
            'halaqahs' => $halaqahs,
            'ustadzs' => Ustadz::query()->orderBy('nama')->get(['id', 'nama']),
            'santris' => Santri::query()->orderBy('nama')->get(['id', 'nama']),
            'statuses' => collect(HalaqahStatus::cases())->map(fn (HalaqahStatus $status) => [
                'value' => $status->value,
                'label' => $status->label(),
            ]),
        ]);
    }

    public function store(StoreHalaqahRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $halaqah = Halaqah::create([
            'nama' => $validated['nama'],
            'ustadz_id' => $validated['ustadz_id'],
            'jadwal' => $validated['jadwal'] ?? null,
            'status' => $validated['status'],
        ]);

        $halaqah->santris()->sync($validated['santri_ids'] ?? []);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Halaqah created.')]);

        return to_route('admin.halaqahs.index');
    }

    public function update(UpdateHalaqahRequest $request, Halaqah $halaqah): RedirectResponse
    {
        $validated = $request->validated();

        $halaqah->update([
            'nama' => $validated['nama'],
            'ustadz_id' => $validated['ustadz_id'],
            'jadwal' => $validated['jadwal'] ?? null,
            'status' => $validated['status'],
        ]);

        $halaqah->santris()->sync($validated['santri_ids'] ?? []);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Halaqah updated.')]);

        return to_route('admin.halaqahs.index');
    }

    public function destroy(Request $request, Halaqah $halaqah): RedirectResponse
    {
        $halaqah->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Halaqah deleted.')]);

        return to_route('admin.halaqahs.index');
    }
}
```

- [ ] **Step 6: Regenerate Wayfinder and run tests**

```bash
php artisan wayfinder:generate
php artisan test --compact tests/Feature/Admin/HalaqahManagementTest.php
```

Expected: PASS.

- [ ] **Step 7: Create the Inertia page**

Create `resources/js/pages/admin/halaqahs/index.tsx`:

```tsx
import { Form } from '@inertiajs/react';
import HalaqahController from '@/actions/App/Http/Controllers/Admin/HalaqahController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { index } from '@/routes/admin/halaqahs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';

type Option = { value: string; label: string };
type HalaqahRow = {
    id: number;
    nama: string;
    jadwal: string | null;
    status: string;
    santris_count: number;
    ustadz: { nama: string } | null;
};

type PageProps = {
    halaqahs: { data: HalaqahRow[]; total: number };
    ustadzs: { id: number; nama: string }[];
    santris: { id: number; nama: string }[];
    statuses: Option[];
};

export default function AdminHalaqahsIndex({ halaqahs, ustadzs, santris, statuses }: PageProps) {
    const [showForm, setShowForm] = useState(false);
    const [selectedSantris, setSelectedSantris] = useState<number[]>([]);

    return (
        <>
            <Heading title="Manajemen Halaqah" description="Kelola halaqah dan keanggotaan santrinya." />

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Halaqah ({halaqahs.total})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button onClick={() => { setSelectedSantris([]); setShowForm(true); }}>Tambah Halaqah</Button>

                    {showForm && (
                        <Form
                            {...HalaqahController.store.form()}
                            onSuccess={() => setShowForm(false)}
                            className="space-y-4 rounded-lg border p-4"
                        >
                            {({ errors }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="nama">Nama</Label>
                                        <Input id="nama" name="nama" required />
                                        <InputError message={errors.nama} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="ustadz_id">Ustadz</Label>
                                        <Select name="ustadz_id" required>
                                            <SelectTrigger id="ustadz_id"><SelectValue placeholder="Pilih ustadz" /></SelectTrigger>
                                            <SelectContent>
                                                {ustadzs.map((u) => (
                                                    <SelectItem key={u.id} value={String(u.id)}>{u.nama}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.ustadz_id} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="jadwal">Jadwal</Label>
                                        <Input id="jadwal" name="jadwal" placeholder="Contoh: Setiap pagi setelah Subuh" />
                                        <InputError message={errors.jadwal} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="status">Status</Label>
                                        <Select name="status" required defaultValue="aktif">
                                            <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {statuses.map((s) => (
                                                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.status} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Santri</Label>
                                        <div className="flex max-h-40 flex-col gap-2 overflow-y-auto rounded-lg border p-2">
                                            {santris.map((s) => (
                                                <label key={s.id} className="flex items-center gap-2 text-sm">
                                                    <input
                                                        type="checkbox"
                                                        name="santri_ids[]"
                                                        value={s.id}
                                                        checked={selectedSantris.includes(s.id)}
                                                        onChange={(e) =>
                                                            setSelectedSantris((prev) =>
                                                                e.target.checked
                                                                    ? [...prev, s.id]
                                                                    : prev.filter((id) => id !== s.id),
                                                            )
                                                        }
                                                    />
                                                    {s.nama}
                                                </label>
                                            ))}
                                        </div>
                                        <InputError message={errors['santri_ids']} />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button type="submit">Simpan</Button>
                                        <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    )}

                    <ul className="divide-y rounded-lg border">
                        {halaqahs.data.map((halaqah) => (
                            <li key={halaqah.id} className="flex items-center justify-between gap-4 p-4">
                                <div>
                                    <p className="font-medium">{halaqah.nama}</p>
                                    <p className="text-sm text-muted-foreground">
                                        Ustadz: {halaqah.ustadz?.nama ?? '-'} · {halaqah.santris_count} santri
                                        {halaqah.jadwal ? ` · ${halaqah.jadwal}` : ''}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary">{halaqah.status}</Badge>
                                    <Form {...HalaqahController.destroy.form({ halaqah: halaqah.id })}>
                                        <Button type="submit" variant="ghost" className="text-destructive">Hapus</Button>
                                    </Form>
                                </div>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </>
    );
}

AdminHalaqahsIndex.layout = {
    breadcrumbs: [{
        title: 'Manajemen Halaqah',
        href: index(),
    }],
};
```

Note: on edit, pass the halaqah defaults via `data` prop of `HalaqahController.update.form({ halaqah: id }, { data: {...} })`. For MVP the index page offers create + delete; editing member lists is available through create/sync logic and covered by backend tests.

- [ ] **Step 8: Verify types, format, commit**

```bash
npm run types:check
vendor/bin/pint --dirty --format agent
git add routes/admin.php app/Http/Controllers/Admin/HalaqahController.php app/Http/Requests/Admin/Halaqah resources/js/pages/admin/halaqahs tests/Feature/Admin/HalaqahManagementTest.php
git commit -m "feat: admin halaqah management"
```

---

### Task 6: Admin navigation and full verification

**Files:**
- Modify: `resources/js/components/app-sidebar.tsx`
- Modify: `resources/js/components/nav-main.tsx`
- Test: existing suite only

**Interfaces:**
- Consumes: routes from Tasks 1-5, `usePage()` auth.user.role.
- Produces role-aware sidebar: admin sees links to all admin pages; non-admin sees only Dashboard until Phase 3/4 add their pages.

- [ ] **Step 1: Add admin nav items to the sidebar**

Edit `resources/js/components/app-sidebar.tsx`:

```tsx
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, BookMarked, FolderGit2, GraduationCap, HeartHandshake, LayoutGrid, Users } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { index as usersIndex } from '@/routes/admin/users';
import { index as santrisIndex } from '@/routes/admin/santris';
import { index as ustadzsIndex } from '@/routes/admin/ustadzs';
import { index as orangTuasIndex } from '@/routes/admin/orang-tuas';
import { index as halaqahsIndex } from '@/routes/admin/halaqahs';
import type { NavItem } from '@/types';

const adminNavItems: NavItem[] = [
    { title: 'Manajemen User', href: usersIndex(), icon: Users },
    { title: 'Manajemen Santri', href: santrisIndex(), icon: GraduationCap },
    { title: 'Manajemen Ustadz', href: ustadzsIndex(), icon: BookMarked },
    { title: 'Manajemen Orang Tua', href: orangTuasIndex(), icon: HeartHandshake },
    { title: 'Manajemen Halaqah', href: halaqahsIndex(), icon: FolderGit2 },
];

export function AppSidebar() {
    const { auth } = usePage().props;

    const mainNavItems: NavItem[] = [
        { title: 'Dashboard', href: dashboard(), icon: LayoutGrid },
        ...(auth.user?.role === 'admin' ? adminNavItems : []),
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
```

Note: `auth.user.role` requires the `User` model to expose `role` in the Inertia shared props — it is serialized automatically since `role` is a column on `users`. The `auth.user` type in `resources/js/types/auth.ts` already has `[key: string]: unknown`, so add explicit `role?: string` to be typesafe:

```ts
export type User = {
    id: number;
    name: string;
    email: string;
    role?: string;
    ...
};
```

Keep the existing `footerNavItems` array as-is.

- [ ] **Step 2: Verify types and run full suite**

```bash
npm run types:check
php artisan wayfinder:generate
php artisan test --compact
```

Expected: all green (existing dashboard/auth tests still pass because `role` defaults to `santri`).

- [ ] **Step 3: Format and commit**

```bash
vendor/bin/pint --dirty --format agent
git add resources/js/components/app-sidebar.tsx resources/js/types/auth.ts resources/js/components/nav-main.tsx
git commit -m "feat: role-aware sidebar navigation"
```

---

## Self-Review

1. **Spec coverage:** Phase 2 covers PRD §3 Admin role, MVP items 2-6 (manajemen user, santri, ustadz, orang tua, halaqah). Member linking handled via `santri_ids` sync. Parent linkage (`orang_tua_id`) covered in Task 2.
2. **Placeholder scan:** No TBDs. Each task contains full test code, request code, controller code, and page code.
3. **Type consistency:** Route names (`admin.users.*`, `admin.santris.*`, etc.) match `route()` calls in tests and wayfinder imports in pages. Controller action names (`store`, `update`, `destroy`) match `.form()` usage. Model relationship names (`user`, `orangTua`, `santris`, `ustadz`) match Phase 1.
4. **Ambiguity:** `OrangTua` delete behavior is explicitly documented as MVP cascade; the `Santri` FK to `orang_tuas` is `nullable` so children survive if FK were `nullOnDelete` — noted for a future hardening task.