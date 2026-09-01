import { Form } from '@inertiajs/react';
import MuhafidzController from '@/actions/App/Http/Controllers/Admin/MuhafidzController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type MuhafidzRow = {
    id: number;
    nama: string;
    kontak: string | null;
    user: { id: number; name: string; email: string };
};

type Props = {
    nilaiAwal?: MuhafidzRow | null;
    onSuccess?: () => void;
};

export default function MuhafidzForm({ nilaiAwal, onSuccess }: Props) {
    const isEdit = nilaiAwal !== null && nilaiAwal !== undefined;

    return (
        <Form
            {...(isEdit
                ? MuhafidzController.update.form({ muhafidz: nilaiAwal!.id })
                : MuhafidzController.store.form())}
            onSuccess={onSuccess}
            className="space-y-4"
        >
            {({ errors }) => (
                <>
                    <div className="grid gap-2">
                        <Label
                            htmlFor={`name-${isEdit ? nilaiAwal!.id : 'new'}`}
                        >
                            Nama
                        </Label>
                        <Input
                            id={`name-${isEdit ? nilaiAwal!.id : 'new'}`}
                            name="name"
                            placeholder="Nama lengkap"
                            defaultValue={nilaiAwal?.nama}
                            required
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label
                            htmlFor={`email-${isEdit ? nilaiAwal!.id : 'new'}`}
                        >
                            Email
                        </Label>
                        <Input
                            id={`email-${isEdit ? nilaiAwal!.id : 'new'}`}
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
                        <Label
                            htmlFor={`kontak-${isEdit ? nilaiAwal!.id : 'new'}`}
                        >
                            Kontak
                        </Label>
                        <Input
                            id={`kontak-${isEdit ? nilaiAwal!.id : 'new'}`}
                            name="kontak"
                            placeholder="No. HP / WhatsApp"
                            defaultValue={nilaiAwal?.kontak ?? undefined}
                        />
                        <InputError message={errors.kontak} />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="submit">
                            {isEdit ? 'Simpan Perubahan' : 'Simpan Muhafidz'}
                        </Button>
                    </div>
                </>
            )}
        </Form>
    );
}
