import { Head } from '@inertiajs/react';
import DashboardHero from '@/components/dashboard/dashboard-hero';
import SectionHeading from '@/components/dashboard/section-heading';
import MutabaahStatusDonut from '@/components/dashboard/charts/mutabaah-status-donut';
import PageContainer from '@/components/page-container';
import SantriProgressView from '@/components/santri-progress-view';
import { dashboard } from '@/routes';

type ChartSlice = {
    key: string;
    label: string;
    count: number;
};

type RiwayatRow = {
    id: number;
    tanggal: string;
    jenis: string;
    surah: string;
    ayat_mulai: number;
    ayat_selesai: number;
    status: string;
};

type PageProps = {
    santri: { id: number; nama: string; nis: string | null };
    progress: {
        target: number;
        progress: number;
        percent: number;
        status: string;
        status_label: string;
        periode: string | null;
    };
    riwayat: RiwayatRow[];
    halaqahs: { id: number; nama: string }[];
    mutabaahByStatus: ChartSlice[];
};

export default function SantriDashboard({
    progress,
    riwayat,
    halaqahs,
    mutabaahByStatus,
}: PageProps) {
    return (
        <PageContainer className="space-y-6">
            <Head title="Dashboard Santri" />
            <DashboardHero subtitle="Progres hafalan Anda" />
            <SantriProgressView
                progress={progress}
                riwayat={riwayat}
                halaqahs={halaqahs}
            />
            <section>
                <SectionHeading
                    title="Distribusi Mutabaah"
                    description="Status setoran mutabaah Anda"
                />
                <div className="mt-4 max-w-md">
                    <MutabaahStatusDonut data={mutabaahByStatus} />
                </div>
            </section>
        </PageContainer>
    );
}

SantriDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
