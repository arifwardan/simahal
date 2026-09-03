import { Form } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import OrangTuaController from '@/actions/App/Http/Controllers/Admin/OrangTuaController';
import OrangTuaForm from '@/components/forms/OrangTuaForm';
import type { OrangTuaRow } from '@/components/forms/OrangTuaForm';
import Heading from '@/components/heading';
import PageContainer from '@/components/page-container';
import { Badge } from '@/components/ui/badge';
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
import { index } from '@/routes/admin/orang-tuas';

type Props = {
    orangTuas: PaginationMeta & { data: OrangTuaRow[] };
};

export default function AdminOrangTuasIndex({ orangTuas }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [editing, setEditing] = useState<OrangTuaRow | null>(null);

    const columns = useMemo<DataTableColumn<OrangTuaRow>[]>(
        () => [
            {
                id: 'nama',
                header: 'Orang Tua',
                cell: (row) => (
                    <div>
                        <p className="font-black text-black">{row.nama}</p>
                        <p className="text-xs font-bold text-black/70">{row.user.email}</p>
                    </div>
                ),
            },
            {
                id: 'anak',
                header: 'Anak',
                cell: (row) => (
                    <Badge className="border-2 border-black bg-[#FFD600] font-black text-black">
                        {row.santris_count} anak
                    </Badge>
                ),
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
                        <Form {...OrangTuaController.destroy.form({ orangTua: row.id })}>
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
            <Heading title="Manajemen Orang Tua" description="Kelola akun orang tua santri." />

            <Card className="overflow-hidden bg-[#FFE7A3]">
                <CardHeader className="bg-primary">
                    <CardTitle className="font-head font-black uppercase">
                        Daftar Orang Tua ({orangTuas.total})
                    </CardTitle>
                    <CardDescription className="font-bold text-black">
                        {orangTuas.total > 10
                            ? `${orangTuas.total} orang tua — otomatis paginasi 15/hal`
                            : 'Klik "Tambah Orang Tua" untuk menambah data baru.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 bg-[#FFF7E8] pt-6">
                    <Dialog open={showCreate} onOpenChange={setShowCreate}>
                        <DialogTrigger asChild>
                            <Button className="cursor-pointer border-[3px] border-black font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                                Tambah Orang Tua
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Tambah Orang Tua</DialogTitle>
                                <DialogDescription>Tambahkan akun orang tua santri.</DialogDescription>
                            </DialogHeader>
                            <OrangTuaForm onSuccess={() => setShowCreate(false)} />
                        </DialogContent>
                    </Dialog>

                    <DataTable
                        columns={columns}
                        data={orangTuas.data}
                        pagination={orangTuas}
                        perPage={5}
                        emptyMessage="Belum ada orang tua."
                    />
                </CardContent>
            </Card>

            <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
                <DialogContent key={editing?.id}>
                    <DialogHeader>
                        <DialogTitle>Edit Orang Tua</DialogTitle>
                        <DialogDescription>Perbarui akun orang tua santri.</DialogDescription>
                    </DialogHeader>
                    {editing && <OrangTuaForm nilaiAwal={editing} onSuccess={() => setEditing(null)} />}
                </DialogContent>
            </Dialog>
        </PageContainer>
    );
}

AdminOrangTuasIndex.layout = {
    breadcrumbs: [
        {
            title: 'Manajemen Orang Tua',
            href: index(),
        },
    ],
};
