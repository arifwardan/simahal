import { Head } from '@inertiajs/react';
import PageContainer from '@/components/page-container';
import SantriProgressView from '@/components/santri-progress-view';
import { dashboard } from '@/routes';

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
};

export default function OrangTuaDashboard({ children }: PageProps) {
    return (
        <PageContainer>
            <Head title="Dashboard Orang Tua" />
            {children.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    Anda belum memiliki anak yang terdaftar di SIMAHAL.
                </p>
            ) : (
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
            )}
        </PageContainer>
    );
}

OrangTuaDashboard.layout = {
    breadcrumbs: [{
        title: 'Dashboard',
        href: dashboard(),
    }],
};
