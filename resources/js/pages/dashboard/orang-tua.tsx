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
        <PageContainer className="space-y-8">
            <Head title="Dashboard Orang Tua" />
            <DashboardHero subtitle="Pantau hafalan & mutabaah anak Anda setiap hari." />

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
                        <div className="mt-4 grid gap-4 lg:grid-cols-2 lg:items-stretch">
                            <div className="flex">
                                <ChildrenProgressDonut data={childrenProgress} />
                            </div>
                            <div className="flex flex-col gap-4">
                                <div className="border-[3px] border-black bg-[#FFD600] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                                    <p className="font-head text-lg font-black uppercase">Ayah/Bunda Hebat!</p>
                                    <p className="mt-1 text-sm font-bold">Dukung ananda murajaah 15 menit tiap ba'da Maghrib — konsisten itu kunci.</p>
                                </div>
                                <div className="flex flex-1 items-center justify-center border-[3px] border-dashed border-black bg-[#FFF7E8] p-6 text-center">
                                    <p className="font-head text-sm font-black uppercase">{children.length} Anak Terhubung</p>
                                </div>
                            </div>
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
