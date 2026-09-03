import { Head, Link } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, FolderGit2, GraduationCap, Trophy } from 'lucide-react';
import MutabaahStatusDonut from '@/components/dashboard/charts/mutabaah-status-donut';
import DashboardHero from '@/components/dashboard/dashboard-hero';
import SectionHeading from '@/components/dashboard/section-heading';
import StatCard from '@/components/dashboard/stat-card';
import PageContainer from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';
import { index as halaqahsIndex } from '@/routes/muhafidz/halaqahs';

type ChartSlice = {
    key: string;
    label: string;
    count: number;
};

type HalaqahRow = {
    id: number;
    nama: string;
    santris_count: number;
};

type TopSantri = {
    id: number;
    nama: string;
    nis: string | null;
    progress: number;
    target: number;
    percent: number;
    halaman_kumulatif: number | null;
    halaqah: string | null;
};

type HariIni = { tanggal: string; sudah: number; total: number; percent: number; belum: { id: number; nama: string }[] };
type PerhatianRow = { id: number; nama: string; nis: string | null; percent: number; lastStatus: string };
type HalaqahPerfRow = { id: number; nama: string; santris_count: number; avgPercent: number };

type PageProps = {
    halaqahs: HalaqahRow[];
    totalMutabaahs: number;
    mutabaahByStatus: ChartSlice[];
    mutabaahsThisMonth: number;
    mutabaahsLastMonth: number;
    topSantris: TopSantri[];
    hariIni: HariIni;
    perhatian: PerhatianRow[];
    halaqahPerf: HalaqahPerfRow[];
    recentMutabaahs: { id: number; tanggal: string; jenis: string; surah: string; ayat_mulai: number; ayat_selesai: number; status: string; santri?: { nama: string } | null }[];
};

export default function MuhafidzDashboard({
    halaqahs,
    totalMutabaahs,
    mutabaahByStatus,
    mutabaahsThisMonth,
    mutabaahsLastMonth,
    topSantris,
    hariIni,
    perhatian,
    halaqahPerf,
    recentMutabaahs,
}: PageProps) {
    const totalSantri = halaqahs.reduce((sum, h) => sum + h.santris_count, 0);

    const mutabaahDelta = {
        direction: mutabaahsThisMonth >= mutabaahsLastMonth ? 'up' : 'down',
        value: `${Math.abs(mutabaahsThisMonth - mutabaahsLastMonth)} vs bulan lalu`,
    } as const;

    return (
        <PageContainer className="space-y-8">
            <Head title="Dashboard Muhafidz" />
            <DashboardHero subtitle="Pantau halaqah, mutabaah harian & santri berprestasi Anda." />

            <div className="grid gap-4 sm:grid-cols-3 auto-rows-fr items-stretch">
                <StatCard
                    label="Halaqah"
                    value={halaqahs.length}
                    icon={FolderGit2}
                    tone="violet"
                    href={halaqahsIndex().url}
                />
                <StatCard
                    label="Santri"
                    value={totalSantri}
                    icon={GraduationCap}
                    tone="indigo"
                />
                <StatCard
                    label="Mutabaah"
                    value={totalMutabaahs}
                    icon={ClipboardCheck}
                    tone="fuchsia"
                    subtitle={`${mutabaahsThisMonth} bulan ini`}
                    delta={mutabaahDelta}
                />
            </div>

            {/* Hari ini + Perhatian */}
            <section>
                <SectionHeading title="Hari Ini" description={`Progres mutabaah ${hariIni.tanggal} — ${hariIni.sudah}/${hariIni.total} santri`} />
                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                    <Card className="flex flex-col">
                        <CardHeader className="bg-primary">
                            <CardTitle className="font-head font-black uppercase">Mutabaah Hari Ini</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-1 flex-col justify-center gap-3 pt-6">
                            <div className="flex items-baseline gap-2">
                                <span className="font-head text-4xl font-black">{hariIni.sudah}</span>
                                <span className="text-sm font-black">/ {hariIni.total} santri</span>
                                <span className="ml-auto border-2 border-black bg-black px-2 py-1 text-xs font-black text-[#FFF7E8]">
                                    {hariIni.percent}%
                                </span>
                            </div>
                            <div className="h-3 w-full border-[3px] border-black bg-[#FFF7E8] p-1">
                                <div className="h-full bg-black" style={{ width: `${hariIni.percent}%` }} />
                            </div>
                            {hariIni.belum.length > 0 ? (
                                <div className="border-2 border-black bg-accent p-2">
                                    <p className="text-xs font-black uppercase">Belum setoran:</p>
                                    <p className="text-xs font-bold">{hariIni.belum.map((s) => s.nama).join(', ')}</p>
                                </div>
                            ) : (
                                <p className="border-2 border-black bg-[#22c55e] p-2 text-center text-xs font-black uppercase">
                                    Alhamdulillah semua sudah!
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="flex flex-col">
                        <CardHeader className="bg-[#FF3B30] text-[#FFF7E8]">
                            <CardTitle className="font-head font-black uppercase">Perlu Perhatian</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-1 flex-col p-0">
                            {perhatian.length === 0 ? (
                                <p className="p-6 text-sm font-bold">Semua santri on track.</p>
                            ) : (
                                <ul className="flex-1 divide-y-[3px] divide-black border-t-[3px] border-black">
                                    {perhatian.map((s) => (
                                        <li key={s.id} className="flex items-center justify-between gap-3 bg-[#FFF7E8] p-3">
                                            <div className="min-w-0">
                                                <p className="truncate font-head text-xs font-black uppercase">{s.nama}</p>
                                                <p className="text-xs font-bold">
                                                    {s.percent}% · {s.lastStatus}
                                                </p>
                                            </div>
                                            <span className="shrink-0 border-2 border-black bg-[#FFD600] px-2 py-1 text-xs font-black">
                                                {s.percent}%
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="flex flex-col">
                        <CardHeader className="bg-[#5CE1E6]">
                            <CardTitle className="font-head font-black uppercase">Performa Halaqah</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-1 flex-col p-0">
                            {halaqahPerf.length === 0 ? (
                                <p className="p-6 text-sm font-bold">Belum ada halaqah.</p>
                            ) : (
                                <ul className="flex-1 divide-y-[3px] divide-black border-t-[3px] border-black">
                                    {halaqahPerf.slice(0, 3).map((h) => (
                                        <li key={h.id} className="flex items-center justify-between gap-3 bg-[#FFF7E8] p-3">
                                            <div className="min-w-0">
                                                <p className="truncate font-head text-xs font-black uppercase">{h.nama}</p>
                                                <p className="text-xs font-bold">{h.santris_count} santri</p>
                                            </div>
                                            <span className="border-2 border-black bg-black px-2 py-1 text-xs font-black text-[#FFF7E8]">
                                                {h.avgPercent}% avg
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </section>

            <section>
                <SectionHeading
                    title="Ringkasan Halaqah"
                    description="Distribusi status mutabaah di halaqah Anda"
                />
                <div className="mt-4 grid gap-4 lg:grid-cols-2 lg:items-stretch">
                    <div className="flex">
                        <MutabaahStatusDonut data={mutabaahByStatus} />
                    </div>
                    <Card className="flex h-full flex-col">
                        <CardHeader className="bg-[#FF90E8] text-black">
                            <CardTitle className="font-head font-black uppercase">Halaqah Saya</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-1 flex-col p-0">
                            {halaqahs.length === 0 ? (
                                <p className="p-6 text-sm font-bold">Belum ada halaqah.</p>
                            ) : (
                                <ul className="flex-1 divide-y-[3px] divide-black border-t-[3px] border-black">
                                    {halaqahs.map((h, idx) => (
                                        <li
                                            key={h.id}
                                            className={`flex items-center justify-between gap-4 p-4 font-bold ${
                                                idx % 2 === 0 ? 'bg-[#FFF7E8]' : 'bg-accent'
                                            } hover:bg-primary/30`}
                                        >
                                            <p className="font-head font-black uppercase">{h.nama}</p>
                                            <span className="border-2 border-black bg-[#5CE1E6] px-2 py-1 text-xs font-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                {h.santris_count} santri
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <div className="border-t-[3px] border-black bg-muted p-4">
                                <Button asChild className="w-full sm:w-auto">
                                    <Link href={halaqahsIndex()}>Kelola Halaqah →</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>

            <section>
                <SectionHeading
                    title="Santri Berprestasi"
                    description="Top 5 santri di halaqah Anda berdasarkan progress hafalan"
                />
                <Card className="mt-4">
                    <CardHeader className="bg-[#5CE1E6]">
                        <CardTitle className="flex items-center gap-2 font-head font-black uppercase text-black">
                            <Trophy className="size-5" /> Top Santri — Halaqah Saya
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {topSantris.length === 0 ? (
                            <p className="p-6 text-sm font-bold">Belum ada data santri di halaqah Anda.</p>
                        ) : (
                            <ul className="divide-y-[3px] divide-black border-t-[3px] border-black">
                                {topSantris.map((s, idx) => (
                                    <li
                                        key={s.id}
                                        className={`flex items-center gap-4 p-4 ${idx === 0 ? 'bg-[#FFD600]' : idx === 1 ? 'bg-[#E5E5E5]' : idx === 2 ? 'bg-[#FF90E8]' : 'bg-[#FFF7E8]'} hover:bg-accent`}
                                    >
                                        <span
                                            className={`flex size-10 shrink-0 items-center justify-center border-[3px] border-black text-sm font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-zinc-300' : idx === 2 ? 'bg-amber-600 text-[#FFF7E8]' : 'bg-[#FFF7E8]'}`}
                                        >
                                            #{idx + 1}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-head text-sm font-black uppercase">{s.nama}</p>
                                            <p className="truncate text-xs font-bold">
                                                {s.nis ?? '-'} {s.halaqah ? `· ${s.halaqah}` : ''} · {s.progress}/{s.target} hal ({s.percent}%)
                                            </p>
                                            <div className="mt-1 h-2 w-full border-2 border-black bg-[#FFF7E8]">
                                                <div className="h-full bg-black" style={{ width: `${Math.min(100, s.percent)}%` }} />
                                            </div>
                                        </div>
                                        <span className="shrink-0 border-2 border-black bg-black px-2 py-1 text-xs font-black text-[#FFF7E8]">
                                            {s.percent}%
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </section>

            <Card>
                <CardHeader className="bg-primary">
                    <CardTitle className="font-head font-black uppercase">Mutabaah Terbaru</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {recentMutabaahs.length === 0 ? (
                        <p className="p-6 text-sm font-bold">Belum ada mutabaah.</p>
                    ) : (
                        <ul className="divide-y-[3px] divide-black border-t-[3px] border-black">
                            {recentMutabaahs.map((m) => (
                                <li key={m.id} className="flex items-center justify-between gap-4 bg-[#FFF7E8] p-4 font-bold hover:bg-accent">
                                    <p className="text-sm">
                                        <span className="bg-black px-1.5 py-0.5 text-[#FFF7E8]">{m.santri?.nama ?? '-'}</span> · {m.tanggal} · {m.jenis} · {m.surah}{' '}
                                        {m.ayat_mulai}-{m.ayat_selesai}
                                    </p>
                                    <Badge>{m.status}</Badge>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </PageContainer>
    );
}

MuhafidzDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
