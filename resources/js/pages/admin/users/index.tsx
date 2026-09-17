import { Form, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import UserController from '@/actions/App/Http/Controllers/Admin/UserController';
import UserForm from '@/components/forms/UserForm';
import type { UserRow } from '@/components/forms/UserForm';
import Heading from '@/components/heading';
import PageContainer from '@/components/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
} from '@/components/ui/dialog';
import { index } from '@/routes/admin/users';

type AssignOption = {
    santris: { id: number; nama: string; nis: string | null; orang_tua_id: number | null }[];
    orangTuas: { id: number; nama: string }[];
    assignments: { id: number; nama: string; nis: string | null; orang_tua_id: number | null; orang_tua_nama: string | null }[];
};

type Props = {
    users: {
        data: UserRow[];
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
    };
    roles: { value: string; label: string }[];
    statuses: { value: string; label: string }[];
    pendingCount: number;
    pendingUsers: { id: number; name: string; email: string }[];
    assignOptions: AssignOption;
};

export default function AdminUsersIndex({ users, roles, statuses, pendingCount, pendingUsers, assignOptions }: Props) {
    const { auth } = usePage().props;
    const [editing, setEditing] = useState<UserRow | null>(null);
    const [assignSantriId, setAssignSantriId] = useState<string>('');
    const [assignOrangTuaId, setAssignOrangTuaId] = useState<string>('');

    const userColumns = useMemo<DataTableColumn<UserRow>[]>(
        () => [
            {
                id: 'nama',
                header: 'Nama',
                cell: (row) => <span className="font-black text-black">{row.name}</span>,
            },
            {
                id: 'email',
                header: 'Email',
                cell: (row) => <span className="font-bold text-black">{row.email}</span>,
            },
            {
                id: 'role',
                header: 'Role',
                cell: (row) => (
                    <Badge className="border-2 border-black dark:border-[#FFF7E8] bg-black text-[#FFF7E8]">{row.role_label}</Badge>
                ),
            },
            {
                id: 'status',
                header: 'Status',
                cell: (row) =>
                    row.status === 'pending' ? (
                        <Badge className="border-2 border-black dark:border-[#FFF7E8] bg-[#FFD600] text-black">Menunggu</Badge>
                    ) : (
                        <Badge className="border-2 border-black dark:border-[#FFF7E8] bg-[#7CFC00] text-black">Aktif</Badge>
                    ),
            },
            {
                id: 'aksi',
                header: 'Aksi',
                headerClassName: 'text-right',
                className: 'text-right',
                cell: (row) => (
                    <div className="flex items-center justify-end gap-2">
                        {row.status === 'pending' && auth.user.id !== row.id && (
                            <Form
                                action={UserController.approve.url({ user: row.id })}
                                method="patch"
                            >
                                <Button
                                    type="submit"
                                    size="sm"
                                    className="cursor-pointer border-[2.5px] border-black dark:border-[#FFF7E8] bg-[#7CFC00] font-black text-black"
                                >
                                    Setujui
                                </Button>
                            </Form>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditing(row)}
                            className="cursor-pointer border-[2.5px] border-black dark:border-[#FFF7E8] font-black"
                        >
                            Edit
                        </Button>
                        {auth.user.id !== row.id && (
                            <Form action={UserController.destroy.url({ user: row.id })} method="delete">
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    size="sm"
                                    className="cursor-pointer border-[2.5px] border-black dark:border-[#FFF7E8] font-black"
                                >
                                    Hapus
                                </Button>
                            </Form>
                        )}
                    </div>
                ),
            },
        ],
        [auth.user.id],
    );

    const assignmentColumns = useMemo<
        DataTableColumn<AssignOption['assignments'][number]>[]
    >(
        () => [
            {
                id: 'santri',
                header: 'Santri',
                cell: (row) => (
                    <div>
                        <p className="font-black text-black">{row.nama}</p>
                        <p className="text-xs font-bold text-black/70">{row.nis ?? '-'}</p>
                    </div>
                ),
            },
            {
                id: 'orang_tua',
                header: 'Orang Tua',
                cell: (row) =>
                    row.orang_tua_nama ? (
                        <Badge className="border-2 border-black dark:border-[#FFF7E8] bg-[#FFD600] text-black">
                            {row.orang_tua_nama}
                        </Badge>
                    ) : (
                        <span className="border-2 border-dashed border-black dark:border-[#FFF7E8] bg-[#FFF7E8] dark:bg-zinc-900 px-2 py-1 text-xs font-black">
                            Belum ada
                        </span>
                    ),
            },
            {
                id: 'assign',
                header: 'Assign',
                headerClassName: 'text-right',
                className: 'text-right',
                cell: (row) => (
                    <Form
                        action={UserController.assignOrangTua.url({ santri: row.id })}
                        method="patch"
                        className="inline-flex items-center gap-2"
                    >
                        <select
                            name="orang_tua_id"
                            defaultValue={row.orang_tua_id ? String(row.orang_tua_id) : ''}
                            className="h-9 cursor-pointer border-[3px] border-black dark:border-[#FFF7E8] bg-[#FFF7E8] dark:bg-zinc-900 px-2 text-sm font-bold"
                        >
                            <option value="">— Lepas —</option>
                            {assignOptions.orangTuas.map((o) => (
                                <option key={o.id} value={String(o.id)}>
                                    {o.nama}
                                </option>
                            ))}
                        </select>
                        <Button
                            type="submit"
                            size="sm"
                            className="cursor-pointer border-[2.5px] border-black dark:border-[#FFF7E8] font-black"
                        >
                            Simpan
                        </Button>
                    </Form>
                ),
            },
        ],
        [assignOptions.orangTuas],
    );

    return (
        <PageContainer>
            <Heading title="Manajemen User" description="Kelola akun dan peran pengguna SIMAHAL." />

            <Card className="overflow-hidden bg-[#FFE7A3] dark:bg-zinc-900">
                <CardHeader className="bg-primary">
                    <CardTitle className="font-head font-black uppercase">Daftar User ({users.total})</CardTitle>
                    <CardDescription className="font-bold text-black">
                        10 user per halaman — sisanya via pagination brutal.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 bg-[#FFF7E8] dark:bg-zinc-900 pt-6">
                    <DataTable
                        columns={userColumns}
                        data={users.data}
                        pagination={users}
                        emptyMessage="Belum ada user."
                    />
                </CardContent>
            </Card>

            {/* Menunggu Persetujuan */}
            {pendingUsers.length > 0 && (
                <Card className="overflow-hidden bg-[#FFD600]">
                    <CardHeader className="bg-black text-[#FFF7E8]">
                        <CardTitle className="font-head font-black uppercase">
                            Menunggu Persetujuan ({pendingCount})
                        </CardTitle>
                        <CardDescription className="font-bold text-[#FFF7E8]/80">
                            Akun baru hasil registrasi mandiri. Setujui untuk mengaktifkan, atau Tolak (hapus) untuk
                            menolak.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 bg-[#FFF7E8] dark:bg-zinc-900 pt-6">
                        {pendingUsers.map((user) => (
                            <div
                                key={user.id}
                                className="flex flex-col gap-3 border-[3px] border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 p-3 sm:flex-row sm:items-center"
                            >
                                <div className="flex-1">
                                    <p className="font-black text-black">{user.name}</p>
                                    <p className="text-sm font-bold text-black/70">{user.email}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {auth.user.id !== user.id && (
                                        <Form
                                            action={UserController.approve.url({ user: user.id })}
                                            method="patch"
                                        >
                                            <Button
                                                type="submit"
                                                size="sm"
                                                className="cursor-pointer border-[2.5px] border-black dark:border-[#FFF7E8] bg-[#7CFC00] font-black text-black"
                                            >
                                                Setujui
                                            </Button>
                                        </Form>
                                    )}
                                    {auth.user.id !== user.id && (
                                        <Form
                                            action={UserController.destroy.url({ user: user.id })}
                                            method="delete"
                                        >
                                            <Button
                                                type="submit"
                                                variant="destructive"
                                                size="sm"
                                                className="cursor-pointer border-[2.5px] border-black dark:border-[#FFF7E8] font-black"
                                            >
                                                Tolak
                                            </Button>
                                        </Form>
                                    )}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Assign Orang Tua ↔ Santri */}
            <Card className="overflow-hidden bg-[#5CE1E6]">
                <CardHeader className="bg-black text-[#FFF7E8]">
                    <CardTitle className="font-head font-black uppercase">Assign Orang Tua ↔ Santri</CardTitle>
                    <CardDescription className="font-bold text-[#FFF7E8]/80">
                        Kelola hubungan orang tua — pilih santri dan orang tuanya, lalu Assign. Kosongkan untuk
                        lepas.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 bg-[#FFF7E8] dark:bg-zinc-900 pt-6">
                    {/* Quick assign */}
                    <div className="grid gap-3 border-[3px] border-black dark:border-[#FFF7E8] bg-[#FFF7E8] dark:bg-zinc-900 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                        <div className="grid gap-2">
                            <Label className="font-black uppercase">Santri</Label>
                            <Select value={assignSantriId} onValueChange={setAssignSantriId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih santri" />
                                </SelectTrigger>
                                <SelectContent>
                                    {assignOptions.santris.map((s) => (
                                        <SelectItem key={s.id} value={String(s.id)}>
                                            {s.nama} {s.nis ? `(${s.nis})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label className="font-black uppercase">Orang Tua</Label>
                            <Select value={assignOrangTuaId} onValueChange={setAssignOrangTuaId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih orang tua (kosongkan = lepas)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">— Tanpa Orang Tua (Lepas) —</SelectItem>
                                    {assignOptions.orangTuas.map((o) => (
                                        <SelectItem key={o.id} value={String(o.id)}>
                                            {o.nama}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            className="h-11 cursor-pointer border-[3px] border-black dark:border-[#FFF7E8] font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]"
                            disabled={!assignSantriId}
                            onClick={() => {
                                if (!assignSantriId) return;
                                const orangTuaId =
                                    assignOrangTuaId && assignOrangTuaId !== '__none__'
                                        ? Number(assignOrangTuaId)
                                        : null;
                                router.patch(
                                    UserController.assignOrangTua.url({ santri: Number(assignSantriId) }),
                                    { orang_tua_id: orangTuaId },
                                    { preserveScroll: true },
                                );
                            }}
                        >
                            Assign
                        </Button>
                    </div>

                    <DataTable
                        columns={assignmentColumns}
                        data={assignOptions.assignments}
                        emptyMessage="Belum ada data santri."
                        perPage={5}
                    />
                    <p className="text-xs font-bold">
                        Pilih santri di atas untuk assign cepat, atau ubah per baris di tabel lalu Simpan. Otomatis
                        paginasi jika &gt;10 data.
                    </p>
                </CardContent>
            </Card>

            <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
                <DialogContent key={editing?.id}>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>Perbarui akun pengguna.</DialogDescription>
                    </DialogHeader>
                    {editing && (
                        <UserForm
                            roles={roles}
                            statuses={statuses}
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
