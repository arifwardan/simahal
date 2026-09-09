import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

export default function RegisterPondok() {
    return (
        <>
            <Head title="Daftarkan Pondok" />
            <Form
                action="/register-pondok"
                method="post"
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="nama_yayasan">
                                    Nama Yayasan / Pondok
                                </Label>
                                <Input
                                    id="nama_yayasan"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="organization"
                                    name="nama_yayasan"
                                    placeholder="Yayasan Cahaya Ilmu"
                                />
                                <InputError message={errors.nama_yayasan} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="slug">Slug</Label>
                                <Input
                                    id="slug"
                                    type="text"
                                    required
                                    tabIndex={2}
                                    name="slug"
                                    placeholder="cahaya-ilmu"
                                />
                                <InputError message={errors.slug} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="name">Nama Admin</Label>
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
                                data-test="register-pondok-button"
                            >
                                {processing && <Spinner />}
                                Daftarkan Pondok
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

RegisterPondok.layout = {
    title: 'Daftarkan pondok baru',
    description: 'Buat ruang pondok dan akun admin dalam satu langkah',
};
