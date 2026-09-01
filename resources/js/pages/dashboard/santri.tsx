import { Head } from '@inertiajs/react';
import MutabaahStatusDonut from '@/components/dashboard/charts/mutabaah-status-donut';
import DashboardHero from '@/components/dashboard/dashboard-hero';
import SectionHeading from '@/components/dashboard/section-heading';
import PageContainer from '@/components/page-container';
import SantriProgressView from '@/components/santri-progress-view';
import { Card, CardContent } from '@/components/ui/card';
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
        <PageContainer className="space-y-8">
            <Head title="Dashboard Santri" />
            <DashboardHero subtitle="Progres hafalan Anda — semangat mengejar target!" />
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
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <MutabaahStatusDonut data={mutabaahByStatus} />
                    <Card className="flex flex-col justify-center border-dashed bg-accent p-6">
                        <p className="font-head text-lg font-black uppercase">Tips Murajaah</p>
                        <p className="mt-2 text-sm font-bold leading-relaxed">
                            Konsisten 1 halaman per hari lebih baik daripada 10 halaman sekaligus lalu lupa. — Tetap semangat!
                        </p>
                    </Card>
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
