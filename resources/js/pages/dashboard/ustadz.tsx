import { Head, Link } from '@inertiajs/react';
import { ClipboardCheck, FolderGit2, GraduationCap } from 'lucide-react';
import StatCard from '@/components/dashboard/stat-card';
import DashboardHero from '@/components/dashboard/dashboard-hero';
import SectionHeading from '@/components/dashboard/section-heading';
import MutabaahStatusDonut from '@/components/dashboard/charts/mutabaah-status-donut';
import PageContainer from '@/components/page-container';
import { dashboard } from '@/routes';
import { index as halaqahsIndex } from '@/routes/ustadz/halaqahs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type ChartSlice = {
    key: string;
    label: string;
    count: number;
};

type HalaqahRow = {
    id: number;
    nama: string;
    santris_count: number;
};

type PageProps = {
    halaqahs: HalaqahRow[];
    totalMutabaahs: number;
    mutabaahByStatus: ChartSlice[];
    mutabaahsThisMonth: number;
    mutabaahsLastMonth: number;
};

export default function UstadzDashboard({
    halaqahs,
    totalMutabaahs,
    mutabaahByStatus,
    mutabaahsThisMonth,
    mutabaahsLastMonth,
}: PageProps) {
    const totalSantri = halaqahs.reduce((sum, h) => sum + h.santris_count, 0);

    const mutabaahDelta = {
        direction: mutabaahsThisMonth >= mutabaahsLastMonth ? 'up' : 'down',
        value: `${Math.abs(mutabaahsThisMonth - mutabaahsLastMonth)} vs bulan lalu`,
    } as const;

    return (
        <PageContainer className="space-y-6">
            <Head title="Dashboard Ustadz" />
            <DashboardHero subtitle="Ringkasan halaqah Anda" />

            <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                    label="Halaqah"
                    value={halaqahs.length}
                    icon={FolderGit2}
                    tone="violet"
                    href={halaqahsIndex().url}
                />
                <StatCard
                    label="Santri"
                    value={totalSantri}
                    icon={GraduationCap}
                    tone="indigo"
                />
                <StatCard
                    label="Mutabaah"
                    value={totalMutabaahs}
                    icon={ClipboardCheck}
                    tone="fuchsia"
                    subtitle={`${mutabaahsThisMonth} bulan ini`}
                    delta={mutabaahDelta}
                />
            </div>

            <section>
                <SectionHeading
                    title="Ringkasan Halaqah"
                    description="Distribusi status mutabaah di halaqah Anda"
                />
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <MutabaahStatusDonut data={mutabaahByStatus} />
                    <Card>
                        <CardHeader>
                            <CardTitle>Halaqah Saya</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {halaqahs.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Belum ada halaqah.
                                </p>
                            ) : (
                                <ul className="divide-y rounded-lg border">
                                    {halaqahs.map((h) => (
                                        <li
                                            key={h.id}
                                            className="flex items-center justify-between gap-4 p-4"
                                        >
                                            <p className="font-medium">
                                                {h.nama}
                                            </p>
                                            <span className="text-sm text-muted-foreground">
                                                {h.santris_count} santri
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <Button asChild variant="outline" className="mt-4">
                                <Link href={halaqahsIndex()}>
                                    Kelola Halaqah
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </section>
        </PageContainer>
    );
}

UstadzDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
