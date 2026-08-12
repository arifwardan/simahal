import { Form } from '@inertiajs/react';
import TargetHafalanController from '@/actions/App/Http/Controllers/Ustadz/TargetHafalanController';
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

export type TargetRow = {
    id: number;
    santri_id: number;
    periode: string;
    target: number;
    status: string;
};

type Option = { value: string; label: string };

type Props = {
    nilaiAwal?: TargetRow | null;
    santris: { id: number; nama: string }[];
    statuses: Option[];
    onSuccess?: () => void;
};

export default function TargetForm({ nilaiAwal, santris, statuses, onSuccess }: Props) {
    const isEdit = nilaiAwal !== null && nilaiAwal !== undefined;

    return (
        <Form
            {...(isEdit
                ? TargetHafalanController.update.form({ targetHafalan: nilaiAwal!.id })
                : TargetHafalanController.store.form())}
            onSuccess={onSuccess}
            className="space-y-4"
        >
            {({ errors }) => (
                <>
                    {!isEdit && (
                        <div className="grid gap-2">
                            <Label htmlFor="santri_id-new">Santri</Label>
                            <Select name="santri_id" required>
                                <SelectTrigger id="santri_id-new">
                                    <SelectValue placeholder="Pilih santri" />
                                </SelectTrigger>
                                <SelectContent>
                                    {santris.map((s) => (
                                        <SelectItem key={s.id} value={String(s.id)}>
                                            {s.nama}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.santri_id} />
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor={`periode-${isEdit ? nilaiAwal!.id : 'new'}`}>
                            Periode
                        </Label>
                        <Input
                            id={`periode-${isEdit ? nilaiAwal!.id : 'new'}`}
                            name="periode"
                            placeholder="2026-2027"
                            defaultValue={nilaiAwal?.periode}
                            required
                        />
                        <InputError message={errors.periode} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor={`target-${isEdit ? nilaiAwal!.id : 'new'}`}>
                            Target (ayat)
                        </Label>
                        <Input
                            id={`target-${isEdit ? nilaiAwal!.id : 'new'}`}
                            name="target"
                            type="number"
                            min={1}
                            defaultValue={nilaiAwal?.target}
                            required
                        />
                        <InputError message={errors.target} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor={`status-${isEdit ? nilaiAwal!.id : 'new'}`}>
                            Status
                        </Label>
                        <Select name="status" defaultValue={nilaiAwal?.status ?? 'berlangsung'} required>
                            <SelectTrigger id={`status-${isEdit ? nilaiAwal!.id : 'new'}`}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {statuses.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>
                                        {o.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.status} />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="submit">
                            {isEdit ? 'Simpan Perubahan' : 'Simpan Target'}
                        </Button>
                    </div>
                </>
            )}
        </Form>
    );
}
