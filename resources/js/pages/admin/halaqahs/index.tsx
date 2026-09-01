import { Form } from '@inertiajs/react';
import { useState } from 'react';
import HalaqahController from '@/actions/App/Http/Controllers/Admin/HalaqahController';
import HalaqahForm from '@/components/forms/HalaqahForm';
import type { HalaqahRow } from '@/components/forms/HalaqahForm';
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
import { index } from '@/routes/admin/halaqahs';

type Option = { value: string; label: string };

type Props = {
    halaqahs: { data: HalaqahRow[]; total: number };
    muhafidzs: { id: number; nama: string }[];
    statuses: Option[];
};

export default function AdminHalaqahsIndex({
    halaqahs,
    muhafidzs,
    statuses,
}: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [editing, setEditing] = useState<HalaqahRow | null>(null);

    const statusLabel = (value: string): string =>
        statuses.find((s) => s.value === value)?.label ?? value;

    return (
        <PageContainer>
            <Heading
                title="Manajemen Halaqah"
                description="Kelola halaqah, penugasan muhafidz/pembimbing, dan jadwal halaqah."
            />

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Halaqah ({halaqahs.total})</CardTitle>
                    <CardDescription>Klik "Tambah Halaqah" untuk menambah data baru.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Dialog open={showCreate} onOpenChange={setShowCreate}>
                        <DialogTrigger asChild>
                            <Button>Tambah Halaqah</Button>
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

                    <ul className="divide-y rounded-lg border">
                        {halaqahs.data.map((halaqah) => (
                            <li
                                key={halaqah.id}
                                className="flex items-center justify-between gap-4 p-4"
                            >
                                <div>
                                    <p className="font-medium">{halaqah.nama}</p>
                                    <p className="text-sm text-muted-foreground">
                                        Muhafidz: {halaqah.muhafidz?.nama ?? '-'} · {halaqah.santris_count} santri
                                        {halaqah.jam_mulai && halaqah.jam_selesai
                                            ? ` · ${halaqah.jam_mulai} - ${halaqah.jam_selesai}`
                                            : ''}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary">{statusLabel(halaqah.status)}</Badge>
                                    <Button variant="outline" size="sm" onClick={() => setEditing(halaqah)}>
                                        Edit
                                    </Button>
                                    <Form {...HalaqahController.destroy.form({ halaqah: halaqah.id })}>
                                        <Button type="submit" variant="ghost" className="text-destructive">
                                            Hapus
                                        </Button>
                                    </Form>
                                </div>
                            </li>
                        ))}
                    </ul>
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
