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
    jam_mulai: string | null;
    jam_selesai: string | null;
    status: string;
    santris_count: number;
    muhafidz: { id: number; nama: string } | null;
};

type Option = { value: string; label: string };

type Props = {
    nilaiAwal?: HalaqahRow | null;
    muhafidzs: { id: number; nama: string }[];
    statuses: Option[];
    onSuccess?: () => void;
};

export default function HalaqahForm({
    nilaiAwal,
    muhafidzs,
    statuses,
    onSuccess,
}: Props) {
    const isEdit = nilaiAwal !== null && nilaiAwal !== undefined;
    const fieldKey = isEdit ? nilaiAwal!.id : 'new';

    const [selectedMuhafidzs, setSelectedMuhafidzs] = useState<number[]>(
        nilaiAwal?.muhafidz ? [nilaiAwal.muhafidz.id] : [],
    );

    const toggleMuhafidz = (id: number, checked: boolean): void => {
        setSelectedMuhafidzs((prev) =>
            checked ? [...prev, id] : prev.filter((v) => v !== id),
        );
    };

    const toggleAll = (checked: boolean): void => {
        setSelectedMuhafidzs(checked ? muhafidzs.map((m) => m.id) : []);
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

                    {isEdit ? (
                        <div className="grid gap-2">
                            <Label htmlFor={`muhafidz-${fieldKey}`}>Muhafidz / Pembimbing</Label>
                            <Select
                                name="muhafidz_id"
                                defaultValue={
                                    nilaiAwal?.muhafidz ? String(nilaiAwal.muhafidz.id) : undefined
                                }
                            >
                                <SelectTrigger id={`muhafidz-${fieldKey}`}>
                                    <SelectValue placeholder="Pilih muhafidz" />
                                </SelectTrigger>
                                <SelectContent>
                                    {muhafidzs.map((m) => (
                                        <SelectItem key={m.id} value={String(m.id)}>
                                            {m.nama}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.muhafidz_id} />
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label>Muhafidz / Pembimbing</Label>
                                <label className="flex items-center gap-1.5 text-xs font-medium">
                                    <input
                                        type="checkbox"
                                        checked={
                                            muhafidzs.length > 0 &&
                                            selectedMuhafidzs.length === muhafidzs.length
                                        }
                                        onChange={(e) => toggleAll(e.target.checked)}
                                    />
                                    Pilih Semua
                                </label>
                            </div>
                            <div className="flex max-h-40 flex-col gap-2 overflow-y-auto rounded-lg border p-2">
                                {muhafidzs.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Belum ada data muhafidz.</p>
                                ) : (
                                    muhafidzs.map((m) => (
                                        <label key={m.id} className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={selectedMuhafidzs.includes(m.id)}
                                                onChange={(e) => toggleMuhafidz(m.id, e.target.checked)}
                                            />
                                            {m.nama}
                                        </label>
                                    ))
                                )}
                            </div>
                            {selectedMuhafidzs.map((id) => (
                                <input key={id} type="hidden" name="muhafidz_ids[]" value={id} />
                            ))}
                            <p className="text-xs text-muted-foreground">
                                {selectedMuhafidzs.length === 0
                                    ? 'Pilih minimal satu muhafidz/pembimbing.'
                                    : selectedMuhafidzs.length === muhafidzs.length
                                      ? `Semua muhafidz terpilih (${selectedMuhafidzs.length})`
                                      : `${selectedMuhafidzs.length} muhafidz terpilih`}
                            </p>
                            <InputError
                                message={errors.muhafidz_ids ?? errors.muhafidz_id ?? errors['muhafidz_ids.0']}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor={`jam-mulai-${fieldKey}`}>Jam Mulai</Label>
                            <Input
                                id={`jam-mulai-${fieldKey}`}
                                name="jam_mulai"
                                type="time"
                                defaultValue={nilaiAwal?.jam_mulai ?? '07:00'}
                                required
                            />
                            <InputError message={errors.jam_mulai} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor={`jam-selesai-${fieldKey}`}>Jam Selesai</Label>
                            <Input
                                id={`jam-selesai-${fieldKey}`}
                                name="jam_selesai"
                                type="time"
                                defaultValue={nilaiAwal?.jam_selesai ?? '08:00'}
                                required
                            />
                            <InputError message={errors.jam_selesai} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor={`status-${fieldKey}`}>Status</Label>
                        <Select name="status" defaultValue={nilaiAwal?.status ?? 'aktif'}>
                            <SelectTrigger id={`status-${fieldKey}`}>
                                <SelectValue placeholder="Pilih status" />
                            </SelectTrigger>
                            <SelectContent>
                                {statuses.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>
                                        {s.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.status} />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="submit">{isEdit ? 'Simpan Perubahan' : 'Simpan Halaqah'}</Button>
                    </div>
                </>
            )}
        </Form>
    );
}
