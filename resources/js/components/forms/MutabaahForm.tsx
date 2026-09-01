import { Form } from '@inertiajs/react';
import MutabaahController from '@/actions/App/Http/Controllers/Muhafidz/MutabaahController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
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

type Props = {
    santri: { id: number; nama: string; nis?: string | null };
    jenisOptions: Option[];
    statusOptions: Option[];
    onSuccess?: () => void;
};

export default function MutabaahForm({ santri, jenisOptions, statusOptions, onSuccess }: Props) {
    return (
        <Form {...MutabaahController.store.form()} className="space-y-4" onSuccess={onSuccess}>
            {({ errors }) => (
                <>
                    <input type="hidden" name="santri_id" value={santri.id} />

                    <div className="grid gap-2">
                        <Label>Tanggal</Label>
                        <Input name="tanggal" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
                        <InputError message={errors.tanggal} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Jenis</Label>
                        <Select name="jenis" defaultValue="setoran">
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {jenisOptions.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.jenis} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Surah</Label>
                        <Input name="surah" placeholder="Al-Baqarah" required />
                        <InputError message={errors.surah} />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="grid gap-2">
                            <Label>Ayat Mulai</Label>
                            <Input name="ayat_mulai" type="number" min={1} required />
                            <InputError message={errors.ayat_mulai} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Ayat Selesai</Label>
                            <Input name="ayat_selesai" type="number" min={1} required />
                            <InputError message={errors.ayat_selesai} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Halaman</Label>
                            <Input name="halaman" type="number" min={1} required />
                            <InputError message={errors.halaman} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Nilai (opsional)</Label>
                        <Input name="nilai" type="number" min={0} max={100} />
                        <InputError message={errors.nilai} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Status</Label>
                        <Select name="status" defaultValue="lulus">
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {statusOptions.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.status} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Catatan (opsional)</Label>
                        <Input name="catatan" />
                        <InputError message={errors.catatan} />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="submit">Simpan Mutabaah</Button>
                    </div>
                </>
            )}
        </Form>
    );
}
