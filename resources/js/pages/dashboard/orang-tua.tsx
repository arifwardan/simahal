import { Head } from '@inertiajs/react';
import ChildrenProgressDonut from '@/components/dashboard/charts/children-progress-donut';
import DashboardHero from '@/components/dashboard/dashboard-hero';
import SectionHeading from '@/components/dashboard/section-heading';
import PageContainer from '@/components/page-container';
import SantriProgressView from '@/components/santri-progress-view';
import { dashboard } from '@/routes';

type ChartSlice = {
    key: string;
    label: string;
    count: number;
};

type Child = {
    id: number;
    nama: string;
    nis: string | null;
    progress: {
        target: number;
        progress: number;
        percent: number;
        status: string;
        status_label: string;
        periode: string | null;
    };
};

type PageProps = {
    children: Child[];
    childrenProgress: ChartSlice[];
};

export default function OrangTuaDashboard({
    children,
    childrenProgress,
}: PageProps) {
    return (
        <PageContainer className="space-y-6">
            <Head title="Dashboard Orang Tua" />
            <DashboardHero subtitle="Progres anak Anda" />

            {children.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    Anda belum memiliki anak yang terdaftar di SIMAHAL.
                </p>
            ) : (
                <>
                    <section>
                        <SectionHeading
                            title="Ringkasan Progress Anak"
                            description="Status target hafalan anak Anda"
                        />
                        <div className="mt-4 max-w-md">
                            <ChildrenProgressDonut data={childrenProgress} />
                        </div>
                    </section>

                    <div className="space-y-8">
                        {children.map((child) => (
                            <SantriProgressView
                                key={child.id}
                                headline={child.nama}
                                progress={child.progress}
                                riwayat={[]}
                                halaqahs={[]}
                            />
                        ))}
                    </div>
                </>
            )}
        </PageContainer>
    );
}

OrangTuaDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
