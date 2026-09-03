import { Form } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import MuhafidzController from '@/actions/App/Http/Controllers/Admin/MuhafidzController';
import MuhafidzForm from '@/components/forms/MuhafidzForm';
import type { MuhafidzRow } from '@/components/forms/MuhafidzForm';
import Heading from '@/components/heading';
import PageContainer from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn, type PaginationMeta } from '@/components/ui/data-table';
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
import { index } from '@/routes/admin/muhafidzs';

type Props = {
    muhafidzs: PaginationMeta & { data: MuhafidzRow[] };
};

export default function AdminMuhafidzsIndex({ muhafidzs }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [editing, setEditing] = useState<MuhafidzRow | null>(null);

    const columns = useMemo<DataTableColumn<MuhafidzRow>[]>(
        () => [
            {
                id: 'nama',
                header: 'Muhafidz',
                cell: (row) => (
                    <div>
                        <p className="font-black text-black">{row.nama}</p>
                        <p className="text-xs font-bold text-black/70">{row.user.email}</p>
                    </div>
                ),
            },
            {
                id: 'kontak',
                header: 'Kontak',
                cell: (row) => <span className="font-bold text-black">{row.kontak ?? '-'}</span>,
            },
            {
                id: 'aksi',
                header: 'Aksi',
                headerClassName: 'text-right',
                className: 'text-right',
                cell: (row) => (
                    <div className="flex items-center justify-end gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditing(row)}
                            className="cursor-pointer border-[2.5px] border-black font-black"
                        >
                            Edit
                        </Button>
                        <Form {...MuhafidzController.destroy.form({ muhafidz: row.id })}>
                            <Button
                                type="submit"
                                variant="destructive"
                                size="sm"
                                className="cursor-pointer border-[2.5px] border-black font-black"
                            >
                                Hapus
                            </Button>
                        </Form>
                    </div>
                ),
            },
        ],
        [],
    );

    return (
        <PageContainer>
            <Heading title="Manajemen Muhafidz" description="Kelola data muhafidz dan akun loginnya." />

            <Card className="overflow-hidden bg-[#FFE7A3]">
                <CardHeader className="bg-primary">
                    <CardTitle className="font-head font-black uppercase">
                        Daftar Muhafidz ({muhafidzs.total})
                    </CardTitle>
                    <CardDescription className="font-bold text-black">
                        {muhafidzs.total > 10
                            ? `${muhafidzs.total} muhafidz — otomatis paginasi 15/hal`
                            : 'Klik "Tambah Muhafidz" untuk menambah data baru.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 bg-[#FFF7E8] pt-6">
                    <Dialog open={showCreate} onOpenChange={setShowCreate}>
                        <DialogTrigger asChild>
                            <Button className="cursor-pointer border-[3px] border-black font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                                Tambah Muhafidz
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Tambah Muhafidz</DialogTitle>
                                <DialogDescription>Tambahkan data muhafidz dan akun loginnya.</DialogDescription>
                            </DialogHeader>
                            <MuhafidzForm onSuccess={() => setShowCreate(false)} />
                        </DialogContent>
                    </Dialog>

                    <DataTable
                        columns={columns}
                        data={muhafidzs.data}
                        pagination={muhafidzs}
                        perPage={5}
                        emptyMessage="Belum ada muhafidz."
                    />
                </CardContent>
            </Card>

            <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
                <DialogContent key={editing?.id}>
                    <DialogHeader>
                        <DialogTitle>Edit Muhafidz</DialogTitle>
                        <DialogDescription>Perbarui data muhafidz dan akun loginnya.</DialogDescription>
                    </DialogHeader>
                    {editing && <MuhafidzForm nilaiAwal={editing} onSuccess={() => setEditing(null)} />}
                </DialogContent>
            </Dialog>
        </PageContainer>
    );
}

AdminMuhafidzsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Manajemen Muhafidz',
            href: index(),
        },
    ],
};
