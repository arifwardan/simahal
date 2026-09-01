import { Form, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import UserController from '@/actions/App/Http/Controllers/Admin/UserController';
import UserForm from '@/components/forms/UserForm';
import type { UserRow } from '@/components/forms/UserForm';
import Heading from '@/components/heading';
import PageContainer from '@/components/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    assignOptions: AssignOption;
};

export default function AdminUsersIndex({ users, roles, assignOptions }: Props) {
    const { auth } = usePage().props;
    const [editing, setEditing] = useState<UserRow | null>(null);
    const [assignSantriId, setAssignSantriId] = useState<string>('');
    const [assignOrangTuaId, setAssignOrangTuaId] = useState<string>('');

    return (
        <PageContainer>
            <Heading title="Manajemen User" description="Kelola akun dan peran pengguna SIMAHAL." />

            <Card className="overflow-hidden bg-[#FFE7A3]">
                <CardHeader className="bg-primary">
                    <CardTitle className="font-head font-black uppercase">Daftar User ({users.total})</CardTitle>
                    <CardDescription className="font-bold text-black">10 user per halaman — sisanya via pagination brutal.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 bg-[#FFF7E8] pt-6">
                    <div className="overflow-x-auto border-[3px] border-black">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b-[3px] border-black bg-black text-left text-white">
                                    <th className="px-3 py-3 font-head font-black uppercase">Nama</th>
                                    <th className="px-3 py-3 font-head font-black uppercase">Email</th>
                                    <th className="px-3 py-3 font-head font-black uppercase">Role</th>
                                    <th className="px-3 py-3 text-right font-head font-black uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-[3px] divide-black">
                                {users.data.map((user, idx) => (
                                    <tr
                                        key={user.id}
                                        className={`${idx % 3 === 0 ? 'bg-[#FFD600]' : idx % 3 === 1 ? 'bg-[#FF90E8]' : 'bg-[#5CE1E6]'} hover:brightness-95`}
                                    >
                                        <td className="px-3 py-3 font-black text-black">{user.name}</td>
                                        <td className="px-3 py-3 font-bold text-black">{user.email}</td>
                                        <td className="px-3 py-3">
                                            <Badge className="border-2 border-black bg-black text-white">{user.role_label}</Badge>
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setEditing(user)}
                                                    className="border-[2.5px] border-black font-black"
                                                >
                                                    Edit
                                                </Button>
                                                {auth.user.id !== user.id && (
                                                    <Form
                                                        action={UserController.destroy.url({ user: user.id })}
                                                        method="delete"
                                                    >
                                                        <Button
                                                            type="submit"
                                                            variant="destructive"
                                                            size="sm"
                                                            className="border-[2.5px] border-black font-black"
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

                    {users.last_page > 1 && (
                        <div className="flex flex-wrap items-center justify-between gap-2 border-[3px] border-black bg-[#FFF7E8] p-2">
                            <span className="px-2 text-xs font-black uppercase">
                                Hal {users.current_page} dari {users.last_page} · {users.total} user
                            </span>
                            <div className="flex gap-1">
                                {users.links.map((link, i) => {
                                    if (!link.url) {
                                        return (
                                            <span
                                                key={i}
                                                className="border-2 border-black bg-[#FFF7E8] px-3 py-1 text-xs font-black opacity-40"
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        );
                                    }
                                    return (
                                        <Link
                                            key={i}
                                            href={link.url}
                                            preserveState
                                            preserveScroll
                                            className={`border-[3px] border-black px-3 py-1 text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${link.active ? 'bg-primary text-black' : 'bg-[#FFF7E8] text-black hover:bg-accent'}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Assign Orang Tua ↔ Santri */}
            <Card className="overflow-hidden bg-[#5CE1E6]">
                <CardHeader className="bg-black text-white">
                    <CardTitle className="font-head font-black uppercase">Assign Orang Tua ↔ Santri</CardTitle>
                    <CardDescription className="font-bold text-white/80">
                        Kelola hubungan orang tua — pilih santri dan orang tuanya, lalu Assign. Kosongkan untuk lepas.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 bg-[#FFF7E8] pt-6">
                    {/* Quick assign */}
                    <div className="grid gap-3 border-[3px] border-black bg-white p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
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
                            className="h-11 border-[3px] border-black font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
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
                                    { preserveScroll: true }
                                );
                            }}
                        >
                            Assign
                        </Button>
                    </div>

                    {/* Daftar assignments */}
                    <div className="overflow-x-auto border-[3px] border-black">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b-[3px] border-black bg-black text-left text-white">
                                    <th className="px-3 py-3 font-head font-black uppercase">Santri</th>
                                    <th className="px-3 py-3 font-head font-black uppercase">Orang Tua</th>
                                    <th className="px-3 py-3 text-right font-head font-black uppercase">Assign</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-[3px] divide-black">
                                {assignOptions.assignments.map((s, idx) => (
                                    <tr
                                        key={s.id}
                                        className={`${idx % 2 === 0 ? 'bg-white' : 'bg-[#FFE7A3]'} hover:brightness-95`}
                                    >
                                        <td className="px-3 py-3">
                                            <p className="font-black text-black">{s.nama}</p>
                                            <p className="text-xs font-bold text-black/70">{s.nis ?? '-'}</p>
                                        </td>
                                        <td className="px-3 py-3">
                                            {s.orang_tua_nama ? (
                                                <Badge className="border-2 border-black bg-[#FFD600] text-black">
                                                    {s.orang_tua_nama}
                                                </Badge>
                                            ) : (
                                                <span className="border-2 border-dashed border-black bg-white px-2 py-1 text-xs font-black">
                                                    Belum ada
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            <Form
                                                action={UserController.assignOrangTua.url({ santri: s.id })}
                                                method="patch"
                                                className="inline-flex items-center gap-2"
                                            >
                                                {({ errors }: { errors: Record<string, string> }) => (
                                                    <>
                                                        <select
                                                            name="orang_tua_id"
                                                            defaultValue={s.orang_tua_id ? String(s.orang_tua_id) : ''}
                                                            className="h-9 border-[3px] border-black bg-white px-2 text-sm font-bold"
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
                                                            className="border-[2.5px] border-black font-black"
                                                        >
                                                            Simpan
                                                        </Button>
                                                    </>
                                                )}
                                            </Form>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-xs font-bold">Pilih santri di atas untuk assign cepat, atau ubah per baris di tabel lalu Simpan.</p>
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
