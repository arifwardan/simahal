import { Form } from '@inertiajs/react';
import { useState } from 'react';
import MuhafidzController from '@/actions/App/Http/Controllers/Admin/MuhafidzController';
import MuhafidzForm from '@/components/forms/MuhafidzForm';
import type { MuhafidzRow } from '@/components/forms/MuhafidzForm';
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
import { index } from '@/routes/admin/muhafidzs';

type Props = {
    muhafidzs: { data: MuhafidzRow[]; total: number };
};

export default function AdminMuhafidzsIndex({ muhafidzs }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [editing, setEditing] = useState<MuhafidzRow | null>(null);

    return (
        <PageContainer>
            <Heading
                title="Manajemen Muhafidz"
                description="Kelola data muhafidz dan akun loginnya."
            />

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Muhafidz ({muhafidzs.total})</CardTitle>
                    <CardDescription>
                        Klik "Tambah Muhafidz" untuk menambah data baru.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Dialog open={showCreate} onOpenChange={setShowCreate}>
                        <DialogTrigger asChild>
                            <Button>Tambah Muhafidz</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Tambah Muhafidz</DialogTitle>
                                <DialogDescription>
                                    Tambahkan data muhafidz dan akun loginnya.
                                </DialogDescription>
                            </DialogHeader>
                            <MuhafidzForm
                                onSuccess={() => setShowCreate(false)}
                            />
                        </DialogContent>
                    </Dialog>

                    <ul className="divide-y rounded-lg border">
                        {muhafidzs.data.map((muhafidz) => (
                            <li
                                key={muhafidz.id}
                                className="flex items-center justify-between gap-4 p-4"
                            >
                                <div>
                                    <p className="font-medium">{muhafidz.nama}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {muhafidz.user.email}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditing(muhafidz)}
                                    >
                                        Edit
                                    </Button>
                                    <Form
                                        {...MuhafidzController.destroy.form({
                                            muhafidz: muhafidz.id,
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
                        <DialogTitle>Edit Muhafidz</DialogTitle>
                        <DialogDescription>
                            Perbarui data muhafidz dan akun loginnya.
                        </DialogDescription>
                    </DialogHeader>
                    {editing && (
                        <MuhafidzForm
                            nilaiAwal={editing}
                            onSuccess={() => setEditing(null)}
                        />
                    )}
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
