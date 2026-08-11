import { Head } from '@inertiajs/react';
import PageContainer from '@/components/page-container';
import SantriProgressView from '@/components/santri-progress-view';
import { dashboard } from '@/routes';

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
    riwayat: {
        id: number;
        tanggal: string;
        jenis: string;
        surah: string;
        ayat_mulai: number;
        ayat_selesai: number;
        status: string;
    }[];
    halaqahs: { id: number; nama: string }[];
};

export default function SantriDashboard({ santri, progress, riwayat, halaqahs }: PageProps) {
    return (
        <PageContainer>
            <Head title="Dashboard Santri" />
            <SantriProgressView
                headline={`Selamat datang, ${santri.nama}`}
                progress={progress}
                riwayat={riwayat}
                halaqahs={halaqahs}
            />
        </PageContainer>
    );
}

SantriDashboard.layout = {
    breadcrumbs: [{
        title: 'Dashboard',
        href: dashboard(),
    }],
};
