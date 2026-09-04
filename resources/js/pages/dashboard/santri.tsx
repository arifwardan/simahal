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

export default function SantriDashboard({ progress, riwayat, halaqahs, mutabaahByStatus }: PageProps) {
    return (
        <PageContainer className="space-y-6">
            <Head title="Dashboard Santri" />
            <DashboardHero subtitle="Progres hafalan Anda — semangat mengejar target juz!" />
            <div className="grid gap-4 sm:grid-cols-3">
                <Card className="border-[3px] border-black bg-[#FFD600] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"><CardContent className="bg-[#FFF7E8] p-4 text-center"><p className="text-xs font-black uppercase">Progress</p><p className="font-head text-3xl font-black">{progress.progress}/{progress.target}</p><p className="text-xs font-bold">juz · {progress.percent}%</p></CardContent></Card>
                <Card className="border-[3px] border-black bg-[#5CE1E6] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"><CardContent className="bg-[#FFF7E8] p-4 text-center"><p className="text-xs font-black uppercase">Halaqah</p><p className="font-head text-3xl font-black">{halaqahs.length}</p><p className="text-xs font-bold">terdaftar</p></CardContent></Card>
                <Card className="border-[3px] border-black bg-[#FF90E8] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"><CardContent className="bg-[#FFF7E8] p-4 text-center"><p className="text-xs font-black uppercase">Riwayat</p><p className="font-head text-3xl font-black">{riwayat.length}</p><p className="text-xs font-bold">mutabaah</p></CardContent></Card>
            </div>
            <SantriProgressView progress={progress} riwayat={riwayat} halaqahs={halaqahs} />
            <section>
                <SectionHeading title="Distribusi Mutabaah" description="Status setoran mutabaah Anda" />
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div className="border-[3px] border-black bg-white p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"><MutabaahStatusDonut data={mutabaahByStatus} /></div>
                    <Card className="flex flex-col justify-center border-[3px] border-black bg-[#FFD600] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <CardContent className="bg-[#FFF7E8] p-6"><p className="font-head text-lg font-black uppercase">Tips Murajaah ★</p><p className="mt-2 border-l-[4px] border-black bg-white p-3 text-sm font-bold leading-relaxed">Konsisten 1 halaman/hari &amp; 1 juz target — istiqomah lebih baik. Tetap semangat!</p><p className="mt-3 inline-flex border-2 border-black bg-black px-2 py-1 text-xs font-black text-white">30 juz max · pelan-pelan</p></CardContent>
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
