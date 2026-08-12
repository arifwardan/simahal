import { Form } from '@inertiajs/react';
import { useState } from 'react';
import HalaqahController from '@/actions/App/Http/Controllers/Admin/HalaqahController';
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

export type HalaqahRow = {
    id: number;
    nama: string;
    jadwal: string | null;
    status: string;
    santris_count: number;
    ustadz: { id: number; nama: string } | null;
    santri_ids: number[];
};

type Option = { value: string; label: string };

type Props = {
    nilaiAwal?: HalaqahRow | null;
    ustadzs: { id: number; nama: string }[];
    santris: { id: number; nama: string }[];
    statuses: Option[];
    onSuccess?: () => void;
};

export default function HalaqahForm({
    nilaiAwal,
    ustadzs,
    santris,
    statuses,
    onSuccess,
}: Props) {
    const isEdit = nilaiAwal !== null && nilaiAwal !== undefined;
    const fieldKey = isEdit ? nilaiAwal!.id : 'new';
    const [selectedSantris, setSelectedSantris] = useState<number[]>(
        nilaiAwal?.santri_ids ?? [],
    );

    const toggleSantri = (santriId: number, checked: boolean): void => {
        setSelectedSantris((prev) =>
            checked
                ? [...prev, santriId]
                : prev.filter((id) => id !== santriId),
        );
    };

    return (
        <Form
            {...(isEdit
                ? HalaqahController.update.form({ halaqah: nilaiAwal!.id })
                : HalaqahController.store.form())}
            onSuccess={onSuccess}
            className="space-y-4"
        >
            {({ errors }) => (
                <>
                    <div className="grid gap-2">
                        <Label htmlFor={`nama-${fieldKey}`}>Nama</Label>
                        <Input
                            id={`nama-${fieldKey}`}
                            name="nama"
                            placeholder="Contoh: Halaqah 1"
                            defaultValue={nilaiAwal?.nama}
                            required
                        />
                        <InputError message={errors.nama} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor={`ustadz-${fieldKey}`}>Ustadz</Label>
                        <Select
                            name="ustadz_id"
                            defaultValue={
                                nilaiAwal?.ustadz
                                    ? String(nilaiAwal.ustadz.id)
                                    : undefined
                            }
                        >
                            <SelectTrigger id={`ustadz-${fieldKey}`}>
                                <SelectValue placeholder="Pilih ustadz" />
                            </SelectTrigger>
                            <SelectContent>
                                {ustadzs.map((ustadz) => (
                                    <SelectItem
                                        key={ustadz.id}
                                        value={String(ustadz.id)}
                                    >
                                        {ustadz.nama}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.ustadz_id} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor={`jadwal-${fieldKey}`}>Jadwal</Label>
                        <Input
                            id={`jadwal-${fieldKey}`}
                            name="jadwal"
                            placeholder="Contoh: Setiap pagi setelah Subuh"
                            defaultValue={nilaiAwal?.jadwal ?? undefined}
                        />
                        <InputError message={errors.jadwal} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor={`status-${fieldKey}`}>Status</Label>
                        <Select
                            name="status"
                            defaultValue={nilaiAwal?.status ?? 'aktif'}
                        >
                            <SelectTrigger id={`status-${fieldKey}`}>
                                <SelectValue placeholder="Pilih status" />
                            </SelectTrigger>
                            <SelectContent>
                                {statuses.map((status) => (
                                    <SelectItem
                                        key={status.value}
                                        value={status.value}
                                    >
                                        {status.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.status} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Santri</Label>
                        <div className="flex max-h-40 flex-col gap-2 overflow-y-auto rounded-lg border p-2">
                            {santris.map((santri) => (
                                <label
                                    key={santri.id}
                                    className="flex items-center gap-2 text-sm"
                                >
                                    <input
                                        type="checkbox"
                                        name="santri_ids[]"
                                        value={santri.id}
                                        checked={selectedSantris.includes(
                                            santri.id,
                                        )}
                                        onChange={(e) =>
                                            toggleSantri(
                                                santri.id,
                                                e.target.checked,
                                            )
                                        }
                                    />
                                    {santri.nama}
                                </label>
                            ))}
                        </div>
                        <InputError message={errors['santri_ids']} />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="submit">
                            {isEdit ? 'Simpan Perubahan' : 'Simpan Halaqah'}
                        </Button>
                    </div>
                </>
            )}
        </Form>
    );
}
