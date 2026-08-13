import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import Heading from '@/components/heading';
import PageContainer from '@/components/page-container';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { index } from '@/routes/ustadz/halaqahs';
import { show as santrisShow } from '@/routes/ustadz/halaqahs/santris';

type HalaqahRow = {
    id: number;
    nama: string;
    jadwal: string | null;
    status: string;
    santri_count: number;
};

export default function UstadzHalaqahsIndex({ halaqahs }: { halaqahs: { data: HalaqahRow[]; total: number } }) {
    return (
        <PageContainer>
            <Heading title="Halaqah Saya" description="Pilih halaqah untuk melihat santri dan mencatat mutabaah." />

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Halaqah ({halaqahs.total})</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="divide-y rounded-lg border">
                        {halaqahs.data.map((halaqah) => (
                            <li key={halaqah.id}>
                                <Link
                                    href={santrisShow({ halaqah: halaqah.id })}
                                    prefetch
                                    className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/50"
                                >
                                    <div>
                                        <p className="font-medium">{halaqah.nama}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {halaqah.jadwal ?? 'Belum ada jadwal'} · {halaqah.santri_count} santri
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant="secondary">{halaqah.status}</Badge>
                                        <span className="flex items-center gap-1 text-sm font-medium text-primary">
                                            Lihat Santri
                                            <ChevronRight className="h-4 w-4" />
                                        </span>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </PageContainer>
    );
}

UstadzHalaqahsIndex.layout = {
    breadcrumbs: [{
        title: 'Halaqah Saya',
        href: index(),
    }],
};