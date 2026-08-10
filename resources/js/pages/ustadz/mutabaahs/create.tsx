import { Form, Link } from '@inertiajs/react';
import MutabaahController from '@/actions/App/Http/Controllers/Ustadz/MutabaahController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { index as halaqahIndex } from '@/routes/ustadz/halaqahs';
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

type Option = { value: string; label: string };

type PageProps = {
    santri: { id: number; nama: string; nis?: string | null };
    jenisOptions: Option[];
    statusOptions: Option[];
};

export default function UstadzMutabaahCreate({ santri, jenisOptions, statusOptions }: PageProps) {
    return (
        <>
            <Heading title="Catat Mutabaah" description={`Santri: ${santri.nama}${santri.nis ? ` (${santri.nis})` : ''}`} />

            <Card>
                <CardHeader>
                    <CardTitle>Form Mutabaah</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...MutabaahController.store.form()} className="space-y-4">
                        {({ errors }) => (
                            <>
                                <input type="hidden" name="santri_id" value={santri.id} />

                                <div className="grid gap-2">
                                    <Label htmlFor="tanggal">Tanggal</Label>
                                    <Input id="tanggal" name="tanggal" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
                                    <InputError message={errors.tanggal} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="jenis">Jenis</Label>
                                    <Select name="jenis" required defaultValue="setoran">
                                        <SelectTrigger id="jenis"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {jenisOptions.map((o) => (
                                                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.jenis} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="surah">Surah</Label>
                                    <Input id="surah" name="surah" required placeholder="Contoh: Al-Baqarah" />
                                    <InputError message={errors.surah} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="ayat_mulai">Ayat Mulai</Label>
                                        <Input id="ayat_mulai" name="ayat_mulai" type="number" min={1} required />
                                        <InputError message={errors.ayat_mulai} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="ayat_selesai">Ayat Selesai</Label>
                                        <Input id="ayat_selesai" name="ayat_selesai" type="number" min={1} required />
                                        <InputError message={errors.ayat_selesai} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="nilai">Nilai (0-100)</Label>
                                        <Input id="nilai" name="nilai" type="number" min={0} max={100} />
                                        <InputError message={errors.nilai} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="status">Status</Label>
                                        <Select name="status" required defaultValue="lulus">
                                            <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {statusOptions.map((o) => (
                                                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.status} />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="catatan">Catatan</Label>
                                    <textarea
                                        id="catatan"
                                        name="catatan"
                                        rows={3}
                                        className="w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs"
                                        placeholder="Contoh: Tajwid sudah baik, perlu murajaah di rumah."
                                    />
                                    <InputError message={errors.catatan} />
                                </div>

                                <div className="flex gap-2">
                                    <Button type="submit">Simpan Mutabaah</Button>
                                    <Button asChild variant="outline">
                                        <Link href={halaqahIndex()}>Kembali</Link>
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </CardContent>
            </Card>
        </>
    );
}

UstadzMutabaahCreate.layout = {
    breadcrumbs: [{
        title: 'Halaqah Saya',
        href: halaqahIndex(),
    }],
};