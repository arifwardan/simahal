import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
    headline?: string;
    progress: Progress;
    riwayat: RiwayatRow[];
    halaqahs: { id: number; nama: string }[];
}) {
    return (
        <>
            {headline && (
                <div className="flex items-center gap-3 border-l-[6px] border-black pl-3">
                    <h2 className="font-head text-lg font-black uppercase tracking-tight">{headline}</h2>
                </div>
            )}

            <Card className="mt-4 overflow-hidden border-[3px] border-black bg-[#FFF7E8] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <CardHeader className="bg-[#FFD600] py-3">
                    <CardTitle className="flex items-center gap-2 font-head font-black uppercase">
                        <span className="flex h-6 w-6 items-center justify-center border-2 border-black bg-black text-xs text-white">★</span>
                        Target Hafalan {progress.periode ? `· Periode ${progress.periode}` : ''} · Juz
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="border-[3px] border-black bg-black px-3 py-1 text-sm font-black text-[#FFF7E8] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            {progress.progress}/{progress.target} juz · {progress.percent}%
                        </p>
                        {progress.status && (
                            <Badge className="border-[3px] border-black bg-[#5CE1E6] font-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                {progress.status_label}
                            </Badge>
                        )}
                    </div>
                    <div className="h-5 w-full border-[3px] border-black bg-white p-1">
                        <div className="h-full bg-black transition-all" style={{ width: `${Math.min(100, progress.percent)}%` }} />
                    </div>
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-black uppercase">{progress.percent >= 100 ? 'Alhamdulillah tercapai!' : `${100 - progress.percent}% lagi`}</p>
                        <span className="border-2 border-black bg-[#FF90E8] px-2 py-1 text-xs font-black">{progress.target} juz max</span>
                    </div>
                </CardContent>
            </Card>

            <div className="mt-6 grid gap-4 lg:grid-cols-2 lg:items-stretch">
                <Card className="flex flex-col">
                    <CardHeader className="bg-[#5CE1E6]">
                        <CardTitle className="font-head font-black uppercase text-black">Halaqah</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col p-0">
                        {halaqahs.length === 0 ? (
                            <p className="p-6 text-sm font-bold">Belum terdaftar di halaqah.</p>
                        ) : (
                            <ul className="flex-1 divide-y-[3px] divide-black border-t-[3px] border-black">
                                {halaqahs.map((h, idx) => (
                                    <li
                                        key={h.id}
                                        className={`p-4 text-sm font-black uppercase ${idx % 2 === 0 ? 'bg-[#FFF7E8]' : 'bg-accent'}`}
                                    >
                                        <span className="border-2 border-black bg-primary px-2 py-1">{h.nama}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                <Card className="flex flex-col">
                    <CardHeader className="bg-[#FF90E8]">
                        <CardTitle className="font-head font-black uppercase text-black">Riwayat Mutabaah</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col p-0">
                        {riwayat.length === 0 ? (
                            <p className="p-6 text-sm font-bold">Belum ada mutabaah.</p>
                        ) : (
                            <ul className="flex-1 divide-y-[3px] divide-black border-t-[3px] border-black">
                                {riwayat.slice(0, 6).map((m) => (
                                    <li
                                        key={m.id}
                                        className="flex items-center justify-between gap-4 bg-[#FFF7E8] p-3 font-bold hover:bg-accent"
                                    >
                                        <p className="text-xs leading-tight">
                                            <span className="bg-black px-1.5 py-0.5 text-[#FFF7E8]">{m.tanggal}</span>{' '}
                                            {m.jenis} · {m.surah} {m.ayat_mulai}-{m.ayat_selesai}
                                        </p>
                                        <Badge className="shrink-0 border-2 border-black bg-black text-[#FFF7E8]">{m.status}</Badge>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {riwayat.length > 6 && (
                            <p className="border-t-[3px] border-black bg-muted p-3 text-center text-xs font-black uppercase">
                                + {riwayat.length - 6} lagi — lihat pagination
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
