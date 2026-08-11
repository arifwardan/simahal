import { Form } from '@inertiajs/react';
import OrangTuaController from '@/actions/App/Http/Controllers/Admin/OrangTuaController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import PageContainer from '@/components/page-container';
import { index } from '@/routes/admin/orang-tuas';
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

type OrangTuaRow = {
    id: number;
    nama: string;
    kontak: string | null;
    santris_count: number;
    user: { email: string };
};

export default function AdminOrangTuasIndex({ orangTuas }: { orangTuas: { data: OrangTuaRow[]; total: number } }) {
    const [showForm, setShowForm] = useState(false);

    return (
        <PageContainer>
            <Heading title="Manajemen Orang Tua" description="Kelola akun orang tua santri." />

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Orang Tua ({orangTuas.total})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button onClick={() => setShowForm(true)}>Tambah Orang Tua</Button>

                    {showForm && (
                        <Form
                            {...OrangTuaController.store.form()}
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
                        {orangTuas.data.map((orangTua) => (
                            <li key={orangTua.id} className="flex items-center justify-between gap-4 p-4">
                                <div>
                                    <p className="font-medium">{orangTua.nama}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {orangTua.user.email} · {orangTua.santris_count} anak
                                    </p>
                                </div>
                                <Form {...OrangTuaController.destroy.form({ orangTua: orangTua.id })}>
                                    <Button type="submit" variant="ghost" className="text-destructive">Hapus</Button>
                                </Form>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </PageContainer>
    );
}

AdminOrangTuasIndex.layout = {
    breadcrumbs: [{
        title: 'Manajemen Orang Tua',
        href: index(),
    }],
};
