import { Head } from '@inertiajs/react';
import { BookOpen, ClipboardCheck, FolderGit2, GraduationCap, HeartHandshake } from 'lucide-react';
import StatCard from '@/components/dashboard/stat-card';
import PageContainer from '@/components/page-container';
import { dashboard } from '@/routes';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

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
};

export default function AdminDashboard({ counts, recentMutabaahs }: PageProps) {
    return (
        <PageContainer>
            <Head title="Dashboard Admin" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <StatCard label="Santri" value={counts.santris} icon={GraduationCap} tone="emerald" />
                <StatCard label="Ustadz" value={counts.ustadzs} icon={BookOpen} tone="sky" />
                <StatCard label="Orang Tua" value={counts.orangTuas} icon={HeartHandshake} tone="violet" />
                <StatCard label="Halaqah" value={counts.halaqahs} icon={FolderGit2} tone="amber" />
                <StatCard label="Mutabaah" value={counts.mutabaahs} icon={ClipboardCheck} tone="rose" />
            </div>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Mutabaah Terbaru</CardTitle>
                </CardHeader>
                <CardContent>
                    {recentMutabaahs.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Belum ada mutabaah tercatat.</p>
                    ) : (
                        <ul className="divide-y rounded-lg border">
                            {recentMutabaahs.map((m) => (
                                <li key={m.id} className="flex items-center justify-between gap-4 p-4">
                                    <p className="text-sm">
                                        {m.santri?.nama ?? '-'} · {m.tanggal} · {m.jenis} · {m.surah} {m.ayat_mulai}-{m.ayat_selesai}
                                    </p>
                                    <Badge variant="secondary">{m.status}</Badge>
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
    breadcrumbs: [{
        title: 'Dashboard',
        href: dashboard(),
    }],
};
