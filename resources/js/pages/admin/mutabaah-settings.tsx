import { Form } from '@inertiajs/react';
import MutabaahSettingController from '@/actions/App/Http/Controllers/Admin/MutabaahSettingController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import PageContainer from '@/components/page-container';
import { edit } from '@/routes/admin/mutabaah-settings';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type MutabaahSettings = {
    konversi_juz_halaman: number;
    ambang_hadiah_juz: number;
    tahun_aktif: number;
};

type Props = {
    settings: MutabaahSettings;
};

export default function AdminMutabaahSettings({ settings }: Props) {
    return (
        <PageContainer>
            <Heading
                title="Pengaturan Mutabaah"
                description="Atur konversi juz, ambang hadiah, dan tahun aktif mutabaah bulanan."
            />

            <Card>
                <CardHeader>
                    <CardTitle>Pengaturan Mutabaah Bulanan</CardTitle>
                    <CardDescription>
                        Perubahan berlaku untuk seluruh perhitungan mutabaah bulanan.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form
                        {...MutabaahSettingController.update.form()}
                        className="max-w-md space-y-4"
                    >
                        {({ errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="konversi_juz_halaman">
                                        Konversi 1 Juz (halaman)
                                    </Label>
                                    <Input
                                        id="konversi_juz_halaman"
                                        name="konversi_juz_halaman"
                                        type="number"
                                        min={1}
                                        defaultValue={settings.konversi_juz_halaman}
                                        required
                                    />
                                    <InputError message={errors.konversi_juz_halaman} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="ambang_hadiah_juz">
                                        Ambang Hadiah (juz)
                                    </Label>
                                    <Input
                                        id="ambang_hadiah_juz"
                                        name="ambang_hadiah_juz"
                                        type="number"
                                        step="0.1"
                                        min={0}
                                        defaultValue={settings.ambang_hadiah_juz}
                                        required
                                    />
                                    <InputError message={errors.ambang_hadiah_juz} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="tahun_aktif">Tahun Aktif</Label>
                                    <Input
                                        id="tahun_aktif"
                                        name="tahun_aktif"
                                        type="number"
                                        min={2000}
                                        max={2100}
                                        defaultValue={settings.tahun_aktif}
                                        required
                                    />
                                    <InputError message={errors.tahun_aktif} />
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="submit">Simpan Pengaturan</Button>
                                </div>
                            </>
                        )}
                    </Form>
                </CardContent>
            </Card>
        </PageContainer>
    );
}

AdminMutabaahSettings.layout = {
    breadcrumbs: [
        {
            title: 'Pengaturan Mutabaah',
            href: edit(),
        },
    ],
};
