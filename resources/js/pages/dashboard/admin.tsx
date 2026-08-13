import { Head } from '@inertiajs/react';
import {
    BookOpen,
    ClipboardCheck,
    FolderGit2,
    GraduationCap,
    HeartHandshake,
} from 'lucide-react';
import MutabaahStatusDonut from '@/components/dashboard/charts/mutabaah-status-donut';
import SantriJenisDonut from '@/components/dashboard/charts/santri-jenis-donut';
import DashboardHero from '@/components/dashboard/dashboard-hero';
import SectionHeading from '@/components/dashboard/section-heading';
import StatCard from '@/components/dashboard/stat-card';
import PageContainer from '@/components/page-container';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';
import { index as santrisIndex } from '@/routes/admin/santris';

type ChartSlice = {
    key: string;
    label: string;
    count: number;
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
    counts: {
        santris: number;
        ustadzs: number;
        orangTuas: number;
        halaqahs: number;
        mutabaahs: number;
    };
    recentMutabaahs: MutabaahRow[];
    mutabaahByStatus: ChartSlice[];
    santriByJenis: ChartSlice[];
    mutabaahsThisMonth: number;
    mutabaahsLastMonth: number;
    santrisThisMonth: number;
};

export default function AdminDashboard({
    counts,
    recentMutabaahs,
    mutabaahByStatus,
    santriByJenis,
    mutabaahsThisMonth,
    mutabaahsLastMonth,
    santrisThisMonth,
}: PageProps) {
    const mutabaahDelta = {
        direction: mutabaahsThisMonth >= mutabaahsLastMonth ? 'up' : 'down',
        value: `${Math.abs(mutabaahsThisMonth - mutabaahsLastMonth)} vs bulan lalu`,
    } as const;

    return (
        <PageContainer className="space-y-6">
            <Head title="Dashboard Admin" />
            <DashboardHero subtitle="Ringkasan data pesantren" />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <StatCard
                    label="Santri"
                    value={counts.santris}
                    icon={GraduationCap}
                    tone="violet"
                    subtitle={`${santrisThisMonth} santri baru bulan ini`}
                    href={santrisIndex().url}
                />
                <StatCard
                    label="Ustadz"
                    value={counts.ustadzs}
                    icon={BookOpen}
                    tone="indigo"
                />
                <StatCard
                    label="Orang Tua"
                    value={counts.orangTuas}
                    icon={HeartHandshake}
                    tone="fuchsia"
                />
                <StatCard
                    label="Halaqah"
                    value={counts.halaqahs}
                    icon={FolderGit2}
                    tone="teal"
                />
                <StatCard
                    label="Mutabaah"
                    value={counts.mutabaahs}
                    icon={ClipboardCheck}
                    tone="amber"
                    subtitle={`${mutabaahsThisMonth} bulan ini`}
                    delta={mutabaahDelta}
                />
            </div>

            <section>
                <SectionHeading
                    title="Distribusi Data"
                    description="Status mutabaah dan jenis santri di pesantren"
                />
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <MutabaahStatusDonut data={mutabaahByStatus} />
                    <SantriJenisDonut data={santriByJenis} />
                </div>
            </section>

            <Card>
                <CardHeader>
                    <CardTitle>Mutabaah Terbaru</CardTitle>
                </CardHeader>
                <CardContent>
                    {recentMutabaahs.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Belum ada mutabaah tercatat.
                        </p>
                    ) : (
                        <ul className="divide-y rounded-lg border">
                            {recentMutabaahs.map((m) => (
                                <li
                                    key={m.id}
                                    className="flex items-center justify-between gap-4 p-4"
                                >
                                    <p className="text-sm">
                                        {m.santri?.nama ?? '-'} · {m.tanggal} ·{' '}
                                        {m.jenis} · {m.surah} {m.ayat_mulai}-
                                        {m.ayat_selesai}
                                    </p>
                                    <Badge variant="secondary">
                                        {m.status}
                                    </Badge>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </PageContainer>
    );
}

AdminDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
