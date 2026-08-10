import { Form } from '@inertiajs/react';
import UstadzController from '@/actions/App/Http/Controllers/Admin/UstadzController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { index } from '@/routes/admin/ustadzs';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

type UstadzRow = {
    id: number;
    nama: string;
    kontak: string | null;
    user: { email: string };
};

export default function AdminUstadzsIndex({ ustadzs }: { ustadzs: { data: UstadzRow[]; total: number } }) {
    const [showForm, setShowForm] = useState(false);

    return (
        <>
            <Heading title="Manajemen Ustadz" description="Kelola data ustadz dan akun loginnya." />

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Ustadz ({ustadzs.total})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button onClick={() => setShowForm(true)}>Tambah Ustadz</Button>

                    {showForm && (
                        <Form
                            {...UstadzController.store.form()}
                            onSuccess={() => setShowForm(false)}
                            className="space-y-4 rounded-lg border p-4"
                        >
                            {({ errors }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Nama</Label>
                                        <Input id="name" name="name" required />
                                        <InputError message={errors.name} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" name="email" type="email" required />
                                        <InputError message={errors.email} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="password">Password</Label>
                                        <Input id="password" name="password" type="password" required />
                                        <InputError message={errors.password} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="kontak">Kontak</Label>
                                        <Input id="kontak" name="kontak" />
                                        <InputError message={errors.kontak} />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button type="submit">Simpan</Button>
                                        <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    )}

                    <ul className="divide-y rounded-lg border">
                        {ustadzs.data.map((ustadz) => (
                            <li key={ustadz.id} className="flex items-center justify-between gap-4 p-4">
                                <div>
                                    <p className="font-medium">{ustadz.nama}</p>
                                    <p className="text-sm text-muted-foreground">{ustadz.user.email}</p>
                                </div>
                                <Form {...UstadzController.destroy.form({ ustadz: ustadz.id })}>
                                    <Button type="submit" variant="ghost" className="text-destructive">Hapus</Button>
                                </Form>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </>
    );
}

AdminUstadzsIndex.layout = {
    breadcrumbs: [{
        title: 'Manajemen Ustadz',
        href: index(),
    }],
};
