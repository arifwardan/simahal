import { Head, Link } from '@inertiajs/react';
import { ClipboardCheck, FolderGit2, GraduationCap } from 'lucide-react';
import StatCard from '@/components/dashboard/stat-card';
import PageContainer from '@/components/page-container';
import { dashboard } from '@/routes';
import { index as halaqahsIndex } from '@/routes/ustadz/halaqahs';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type HalaqahRow = {
    id: number;
    nama: string;
    santris_count: number;
};

type MutabaahRow = {
    id: number;
    tanggal: string;
    jenis: string;
    surah: string;
    ayat_mulai: number;
    ayat_selesai: number;
    status: string;
    santri?: { id: number; nama: string } | null;
};

type PageProps = {
    halaqahs: HalaqahRow[];
    recentMutabaahs: MutabaahRow[];
    totalMutabaahs: number;
};

export default function UstadzDashboard({ halaqahs, recentMutabaahs, totalMutabaahs }: PageProps) {
    const totalSantri = halaqahs.reduce((sum, h) => sum + h.santris_count, 0);

    return (
        <PageContainer>
            <Head title="Dashboard Ustadz" />
            <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label="Halaqah" value={halaqahs.length} icon={FolderGit2} tone="emerald" />
                <StatCard label="Santri" value={totalSantri} icon={GraduationCap} tone="sky" />
                <StatCard label="Mutabaah" value={totalMutabaahs} icon={ClipboardCheck} tone="violet" />
            </div>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Halaqah Saya</CardTitle>
                </CardHeader>
                <CardContent>
                    {halaqahs.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Belum ada halaqah.</p>
                    ) : (
                        <ul className="divide-y rounded-lg border">
                            {halaqahs.map((h) => (
                                <li key={h.id} className="flex items-center justify-between gap-4 p-4">
                                    <p className="font-medium">{h.nama}</p>
                                    <span className="text-sm text-muted-foreground">{h.santris_count} santri</span>
                                </li>
                            ))}
                        </ul>
                    )}
                    <Button asChild variant="outline" className="mt-4">
                        <Link href={halaqahsIndex()}>Kelola Halaqah</Link>
                    </Button>
                </CardContent>
            </Card>
        </PageContainer>
    );
}

UstadzDashboard.layout = {
    breadcrumbs: [{
        title: 'Dashboard',
        href: dashboard(),
    }],
};
