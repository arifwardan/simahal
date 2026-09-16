import { Form } from '@inertiajs/react';
import UserController from '@/actions/App/Http/Controllers/Admin/UserController';
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

export type UserRow = {
    id: number;
    name: string;
    email: string;
    role: string;
    role_label: string;
    status: string;
    status_label: string;
};

type Option = { value: string; label: string };

type Props = {
    nilaiAwal?: UserRow | null;
    roles: Option[];
    statuses: Option[];
    onSuccess?: () => void;
};

export default function UserForm({ nilaiAwal, roles, statuses, onSuccess }: Props) {
    const isEdit = nilaiAwal !== null && nilaiAwal !== undefined;

    return (
        <Form
            action={
                isEdit
                    ? UserController.update.url({ user: nilaiAwal!.id })
                    : UserController.store.url()
            }
            method={isEdit ? 'patch' : 'post'}
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
                            defaultValue={nilaiAwal?.name}
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
                            defaultValue={nilaiAwal?.email}
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
                            htmlFor={`role-${isEdit ? nilaiAwal!.id : 'new'}`}
                        >
                            Role
                        </Label><Select
                            name="role"
                            defaultValue={nilaiAwal?.role ?? 'santri'}
                        >
                            <SelectTrigger
                                id={`role-${isEdit ? nilaiAwal!.id : 'new'}`}
                            >
                                <SelectValue placeholder="Pilih role" />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map((role) => (
                                    <SelectItem
                                        key={role.value}
                                        value={role.value}
                                    >
                                        {role.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.role} />
                    </div>

                    {isEdit && (
                        <div className="grid gap-2">
                            <Label htmlFor={`status-${nilaiAwal!.id}`}>Status</Label>
                            <Select name="status" defaultValue={nilaiAwal?.status ?? 'active'}>
                                <SelectTrigger id={`status-${nilaiAwal!.id}`}>
                                    <SelectValue placeholder="Pilih status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statuses.map((status) => (
                                        <SelectItem key={status.value} value={status.value}>
                                            {status.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.status} />
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="submit">
                            {isEdit ? 'Simpan Perubahan' : 'Simpan User'}
                        </Button>
                    </div>
                </>
            )}
        </Form>
    );
}
