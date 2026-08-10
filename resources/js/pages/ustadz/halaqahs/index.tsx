import Heading from '@/components/heading';
import { index } from '@/routes/ustadz/halaqahs';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type HalaqahRow = {
    id: number;
    nama: string;
    jadwal: string | null;
    status: string;
    santri_count: number;
};

export default function UstadzHalaqahsIndex({ halaqahs }: { halaqahs: { data: HalaqahRow[]; total: number } }) {
    return (
        <>
            <Heading title="Halaqah Saya" description="Pilih halaqah untuk melihat santri dan mencatat mutabaah." />

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Halaqah ({halaqahs.total})</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="divide-y rounded-lg border">
                        {halaqahs.data.map((halaqah) => (
                            <li key={halaqah.id} className="flex items-center justify-between gap-4 p-4">
                                <div>
                                    <p className="font-medium">{halaqah.nama}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {halaqah.jadwal ?? 'Belum ada jadwal'} · {halaqah.santri_count} santri
                                    </p>
                                </div>
                                <Badge variant="secondary">{halaqah.status}</Badge>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </>
    );
}

UstadzHalaqahsIndex.layout = {
    breadcrumbs: [{
        title: 'Halaqah Saya',
        href: index(),
    }],
};