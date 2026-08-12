import { Form, usePage } from '@inertiajs/react';
import { useState } from 'react';
import UserController from '@/actions/App/Http/Controllers/Admin/UserController';
import UserForm from '@/components/forms/UserForm';
import type { UserRow } from '@/components/forms/UserForm';
import Heading from '@/components/heading';
import PageContainer from '@/components/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { index } from '@/routes/admin/users';

type Props = {
    users: { data: UserRow[]; total: number };
    roles: { value: string; label: string }[];
};

export default function AdminUsersIndex({ users, roles }: Props) {
    const { auth } = usePage().props;
    const [showCreate, setShowCreate] = useState(false);
    const [editing, setEditing] = useState<UserRow | null>(null);

    return (
        <PageContainer>
            <Heading
                title="Manajemen User"
                description="Kelola akun dan peran pengguna SIMAHAL."
            />

            <Card>
                <CardHeader>
                    <CardTitle>Daftar User ({users.total})</CardTitle>
                    <CardDescription>
                        Klik "Buat User" untuk menambah akun baru.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Dialog open={showCreate} onOpenChange={setShowCreate}>
                        <DialogTrigger asChild>
                            <Button>Buat User</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Buat User</DialogTitle>
                                <DialogDescription>
                                    Tambahkan akun pengguna baru ke SIMAHAL.
                                </DialogDescription>
                            </DialogHeader>
                            <UserForm
                                roles={roles}
                                onSuccess={() => setShowCreate(false)}
                            />
                        </DialogContent>
                    </Dialog>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-muted-foreground">
                                    <th className="py-2 pr-4">Nama</th>
                                    <th className="py-2 pr-4">Email</th>
                                    <th className="py-2 pr-4">Role</th>
                                    <th className="py-2 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.data.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="border-b last:border-0"
                                    >
                                        <td className="py-2 pr-4 font-medium">
                                            {user.name}
                                        </td>
                                        <td className="py-2 pr-4">
                                            {user.email}
                                        </td>
                                        <td className="py-2 pr-4">
                                            <Badge>{user.role_label}</Badge>
                                        </td>
                                        <td className="py-2 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        setEditing(user)
                                                    }
                                                >
                                                    Edit
                                                </Button>
                                                {auth.user.id !== user.id && (
                                                    <Form
                                                        {...UserController.destroy.form(
                                                            { user: user.id },
                                                        )}
                                                    >
                                                        <Button
                                                            type="submit"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-destructive"
                                                        >
                                                            Hapus
                                                        </Button>
                                                    </Form>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Dialog
                open={editing !== null}
                onOpenChange={(open) => !open && setEditing(null)}
            >
                <DialogContent key={editing?.id}>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>
                            Perbarui akun pengguna.
                        </DialogDescription>
                    </DialogHeader>
                    {editing && (
                        <UserForm
                            roles={roles}
                            nilaiAwal={editing}
                            onSuccess={() => setEditing(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </PageContainer>
    );
}

AdminUsersIndex.layout = {
    breadcrumbs: [
        {
            title: 'Manajemen User',
            href: index(),
        },
    ],
};
