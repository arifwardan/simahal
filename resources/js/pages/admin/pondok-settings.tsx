import { Form, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import PondokSettingsController from '@/actions/App/Http/Controllers/Admin/PondokSettingsController';
import Heading from '@/components/heading';
import PageContainer from '@/components/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { edit } from '@/routes/admin/pondok-settings';

type PersonRow = {
    id: number;
    name: string;
    email: string;
    role: string;
    role_label: string;
};

type SantriOption = {
    id: number;
    nama: string;
};

type Props = {
    pondok: {
        id: number;
        nama_yayasan: string;
        slug: string;
        logo_url: string | null;
    };
    pendings: PersonRow[];
    users: PersonRow[];
    santris: SantriOption[];
};

export default function PondokSettings({ pondok, pendings, users, santris = [] }: Props) {
    const [selected, setSelected] = useState<Record<number, number[]>>({});

    function toggleSantri(rowId: number, santriId: number) {
        setSelected((prev) => {
            const current = prev[rowId] ?? [];
            return {
                ...prev,
                [rowId]: current.includes(santriId)
                    ? current.filter((id) => id !== santriId)
                    : [...current, santriId],
            };
        });
    }

    function approve(row: PersonRow) {
        const payload =
            row.role === 'orang_tua' ? { santri_ids: selected[row.id] ?? [] } : {};
        router.post(PondokSettingsController.approve.url({ user: row.id }), payload, {
            preserveScroll: true,
        });
    }
    const pendingColumns = useMemo<DataTableColumn<PersonRow>[]>(
        () => [
            {
                id: 'nama',
                header: 'Nama',
                cell: (row) => (
                    <div>
                        <p className="font-black text-black">{row.name}</p>
                        <p className="text-xs font-bold text-black/70">{row.email}</p>
                    </div>
                ),
            },
            {
                id: 'role',
                header: 'Role',
                cell: (row) => (
                    <Badge className="border-2 border-black bg-[#FFD600] text-black">
                        {row.role_label}
                    </Badge>
                ),
            },
            {
                id: 'aksi',
                header: 'Aksi',
                headerClassName: 'text-right',
                className: 'text-right',
                cell: (row) => (
                    <div className="flex flex-col items-end gap-2">
                        {row.role === 'orang_tua' && (
                            <div className="grid max-h-32 w-full gap-1 overflow-y-auto border-[2.5px] border-black bg-white p-2 text-left">
                                {santris.length === 0 && (
                                    <span className="text-xs font-bold">Belum ada santri.</span>
                                )}
                                {santris.map((s) => (
                                    <label
                                        key={s.id}
                                        className="flex cursor-pointer items-center gap-2 text-xs font-bold text-black"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={(selected[row.id] ?? []).includes(s.id)}
                                            onChange={() => toggleSantri(row.id, s.id)}
                                        />
                                        {s.nama}
                                    </label>
                                ))}
                            </div>
                        )}
                        <div className="flex items-center justify-end gap-2">
                        <Button
                            size="sm"
                            className="cursor-pointer border-[2.5px] border-black font-black"
                            onClick={() => approve(row)}
                        >
                            Setujui
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="cursor-pointer border-[2.5px] border-black font-black"
                            onClick={() =>
                                router.delete(
                                    PondokSettingsController.reject.url({ user: row.id }),
                                    { preserveScroll: true },
                                )
                            }
                        >
                            Tolak
                        </Button>
                        </div>
                    </div>
                ),
            },
        ],
        [santris, selected],
    );

    const userColumns = useMemo<DataTableColumn<PersonRow>[]>(
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
                    <Badge className="border-2 border-black bg-black text-[#FFF7E8]">
                        {row.role_label}
                    </Badge>
                ),
            },
        ],
        [],
    );

    return (
        <PageContainer>
            <Heading
                title="Pengaturan Pondok"
                description="Kelola branding yayasan dan persetujuan gabung pondok."
            />

            <Card className="overflow-hidden bg-[#FFE7A3]">
                <CardHeader className="bg-primary">
                    <CardTitle className="font-head font-black uppercase">
                        Branding Yayasan
                    </CardTitle>
                    <CardDescription className="font-bold text-black">
                        Slug {pondok.slug} terkunci — hanya nama dan logo yang bisa diubah.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 bg-[#FFF7E8] pt-6">
                    <Form
                        action={PondokSettingsController.update.url()}
                        method="patch"
                        className="grid gap-4"
                    >
                        <div className="grid gap-2">
                            <Label htmlFor="nama_yayasan" className="font-black uppercase">
                                Nama Yayasan
                            </Label>
                            <Input
                                id="nama_yayasan"
                                name="nama_yayasan"
                                defaultValue={pondok.nama_yayasan}
                                required
                                maxLength={150}
                                className="border-[3px] border-black font-bold"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="logo" className="font-black uppercase">
                                Logo (jpg/png, maks 2MB)
                            </Label>
                            {pondok.logo_url && (
                                <img
                                    src={pondok.logo_url}
                                    alt="Logo pondok"
                                    className="h-16 w-16 border-[3px] border-black object-cover"
                                />
                            )}
                            <Input
                                id="logo"
                                name="logo"
                                type="file"
                                accept=".jpg,.jpeg,.png"
                                className="cursor-pointer border-[3px] border-black font-bold"
                            />
                        </div>
                        <div>
                            <Button
                                type="submit"
                                className="cursor-pointer border-[3px] border-black font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                            >
                                Simpan
                            </Button>
                        </div>
                    </Form>
                </CardContent>
            </Card>

            <Card className="overflow-hidden bg-[#FF9F1C]">
                <CardHeader className="bg-black text-[#FFF7E8]">
                    <CardTitle className="font-head font-black uppercase">
                        Persetujuan Gabung ({pendings.length})
                    </CardTitle>
                    <CardDescription className="font-bold text-[#FFF7E8]/80">
                        Setujui untuk mengaktifkan akun, tolak untuk menghapusnya.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 bg-[#FFF7E8] pt-6">
                    <DataTable
                        columns={pendingColumns}
                        data={pendings}
                        emptyMessage="Tidak ada pengajuan gabung."
                    />
                </CardContent>
            </Card>

            <Card className="overflow-hidden bg-[#5CE1E6]">
                <CardHeader className="bg-primary">
                    <CardTitle className="font-head font-black uppercase">
                        Pengguna Pondok ({users.length})
                    </CardTitle>
                    <CardDescription className="font-bold text-black">
                        Semua akun aktif di pondok ini.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 bg-[#FFF7E8] pt-6">
                    <DataTable
                        columns={userColumns}
                        data={users}
                        emptyMessage="Belum ada pengguna."
                    />
                </CardContent>
            </Card>
        </PageContainer>
    );
}

PondokSettings.layout = {
    breadcrumbs: [
        {
            title: 'Pengaturan Pondok',
            href: edit(),
        },
    ],
};
