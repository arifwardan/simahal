import { Form } from '@inertiajs/react';
import SantriController from '@/actions/App/Http/Controllers/Admin/SantriController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import PageContainer from '@/components/page-container';
import { index } from '@/routes/admin/santris';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';

type Option = { value: string; label: string };
type SantriRow = {
    id: number;
    nis: string | null;
    nama: string;
    status: string;
    user: { email: string };
    orang_tua: { id: number; nama: string } | null;
};

type PageProps = {
    santris: { data: SantriRow[]; total: number };
    orangTuas: { id: number; nama: string }[];
    statuses: Option[];
};

export default function AdminSantrisIndex({ santris, orangTuas, statuses }: PageProps) {
    const [showForm, setShowForm] = useState(false);

    const statusLabel = (value: string): string =>
        statuses.find((s) => s.value === value)?.label ?? value;

    return (
        <PageContainer>
            <Heading title="Manajemen Santri" description="Kelola data santri dan akun loginnya." />

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Santri ({santris.total})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button onClick={() => setShowForm(true)}>Tambah Santri</Button>

                    {showForm && (
                        <Form
                            {...SantriController.store.form()}
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
                                        <Label htmlFor="nis">NIS</Label>
                                        <Input id="nis" name="nis" />
                                        <InputError message={errors.nis} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="tanggal_lahir">Tanggal Lahir</Label>
                                        <Input id="tanggal_lahir" name="tanggal_lahir" type="date" />
                                        <InputError message={errors.tanggal_lahir} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="status">Status</Label>
                                        <Select name="status" required defaultValue="aktif">
                                            <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {statuses.map((s) => (
                                                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.status} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="orang_tua_id">Orang Tua</Label>
                                        <Select name="orang_tua_id">
                                            <SelectTrigger id="orang_tua_id"><SelectValue placeholder="Tanpa orang tua" /></SelectTrigger>
                                            <SelectContent>
                                                {orangTuas.map((o) => (
                                                    <SelectItem key={o.id} value={String(o.id)}>{o.nama}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.orang_tua_id} />
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
                        {santris.data.map((santri) => (
                            <li key={santri.id} className="flex items-center justify-between gap-4 p-4">
                                <div>
                                    <p className="font-medium">{santri.nama} {santri.nis ? `(${santri.nis})` : ''}</p>
                                    <p className="text-sm text-muted-foreground">{santri.user.email}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary">{statusLabel(santri.status)}</Badge>
                                    <Form {...SantriController.destroy.form({ santri: santri.id })}>
                                        <Button type="submit" variant="ghost" className="text-destructive">Hapus</Button>
                                    </Form>
                                </div>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </PageContainer>
    );
}

AdminSantrisIndex.layout = {
    breadcrumbs: [{
        title: 'Manajemen Santri',
        href: index(),
    }],
};
