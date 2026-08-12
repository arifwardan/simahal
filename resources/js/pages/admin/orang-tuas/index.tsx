import { Form } from '@inertiajs/react';
import { useState } from 'react';
import OrangTuaController from '@/actions/App/Http/Controllers/Admin/OrangTuaController';
import OrangTuaForm from '@/components/forms/OrangTuaForm';
import type { OrangTuaRow } from '@/components/forms/OrangTuaForm';
import Heading from '@/components/heading';
import PageContainer from '@/components/page-container';
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
import { index } from '@/routes/admin/orang-tuas';

type Props = {
    orangTuas: { data: OrangTuaRow[]; total: number };
};

export default function AdminOrangTuasIndex({ orangTuas }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [editing, setEditing] = useState<OrangTuaRow | null>(null);

    return (
        <PageContainer>
            <Heading
                title="Manajemen Orang Tua"
                description="Kelola akun orang tua santri."
            />

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Orang Tua ({orangTuas.total})</CardTitle>
                    <CardDescription>
                        Klik "Tambah Orang Tua" untuk menambah data baru.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Dialog open={showCreate} onOpenChange={setShowCreate}>
                        <DialogTrigger asChild>
                            <Button>Tambah Orang Tua</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Tambah Orang Tua</DialogTitle>
                                <DialogDescription>
                                    Tambahkan akun orang tua santri.
                                </DialogDescription>
                            </DialogHeader>
                            <OrangTuaForm
                                onSuccess={() => setShowCreate(false)}
                            />
                        </DialogContent>
                    </Dialog>

                    <ul className="divide-y rounded-lg border">
                        {orangTuas.data.map((orangTua) => (
                            <li
                                key={orangTua.id}
                                className="flex items-center justify-between gap-4 p-4"
                            >
                                <div>
                                    <p className="font-medium">
                                        {orangTua.nama}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {orangTua.user.email} ·{' '}
                                        {orangTua.santris_count} anak
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditing(orangTua)}
                                    >
                                        Edit
                                    </Button>
                                    <Form
                                        {...OrangTuaController.destroy.form({
                                            orangTua: orangTua.id,
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
                <DialogContent key={editing?.id}>
                    <DialogHeader>
                        <DialogTitle>Edit Orang Tua</DialogTitle>
                        <DialogDescription>
                            Perbarui akun orang tua santri.
                        </DialogDescription>
                    </DialogHeader>
                    {editing && (
                        <OrangTuaForm
                            nilaiAwal={editing}
                            onSuccess={() => setEditing(null)}
                        />
                    )}
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
