import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type RiwayatRow = {
    id: number;
    tanggal: string;
    jenis: string;
    surah: string;
    ayat_mulai: number;
    ayat_selesai: number;
    status: string;
};

type Progress = {
    target: number;
    progress: number;
    percent: number;
    status: string;
    status_label: string;
    periode: string | null;
};

export default function SantriProgressView({
    headline,
    progress,
    riwayat,
    halaqahs,
}: {
    headline: string;
    progress: Progress;
    riwayat: RiwayatRow[];
    halaqahs: { id: number; nama: string }[];
}) {
    return (
        <>
            <h1 className="text-lg font-semibold">{headline}</h1>

            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>Target Hafalan {progress.periode ? `· Periode ${progress.periode}` : ''}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                            {progress.progress}/{progress.target} ayat · {progress.percent}%
                        </p>
                        {progress.status && (
                            <Badge variant="secondary">{progress.status_label}</Badge>
                        )}
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                        <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${Math.min(100, progress.percent)}%` }}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Halaqah</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {halaqahs.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Belum terdaftar di halaqah.</p>
                        ) : (
                            <ul className="space-y-1">
                                {halaqahs.map((h) => (
                                    <li key={h.id} className="text-sm">{h.nama}</li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Riwayat Mutabaah</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {riwayat.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Belum ada mutabaah.</p>
                        ) : (
                            <ul className="divide-y rounded-lg border">
                                {riwayat.map((m) => (
                                    <li key={m.id} className="flex items-center justify-between gap-4 p-3">
                                        <p className="text-sm">
                                            {m.tanggal} · {m.jenis} · {m.surah} {m.ayat_mulai}-{m.ayat_selesai}
                                        </p>
                                        <Badge variant="secondary">{m.status}</Badge>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
