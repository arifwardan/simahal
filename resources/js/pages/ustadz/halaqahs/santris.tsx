import { useState } from 'react';
import MutabaahForm from '@/components/forms/MutabaahForm';
import Heading from '@/components/heading';
import PageContainer from '@/components/page-container';
import { index as halaqahIndex } from '@/routes/ustadz/halaqahs';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type SantriRow = {
    id: number;
    nama: string;
    nis?: string | null;
};

type Option = { value: string; label: string };

type Settings = {
    konversi_juz_halaman: number;
    ambang_hadiah_juz: number;
    tahun_aktif: number;
};

type BulananRow = {
    santri_id: number;
    nama: string;
    halaman_awal_bulan: number | null;
    prefill_kumulatif: number | null;
    existing: {
        halaman_kumulatif: number | null;
        juz_dihafal: number | null;
        tasmi_pekan_1: number | null;
        tasmi_pekan_2: number | null;
        tasmi_pekan_3: number | null;
        tasmi_pekan_4: number | null;
        tasmi_pekan_5: number | null;
        ujian_soal_1: number | null;
        ujian_soal_2: number | null;
        ujian_soal_3: number | null;
        ujian_soal_4: number | null;
        ujian_soal_5: number | null;
    } | null;
};

type Halaqah = { id: number; nama: string };

type PageProps = {
    halaqah: Halaqah;
    santris: { data: SantriRow[]; total: number };
    jenisOptions: Option[];
    statusOptions: Option[];
    settings: Settings;
    bulan: number;
    tahun: number;
    bulanan: BulananRow[];
};

export default function UstadzHalaqahSantris({
    halaqah,
    santris,
    jenisOptions,
    statusOptions,
    settings,
    bulan,
    tahun,
    bulanan,
}: PageProps) {
    const [catatSantri, setCatatSantri] = useState<SantriRow | null>(null);

    return (
        <PageContainer>
            <Heading title={halaqah.nama} description="Daftar santri dalam halaqah ini." />

            <Card>
                <CardHeader>
                    <CardTitle>Santri ({santris.total})</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="divide-y rounded-lg border">
                        {santris.data.map((santri) => (
                            <li key={santri.id} className="flex items-center justify-between gap-4 p-4">
                                <div>
                                    <p className="font-medium">{santri.nama}</p>
                                    {santri.nis && <p className="text-sm text-muted-foreground">{santri.nis}</p>}
                                </div>
                                <Button size="sm" onClick={() => setCatatSantri(santri)}>Catat Mutabaah</Button>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            <Dialog open={catatSantri !== null} onOpenChange={(open) => !open && setCatatSantri(null)}>
                <DialogContent key={catatSantri?.id}>
                    <DialogHeader>
                        <DialogTitle>Catat Mutabaah</DialogTitle>
                        <DialogDescription>
                            {catatSantri ? `${catatSantri.nama}${catatSantri.nis ? ` (${catatSantri.nis})` : ''}` : ''}
                        </DialogDescription>
                    </DialogHeader>
                    {catatSantri && (
                        <MutabaahForm
                            santri={catatSantri}
                            jenisOptions={jenisOptions}
                            statusOptions={statusOptions}
                            onSuccess={() => setCatatSantri(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </PageContainer>
    );
}

UstadzHalaqahSantris.layout = {
    breadcrumbs: [{
        title: 'Halaqah Saya',
        href: halaqahIndex(),
    }],
};
