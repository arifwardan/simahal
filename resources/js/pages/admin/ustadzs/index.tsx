import { Form } from '@inertiajs/react';
import { useState } from 'react';
import UstadzController from '@/actions/App/Http/Controllers/Admin/UstadzController';
import UstadzForm from '@/components/forms/UstadzForm';
import type { UstadzRow } from '@/components/forms/UstadzForm';
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
import { index } from '@/routes/admin/ustadzs';

type Props = {
    ustadzs: { data: UstadzRow[]; total: number };
};

export default function AdminUstadzsIndex({ ustadzs }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [editing, setEditing] = useState<UstadzRow | null>(null);

    return (
        <PageContainer>
            <Heading
                title="Manajemen Ustadz"
                description="Kelola data ustadz dan akun loginnya."
            />

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Ustadz ({ustadzs.total})</CardTitle>
                    <CardDescription>
                        Klik "Tambah Ustadz" untuk menambah data baru.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Dialog open={showCreate} onOpenChange={setShowCreate}>
                        <DialogTrigger asChild>
                            <Button>Tambah Ustadz</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Tambah Ustadz</DialogTitle>
                                <DialogDescription>
                                    Tambahkan data ustadz dan akun loginnya.
                                </DialogDescription>
                            </DialogHeader>
                            <UstadzForm
                                onSuccess={() => setShowCreate(false)}
                            />
                        </DialogContent>
                    </Dialog>

                    <ul className="divide-y rounded-lg border">
                        {ustadzs.data.map((ustadz) => (
                            <li
                                key={ustadz.id}
                                className="flex items-center justify-between gap-4 p-4"
                            >
                                <div>
                                    <p className="font-medium">{ustadz.nama}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {ustadz.user.email}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditing(ustadz)}
                                    >
                                        Edit
                                    </Button>
                                    <Form
                                        {...UstadzController.destroy.form({
                                            ustadz: ustadz.id,
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
                        <DialogTitle>Edit Ustadz</DialogTitle>
                        <DialogDescription>
                            Perbarui data ustadz dan akun loginnya.
                        </DialogDescription>
                    </DialogHeader>
                    {editing && (
                        <UstadzForm
                            nilaiAwal={editing}
                            onSuccess={() => setEditing(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </PageContainer>
    );
}

AdminUstadzsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Manajemen Ustadz',
            href: index(),
        },
    ],
};
