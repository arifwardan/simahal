import { Form } from '@inertiajs/react';
import { useState } from 'react';
import SantriController from '@/actions/App/Http/Controllers/Admin/SantriController';
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

export type SantriRow = {
    id: number;
    nama: string;
    nis: string | null;
    tanggal_lahir: string | null;
    status: string;
    halaman_awal: number | null;
    jenis: string | null;
    orang_tua_id: number | null;
    user: { id: number; name: string; email: string };
};

type Option = { value: string; label: string };

type Props = {
    nilaiAwal?: SantriRow | null;
    orangTuas: { id: number; nama: string }[];
    statuses: Option[];
    jenisOptions: Option[];
    onSuccess?: () => void;
};

export default function SantriForm({
    nilaiAwal,
    orangTuas,
    statuses,
    jenisOptions,
    onSuccess,
}: Props) {
    const isEdit = nilaiAwal !== null && nilaiAwal !== undefined;
    const fieldKey = isEdit ? nilaiAwal!.id : 'new';
    const [selectedOrangTua, setSelectedOrangTua] = useState<string>(
        nilaiAwal?.orang_tua_id ? String(nilaiAwal.orang_tua_id) : 'none',
    );

    return (
        <Form
            {...(isEdit
                ? SantriController.update.form({ santri: nilaiAwal!.id })
                : SantriController.store.form())}
            onSuccess={onSuccess}
            className="space-y-4"
        >
            {({ errors }) => (
                <>
                    <div className="grid gap-2">
                        <Label htmlFor={`name-${fieldKey}`}>Nama</Label>
                        <Input
                            id={`name-${fieldKey}`}
                            name="name"
                            placeholder="Nama lengkap"
                            defaultValue={nilaiAwal?.nama}
                            required
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor={`email-${fieldKey}`}>Email</Label>
                        <Input
                            id={`email-${fieldKey}`}
                            name="email"
                            type="email"
                            placeholder="email@example.com"
                            defaultValue={nilaiAwal?.user.email}
                            required
                        />
                        <InputError message={errors.email} />
                    </div>

                    {!isEdit && (
                        <div className="grid gap-2">
                            <Label htmlFor="password-new">Password</Label>
                            <Input
                                id="password-new"
                                name="password"
                                type="password"
                                placeholder="Minimal 8 karakter"
                                required
                            />
                            <InputError message={errors.password} />
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor={`nis-${fieldKey}`}>NIS</Label>
                        <Input
                            id={`nis-${fieldKey}`}
                            name="nis"
                            placeholder="Nomor Induk Santri"
                            defaultValue={nilaiAwal?.nis ?? undefined}
                        />
                        <InputError message={errors.nis} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor={`tanggal_lahir-${fieldKey}`}>
                            Tanggal Lahir
                        </Label>
                        <Input
                            id={`tanggal_lahir-${fieldKey}`}
                            name="tanggal_lahir"
                            type="date"
                            defaultValue={
                                nilaiAwal?.tanggal_lahir?.slice(0, 10) ??
                                undefined
                            }
                        />
                        <InputError message={errors.tanggal_lahir} />
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
                        <Label htmlFor={`jenis-${fieldKey}`}>Jenis</Label>
                        <Select
                            name="jenis"
                            defaultValue={nilaiAwal?.jenis ?? undefined}
                        >
                            <SelectTrigger id={`jenis-${fieldKey}`}>
                                <SelectValue placeholder="Pilih jenis" />
                            </SelectTrigger>
                            <SelectContent>
                                {jenisOptions.map((jenis) => (
                                    <SelectItem
                                        key={jenis.value}
                                        value={jenis.value}
                                    >
                                        {jenis.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.jenis} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor={`halaman_awal-${fieldKey}`}>
                            Halaman Awal
                        </Label>
                        <Input
                            id={`halaman_awal-${fieldKey}`}
                            name="halaman_awal"
                            type="number"
                            min={0}
                            placeholder="0"
                            defaultValue={nilaiAwal?.halaman_awal ?? undefined}
                        />
                        <InputError message={errors.halaman_awal} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor={`orang_tua-${fieldKey}`}>
                            Orang Tua
                        </Label>
                        <Select
                            value={selectedOrangTua}
                            onValueChange={setSelectedOrangTua}
                        >
                            <SelectTrigger id={`orang_tua-${fieldKey}`}>
                                <SelectValue placeholder="Tanpa orang tua" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">
                                    Tanpa orang tua
                                </SelectItem>
                                {orangTuas.map((orangTua) => (
                                    <SelectItem
                                        key={orangTua.id}
                                        value={String(orangTua.id)}
                                    >
                                        {orangTua.nama}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <input
                            type="hidden"
                            name="orang_tua_id"
                            value={
                                selectedOrangTua === 'none'
                                    ? ''
                                    : selectedOrangTua
                            }
                        />
                        <InputError message={errors.orang_tua_id} />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="submit">
                            {isEdit ? 'Simpan Perubahan' : 'Simpan Santri'}
                        </Button>
                    </div>
                </>
            )}
        </Form>
    );
}
