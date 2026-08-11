import { Form } from '@inertiajs/react';
import HalaqahController from '@/actions/App/Http/Controllers/Admin/HalaqahController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import PageContainer from '@/components/page-container';
import { index } from '@/routes/admin/halaqahs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
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
type HalaqahRow = {
    id: number;
    nama: string;
    jadwal: string | null;
    status: string;
    santris_count: number;
    ustadz: { nama: string } | null;
};

type PageProps = {
    halaqahs: { data: HalaqahRow[]; total: number };
    ustadzs: { id: number; nama: string }[];
    santris: { id: number; nama: string }[];
    statuses: Option[];
};

export default function AdminHalaqahsIndex({ halaqahs, ustadzs, santris, statuses }: PageProps) {
    const [showForm, setShowForm] = useState(false);
    const [selectedSantris, setSelectedSantris] = useState<number[]>([]);

    return (
        <PageContainer>
            <Heading title="Manajemen Halaqah" description="Kelola halaqah dan keanggotaan santrinya." />

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Halaqah ({halaqahs.total})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button onClick={() => { setSelectedSantris([]); setShowForm(true); }}>Tambah Halaqah</Button>

                    {showForm && (
                        <Form
                            {...HalaqahController.store.form()}
                            onSuccess={() => setShowForm(false)}
                            className="space-y-4 rounded-lg border p-4"
                        >
                            {({ errors }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="nama">Nama</Label>
                                        <Input id="nama" name="nama" required />
                                        <InputError message={errors.nama} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="ustadz_id">Ustadz</Label>
                                        <Select name="ustadz_id" required>
                                            <SelectTrigger id="ustadz_id"><SelectValue placeholder="Pilih ustadz" /></SelectTrigger>
                                            <SelectContent>
                                                {ustadzs.map((u) => (
                                                    <SelectItem key={u.id} value={String(u.id)}>{u.nama}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.ustadz_id} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="jadwal">Jadwal</Label>
                                        <Input id="jadwal" name="jadwal" placeholder="Contoh: Setiap pagi setelah Subuh" />
                                        <InputError message={errors.jadwal} />
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
                                        <Label>Santri</Label>
                                        <div className="flex max-h-40 flex-col gap-2 overflow-y-auto rounded-lg border p-2">
                                            {santris.map((s) => (
                                                <label key={s.id} className="flex items-center gap-2 text-sm">
                                                    <input
                                                        type="checkbox"
                                                        name="santri_ids[]"
                                                        value={s.id}
                                                        checked={selectedSantris.includes(s.id)}
                                                        onChange={(e) =>
                                                            setSelectedSantris((prev) =>
                                                                e.target.checked
                                                                    ? [...prev, s.id]
                                                                    : prev.filter((id) => id !== s.id),
                                                            )
                                                        }
                                                    />
                                                    {s.nama}
                                                </label>
                                            ))}
                                        </div>
                                        <InputError message={errors['santri_ids']} />
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
                        {halaqahs.data.map((halaqah) => (
                            <li key={halaqah.id} className="flex items-center justify-between gap-4 p-4">
                                <div>
                                    <p className="font-medium">{halaqah.nama}</p>
                                    <p className="text-sm text-muted-foreground">
                                        Ustadz: {halaqah.ustadz?.nama ?? '-'} · {halaqah.santris_count} santri
                                        {halaqah.jadwal ? ` · ${halaqah.jadwal}` : ''}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary">{halaqah.status}</Badge>
                                    <Form {...HalaqahController.destroy.form({ halaqah: halaqah.id })}>
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

AdminHalaqahsIndex.layout = {
    breadcrumbs: [{
        title: 'Manajemen Halaqah',
        href: index(),
    }],
};
