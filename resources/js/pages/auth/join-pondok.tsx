import { useState } from 'react';
import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

type PondokOption = {
    id: number;
    nama_yayasan: string;
    slug: string;
};

type Props = {
    pondoks: PondokOption[];
};

export default function JoinPondok({ pondoks }: Props) {
    const [query, setQuery] = useState('');
    const [selectedId, setSelectedId] = useState<number | ''>('');

    const filtered = pondoks.filter((p) =>
        `${p.nama_yayasan} ${p.slug}`.toLowerCase().includes(query.toLowerCase()),
    );

    return (
        <>
            <Head title="Gabung Pondok" />
            <Form
                action="/join-pondok"
                method="post"
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="pondok-search">
                                    Cari Pondok
                                </Label>
                                <Input
                                    id="pondok-search"
                                    type="text"
                                    tabIndex={1}
                                    autoFocus
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Ketik nama yayasan…"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="pondok_id">Pondok</Label>
                                <select
                                    id="pondok_id"
                                    name="pondok_id"
                                    required
                                    tabIndex={2}
                                    value={selectedId}
                                    onChange={(e) =>
                                        setSelectedId(
                                            e.target.value === ''
                                                ? ''
                                                : Number(e.target.value),
                                        )
                                    }
                                    className="border-input bg-background rounded-md border px-3 py-2 text-sm"
                                >
                                    <option value="">— Pilih pondok —</option>
                                    {filtered.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.nama_yayasan} ({p.slug})
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.pondok_id} />
                            </div>

                            <div className="grid gap-2">
                                <span className="text-sm font-medium">
                                    Daftar sebagai
                                </span>
                                <div className="flex gap-4 text-sm">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="role"
                                            value="santri"
                                            defaultChecked
                                        />
                                        Santri
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="role"
                                            value="muhafidz"
                                        />
                                        Muhafidz
                                    </label>
                                </div>
                                <InputError message={errors.role} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    tabIndex={3}
                                    autoComplete="name"
                                    name="name"
                                    placeholder="Full name"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={4}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <PasswordInput
                                    id="password"
                                    required
                                    tabIndex={5}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder="Password"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">
                                    Confirm password
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    required
                                    tabIndex={6}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder="Confirm password"
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 w-full"
                                tabIndex={7}
                                disabled={processing}
                                data-test="join-pondok-button"
                            >
                                {processing && <Spinner />}
                                Minta Gabung
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            Sudah punya akun?{' '}
                            <TextLink href="/login" tabIndex={8}>
                                Log in
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

JoinPondok.layout = {
    title: 'Gabung pondok yang sudah ada',
    description: 'Pilih pondok lalu tunggu persetujuan admin',
};
