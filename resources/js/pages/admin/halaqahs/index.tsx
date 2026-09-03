import { Form } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import HalaqahController from '@/actions/App/Http/Controllers/Admin/HalaqahController';
import HalaqahForm from '@/components/forms/HalaqahForm';
import type { HalaqahRow } from '@/components/forms/HalaqahForm';
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
import { index } from '@/routes/admin/halaqahs';

type Option = { value: string; label: string };

type Props = {
    halaqahs: PaginationMeta & { data: HalaqahRow[] };
    muhafidzs: { id: number; nama: string }[];
    statuses: Option[];
};

export default function AdminHalaqahsIndex({ halaqahs, muhafidzs, statuses }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [editing, setEditing] = useState<HalaqahRow | null>(null);

    const statusLabel = (value: string): string =>
        statuses.find((s) => s.value === value)?.label ?? value;

    const columns = useMemo<DataTableColumn<HalaqahRow>[]>(
        () => [
            {
                id: 'nama',
                header: 'Halaqah',
                cell: (row) => (
                    <div>
                        <p className="font-black text-black">{row.nama}</p>
                        <p className="text-xs font-bold text-black/70">
                            {row.jam_mulai && row.jam_selesai ? `${row.jam_mulai} - ${row.jam_selesai}` : '-'}
                        </p>
                    </div>
                ),
            },
            {
                id: 'muhafidz',
                header: 'Muhafidz',
                cell: (row) => (
                    <span className="font-bold text-black">{row.muhafidz?.nama ?? '-'}</span>
                ),
            },
            {
                id: 'santri',
                header: 'Santri',
                headerClassName: 'text-center',
                className: 'text-center',
                cell: (row) => (
                    <Badge className="border-2 border-black bg-[#FFD600] font-black text-black">
                        {row.santris_count}
                    </Badge>
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
                        <Form {...HalaqahController.destroy.form({ halaqah: row.id })}>
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
            <Heading
                title="Manajemen Halaqah"
                description="Kelola halaqah, penugasan muhafidz/pembimbing, dan jadwal halaqah."
            />

            <Card className="overflow-hidden bg-[#FFE7A3]">
                <CardHeader className="bg-primary">
                    <CardTitle className="font-head font-black uppercase">
                        Daftar Halaqah ({halaqahs.total})
                    </CardTitle>
                    <CardDescription className="font-bold text-black">
                        {halaqahs.total > 10
                            ? `${halaqahs.total} halaqah — otomatis paginasi 15/hal`
                            : 'Klik "Tambah Halaqah" untuk menambah data baru.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 bg-[#FFF7E8] pt-6">
                    <Dialog open={showCreate} onOpenChange={setShowCreate}>
                        <DialogTrigger asChild>
                            <Button className="cursor-pointer border-[3px] border-black font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                                Tambah Halaqah
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[calc(100%-2rem)] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Tambah Halaqah</DialogTitle>
                                <DialogDescription>
                                    Buat halaqah, tetapkan muhafidz/pembimbing, dan atur jam halaqah.
                                </DialogDescription>
                            </DialogHeader>
                            <HalaqahForm
                                muhafidzs={muhafidzs}
                                statuses={statuses}
                                onSuccess={() => setShowCreate(false)}
                            />
                        </DialogContent>
                    </Dialog>

                    <DataTable
                        columns={columns}
                        data={halaqahs.data}
                        pagination={halaqahs}
                        perPage={5}
                        emptyMessage="Belum ada halaqah."
                    />
                </CardContent>
            </Card>

            <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
                <DialogContent key={editing?.id} className="max-h-[calc(100%-2rem)] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Halaqah</DialogTitle>
                        <DialogDescription>Perbarui penugasan muhafidz/pembimbing dan jam halaqah.</DialogDescription>
                    </DialogHeader>
                    {editing && (
                        <HalaqahForm
                            nilaiAwal={editing}
                            muhafidzs={muhafidzs}
                            statuses={statuses}
                            onSuccess={() => setEditing(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </PageContainer>
    );
}

AdminHalaqahsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Manajemen Halaqah',
            href: index(),
        },
    ],
};
