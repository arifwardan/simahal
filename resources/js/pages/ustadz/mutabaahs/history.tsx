import { router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import PageContainer from '@/components/page-container';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { history } from '@/routes/ustadz/mutabaahs';

type MutabaahRow = {
    id: number;
    tanggal: string;
    jenis: string;
    surah: string;
    ayat_mulai: number;
    ayat_selesai: number;
    nilai: number | null;
    status: string;
    catatan: string | null;
    santri: { nama: string };
};

type PageProps = {
    mutabaahs: { data: MutabaahRow[]; total: number };
    santriOptions: { id: number; nama: string }[];
    filters?: { santri?: number };
};

export default function UstadzMutabaahHistory({ mutabaahs, santriOptions, filters }: PageProps) {
    const [santri, setSantri] = useState<string>(filters?.santri ? String(filters.santri) : '');

    return (
        <PageContainer>
            <Heading title="Riwayat Mutabaah" description="Riwayat pencatatan mutabaah yang Anda lakukan." />

            <Card>
                <CardHeader>
                    <CardTitle>Riwayat ({mutabaahs.total})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Select
                        value={santri}
                        onValueChange={(value) => {
                            setSantri(value);
                            router.get(history(), value ? { santri: value } : {}, { preserveState: true, replace: true });
                        }}
                    >
                        <SelectTrigger className="w-[240px]"><SelectValue placeholder="Semua santri" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Semua santri</SelectItem>
                            {santriOptions.map((s) => (
                                <SelectItem key={s.id} value={String(s.id)}>{s.nama}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <ul className="divide-y rounded-lg border">
                        {mutabaahs.data.map((m) => (
                            <li key={m.id} className="space-y-1 p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <p className="font-medium">{m.santri.nama}</p>
                                    <Badge variant="secondary">{m.status}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {m.tanggal} · {m.jenis} · {m.surah} {m.ayat_mulai}-{m.ayat_selesai}
                                    {m.nilai !== null ? ` · Nilai ${m.nilai}` : ''}
                                </p>
                                {m.catatan && <p className="text-sm">{m.catatan}</p>}
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </PageContainer>
    );
}

UstadzMutabaahHistory.layout = {
    breadcrumbs: [{
        title: 'Riwayat Mutabaah',
        href: history(),
    }],
};