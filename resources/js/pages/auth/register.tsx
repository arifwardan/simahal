import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { login } from '@/routes';
import { store } from '@/routes/register';

const strengthChecks = [
    { label: 'Minimal 8 karakter', test: (v: string) => v.length >= 8 },
    { label: 'Huruf kecil', test: (v: string) => /[a-z]/.test(v) },
    { label: 'Huruf besar', test: (v: string) => /[A-Z]/.test(v) },
    { label: 'Angka', test: (v: string) => /[0-9]/.test(v) },
    { label: 'Simbol', test: (v: string) => /[^a-zA-Z0-9]/.test(v) },
];

const strengthMeta = [
    { label: 'Sangat lemah', className: 'bg-red-500' },
    { label: 'Lemah', className: 'bg-red-500' },
    { label: 'Cukup', className: 'bg-amber-500' },
    { label: 'Kuat', className: 'bg-lime-500' },
    { label: 'Sangat kuat', className: 'bg-green-600' },
    { label: 'Sangat kuat', className: 'bg-green-600' },
];

export default function Register() {
    const [password, setPassword] = useState('');
    const score = strengthChecks.reduce((acc, check) => acc + (check.test(password) ? 1 : 0), 0);
    const meta = strengthMeta[score];

    return (
        <>
            <Head title="Register" />

            <Form
                action={store().url}
                method="post"
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Full name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
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
                                    tabIndex={2}
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
                                    tabIndex={3}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder="Password"
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                {password.length > 0 && (
                                    <div className="space-y-1.5" aria-live="polite">
                                        <div className="flex gap-1">
                                            {strengthChecks.map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={cn(
                                                        'h-1.5 flex-1 rounded-full bg-muted',
                                                        i < score && meta.className,
                                                    )}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-xs font-bold text-muted-foreground">
                                            Kekuatan: {meta.label} ({score}/5)
                                        </p>
                                    </div>
                                )}
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">Confirm password</Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    required
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder="Confirm password"
                                />
                                <InputError message={errors.password_confirmation} />
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 w-full"
                                tabIndex={5}
                                disabled={processing}
                                data-test="register-button"
                            >
                                {processing && <Spinner />}
                                Daftar Akun
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            Sudah punya akun?{' '}
                            <TextLink href={login()} tabIndex={6}>
                                Log in
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = 'auth';
