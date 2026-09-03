import { Form } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import SantriController from '@/actions/App/Http/Controllers/Admin/SantriController';
import SantriForm from '@/components/forms/SantriForm';
import type { SantriRow } from '@/components/forms/SantriForm';
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
import { index } from '@/routes/admin/santris';

type Option = { value: string; label: string };

type Props = {
    santris: PaginationMeta & { data: SantriRow[] };
    orangTuas: { id: number; nama: string }[];
    statuses: Option[];
    jenisOptions: Option[];
};

export default function AdminSantrisIndex({ santris, orangTuas, statuses, jenisOptions }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [editing, setEditing] = useState<SantriRow | null>(null);

    const statusLabel = (value: string): string => statuses.find((s) => s.value === value)?.label ?? value;

    const columns = useMemo<DataTableColumn<SantriRow>[]>(
        () => [
            {
                id: 'nama',
                header: 'Santri',
                cell: (row) => (
                    <div>
                        <p className="font-black text-black">
                            {row.nama} {row.nis ? `(${row.nis})` : ''}
                        </p>
                        <p className="text-xs font-bold text-black/70">{row.user.email}</p>
                    </div>
                ),
            },
            {
                id: 'nis',
                header: 'NIS',
                cell: (row) => (
                    <span className="font-bold text-black">{row.nis ?? '-'}</span>
                ),
            },
            {
                id: 'status',
                header: 'Status',
                cell: (row) => (
                    <Badge className="border-2 border-black bg-black text-[#FFF7E8]">
                        {statusLabel(row.status)}
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
                        <Form {...SantriController.destroy.form({ santri: row.id })}>
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
        [statuses],
    );

    return (
        <PageContainer>
            <Heading title="Manajemen Santri" description="Kelola data santri dan akun loginnya." />

            <Card className="overflow-hidden bg-[#FFE7A3]">
                <CardHeader className="bg-primary">
                    <CardTitle className="font-head font-black uppercase">
                        Daftar Santri ({santris.total})
                    </CardTitle>
                    <CardDescription className="font-bold text-black">
                        {santris.total > 10
                            ? `${santris.total} santri — otomatis paginasi 15/hal`
                            : 'Klik "Tambah Santri" untuk menambah data baru.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 bg-[#FFF7E8] pt-6">
                    <Dialog open={showCreate} onOpenChange={setShowCreate}>
                        <DialogTrigger asChild>
                            <Button className="cursor-pointer border-[3px] border-black font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                                Tambah Santri
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[calc(100%-2rem)] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Tambah Santri</DialogTitle>
                                <DialogDescription>Tambahkan data santri dan akun loginnya.</DialogDescription>
                            </DialogHeader>
                            <SantriForm
                                orangTuas={orangTuas}
                                statuses={statuses}
                                jenisOptions={jenisOptions}
                                onSuccess={() => setShowCreate(false)}
                            />
                        </DialogContent>
                    </Dialog>

                    <DataTable
                        columns={columns}
                        data={santris.data}
                        pagination={santris}
                        perPage={5}
                        emptyMessage="Belum ada santri."
                    />
                </CardContent>
            </Card>

            <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
                <DialogContent key={editing?.id} className="max-h-[calc(100%-2rem)] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Santri</DialogTitle>
                        <DialogDescription>Perbarui data santri dan akun loginnya.</DialogDescription>
                    </DialogHeader>
                    {editing && (
                        <SantriForm
                            nilaiAwal={editing}
                            orangTuas={orangTuas}
                            statuses={statuses}
                            jenisOptions={jenisOptions}
                            onSuccess={() => setEditing(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </PageContainer>
    );
}

AdminSantrisIndex.layout = {
    breadcrumbs: [
        {
            title: 'Manajemen Santri',
            href: index(),
        },
    ],
};
