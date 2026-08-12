import { Form } from '@inertiajs/react';
import { useState } from 'react';
import SantriController from '@/actions/App/Http/Controllers/Admin/SantriController';
import SantriForm from '@/components/forms/SantriForm';
import type { SantriRow } from '@/components/forms/SantriForm';
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
import { index } from '@/routes/admin/santris';

type Option = { value: string; label: string };

type Props = {
    santris: { data: SantriRow[]; total: number };
    orangTuas: { id: number; nama: string }[];
    statuses: Option[];
    jenisOptions: Option[];
};

export default function AdminSantrisIndex({
    santris,
    orangTuas,
    statuses,
    jenisOptions,
}: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [editing, setEditing] = useState<SantriRow | null>(null);

    const statusLabel = (value: string): string =>
        statuses.find((s) => s.value === value)?.label ?? value;

    return (
        <PageContainer>
            <Heading
                title="Manajemen Santri"
                description="Kelola data santri dan akun loginnya."
            />

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Santri ({santris.total})</CardTitle>
                    <CardDescription>
                        Klik "Tambah Santri" untuk menambah data baru.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Dialog open={showCreate} onOpenChange={setShowCreate}>
                        <DialogTrigger asChild>
                            <Button>Tambah Santri</Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[calc(100%-2rem)] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Tambah Santri</DialogTitle>
                                <DialogDescription>
                                    Tambahkan data santri dan akun loginnya.
                                </DialogDescription>
                            </DialogHeader>
                            <SantriForm
                                orangTuas={orangTuas}
                                statuses={statuses}
                                jenisOptions={jenisOptions}
                                onSuccess={() => setShowCreate(false)}
                            />
                        </DialogContent>
                    </Dialog>

                    <ul className="divide-y rounded-lg border">
                        {santris.data.map((santri) => (
                            <li
                                key={santri.id}
                                className="flex items-center justify-between gap-4 p-4"
                            >
                                <div>
                                    <p className="font-medium">
                                        {santri.nama}{' '}
                                        {santri.nis ? `(${santri.nis})` : ''}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {santri.user.email}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary">
                                        {statusLabel(santri.status)}
                                    </Badge>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditing(santri)}
                                    >
                                        Edit
                                    </Button>
                                    <Form
                                        {...SantriController.destroy.form({
                                            santri: santri.id,
                                        })}
                                    >
                                        <Button
                                            type="submit"
                                            variant="ghost"
                                            className="text-destructive"
                                        >
                                            Hapus
                                        </Button>
                                    </Form>
                                </div>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            <Dialog
                open={editing !== null}
                onOpenChange={(open) => !open && setEditing(null)}
            >
                <DialogContent
                    key={editing?.id}
                    className="max-h-[calc(100%-2rem)] overflow-y-auto"
                >
                    <DialogHeader>
                        <DialogTitle>Edit Santri</DialogTitle>
                        <DialogDescription>
                            Perbarui data santri dan akun loginnya.
                        </DialogDescription>
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
