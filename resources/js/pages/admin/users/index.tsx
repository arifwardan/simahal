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
