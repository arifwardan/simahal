import { Head } from '@inertiajs/react';
import {
    BookOpen,
    ClipboardCheck,
    FolderGit2,
    GraduationCap,
    HeartHandshake,
} from 'lucide-react';
import MutabaahStatusDonut from '@/components/dashboard/charts/mutabaah-status-donut';
import SantriJenisDonut from '@/components/dashboard/charts/santri-jenis-donut';
import DashboardHero from '@/components/dashboard/dashboard-hero';
import SectionHeading from '@/components/dashboard/section-heading';
import StatCard from '@/components/dashboard/stat-card';
import PageContainer from '@/components/page-container';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import { dashboard } from '@/routes';
import { index as santrisIndex } from '@/routes/admin/santris';

type ChartSlice = {
    key: string;
    label: string;
    count: number;
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

type TopHalaqah = { id: number; nama: string; santris_count: number; muhafidz: string | null; jam: string | null };

type PageProps = {
    counts: {
        santris: number;
        muhafidzs: number;
        orangTuas: number;
        halaqahs: number;
        mutabaahs: number;
    };
    recentMutabaahs: MutabaahRow[];
    mutabaahByStatus: ChartSlice[];
    santriByJenis: ChartSlice[];
    mutabaahsThisMonth: number;
    mutabaahsLastMonth: number;
    santrisThisMonth: number;
    topSantris: TopSantri[];
    topHalaqahs: TopHalaqah[];
    perhatian: { santriTanpaHalaqah: number; targetTertunda: number };
    hariIni: { mutabaahHariIni: number; mutabaahKemarin: number };
};

export default function AdminDashboard({
    counts,
    recentMutabaahs,
    mutabaahByStatus,
    santriByJenis,
    mutabaahsThisMonth,
    mutabaahsLastMonth,
    santrisThisMonth,
    topSantris,
    topHalaqahs,
    perhatian,
    hariIni,
}: PageProps) {
    const mutabaahDelta = {
        direction: mutabaahsThisMonth >= mutabaahsLastMonth ? 'up' : 'down',
        value: `${Math.abs(mutabaahsThisMonth - mutabaahsLastMonth)} vs bulan lalu`,
    } as const;

    return (
        <PageContainer className="space-y-8">
            <Head title="Dashboard Admin" />
            <DashboardHero subtitle="Ringkasan data pesantren — pantau santri, halaqah & mutabaah harian." />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 auto-rows-fr">
                <StatCard
                    label="Santri"
                    value={counts.santris}
                    icon={GraduationCap}
                    tone="violet"
                    subtitle={`${santrisThisMonth} santri baru bulan ini`}
                    href={santrisIndex().url}
                />
                <StatCard
                    label="Muhafidz"
                    value={counts.muhafidzs}
                    icon={BookOpen}
                    tone="indigo"
                />
                <StatCard
                    label="Orang Tua"
                    value={counts.orangTuas}
                    icon={HeartHandshake}
                    tone="fuchsia"
                />
                <StatCard
                    label="Halaqah"
                    value={counts.halaqahs}
                    icon={FolderGit2}
                    tone="teal"
                />
                <StatCard
                    label="Mutabaah"
                    value={counts.mutabaahs}
                    icon={ClipboardCheck}
                    tone="amber"
                    subtitle={`${mutabaahsThisMonth} bulan ini`}
                    delta={mutabaahDelta}
                />
            </div>

            {/* Hari ini + Perhatian + Top Halaqah */}
            <section>
                <SectionHeading title="Kilas Hari Ini" description="Aktivitas & halaqah terpadat — insight cepat untuk admin" />
                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                    <Card className="flex flex-col">
                        <CardHeader className="bg-primary">
                            <CardTitle className="font-head font-black uppercase">Mutabaah Hari Ini</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-1 flex-col justify-center gap-3 pt-6">
                            <div className="flex items-baseline gap-2">
                                <span className="font-head text-4xl font-black">{hariIni.mutabaahHariIni}</span>
                                <span className="text-sm font-bold">catatan</span>
                                <Badge className="ml-auto border-2 border-black bg-black text-white">
                                    kemarin {hariIni.mutabaahKemarin}
                                </Badge>
                            </div>
                            <div className="h-2 w-full border-2 border-black bg-white">
                                <div
                                    className="h-full bg-black"
                                    style={{
                                        width: `${hariIni.mutabaahKemarin > 0 ? Math.min(100, (hariIni.mutabaahHariIni / Math.max(1, hariIni.mutabaahKemarin)) * 100) : hariIni.mutabaahHariIni > 0 ? 100 : 0}%`,
                                    }}
                                />
                            </div>
                            <p className="text-xs font-bold">
                                {hariIni.mutabaahHariIni >= hariIni.mutabaahKemarin ? '↗ Naik' : '↘ Turun'} vs kemarin
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="flex flex-col">
                        <CardHeader className="bg-[#FF3B30] text-white">
                            <CardTitle className="font-head font-black uppercase">Perlu Perhatian</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-1 flex-col gap-3 pt-6">
                            <div className="flex items-center justify-between border-[3px] border-black bg-white p-3">
                                <span className="text-sm font-black uppercase">Tanpa Halaqah</span>
                                <span className="border-2 border-black bg-black px-2 py-1 text-sm font-black text-white">
                                    {perhatian.santriTanpaHalaqah}
                                </span>
                            </div>
                            <div className="flex items-center justify-between border-[3px] border-black bg-[#FFE7A3] p-3">
                                <span className="text-sm font-black uppercase">Target Tertunda</span>
                                <span className="border-2 border-black bg-white px-2 py-1 text-sm font-black">
                                    {perhatian.targetTertunda}
                                </span>
                            </div>
                            <p className="text-xs font-bold">Segera assign & follow-up muhafidz.</p>
                        </CardContent>
                    </Card>

                    <Card className="flex flex-col">
                        <CardHeader className="bg-[#5CE1E6]">
                            <CardTitle className="font-head font-black uppercase">Halaqah Terpadat</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {topHalaqahs.length === 0 ? (
                                <p className="p-6 text-sm font-bold">Belum ada halaqah.</p>
                            ) : (
                                <ul className="divide-y-[3px] divide-black border-t-[3px] border-black">
                                    {topHalaqahs.map((h, idx) => (
                                        <li
                                            key={h.id}
                                            className={`flex items-center justify-between gap-3 p-3 font-bold ${idx === 0 ? 'bg-[#FFD600]' : 'bg-white'}`}
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate font-head text-sm font-black uppercase">{h.nama}</p>
                                                <p className="truncate text-xs">
                                                    {h.muhafidz ?? '-'} {h.jam ? `· ${h.jam}` : ''}
                                                </p>
                                            </div>
                                            <span className="shrink-0 border-2 border-black bg-black px-2 py-1 text-xs font-black text-white">
                                                {h.santris_count} santri
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
                    title="Distribusi Data"
                    description="Status mutabaah dan jenis santri di pesantren"
                />
                <div className="mt-4 grid gap-4 lg:grid-cols-2 lg:items-stretch">
                    <div className="flex w-full">
                        <MutabaahStatusDonut data={mutabaahByStatus} />
                    </div>
                    <div className="flex w-full">
                        <SantriJenisDonut data={santriByJenis} />
                    </div>
                </div>
            </section>

            <section>
                <SectionHeading
                    title="Santri Berprestasi"
                    description="Top 5 keseluruhan santri berdasarkan progress hafalan"
                />
                <Card className="mt-4">
                    <CardHeader className="bg-[#FFD600]">
                        <CardTitle className="flex items-center gap-2 font-head font-black uppercase">
                            <Trophy className="size-5" /> Top Santri — Keseluruhan
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {topSantris.length === 0 ? (
                            <p className="p-6 text-sm font-bold">Belum ada data santri.</p>
                        ) : (
                            <ul className="divide-y-[3px] divide-black border-t-[3px] border-black">
                                {topSantris.map((s, idx) => (
                                    <li
                                        key={s.id}
                                        className={`flex items-center gap-4 p-4 ${idx === 0 ? 'bg-[#FFD600]' : idx === 1 ? 'bg-[#E5E5E5]' : idx === 2 ? 'bg-[#FF90E8]' : 'bg-white'} hover:bg-accent`}
                                    >
                                        <span
                                            className={`flex size-10 shrink-0 items-center justify-center border-[3px] border-black text-sm font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-zinc-300' : idx === 2 ? 'bg-amber-600 text-white' : 'bg-white'}`}
                                        >
                                            #{idx + 1}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-head text-sm font-black uppercase">{s.nama}</p>
                                            <p className="truncate text-xs font-bold">
                                                {s.nis ?? '-'} {s.halaqah ? `· ${s.halaqah}` : ''} · {s.progress}/{s.target} hal ({s.percent}%)
                                            </p>
                                            <div className="mt-1 h-2 w-full border-2 border-black bg-white">
                                                <div
                                                    className="h-full bg-black transition-all"
                                                    style={{ width: `${Math.min(100, s.percent)}%` }}
                                                />
                                            </div>
                                        </div>
                                        <Badge className="shrink-0 border-2 border-black bg-black text-white">
                                            {s.percent}%
                                        </Badge>
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
                        <p className="p-6 text-sm font-bold">Belum ada mutabaah tercatat.</p>
                    ) : (
                        <ul className="divide-y-[3px] divide-black border-t-[3px] border-black">
                            {recentMutabaahs.map((m) => (
                                <li
                                    key={m.id}
                                    className="flex items-center justify-between gap-4 bg-white p-4 font-bold hover:bg-accent"
                                >
                                    <p className="text-sm">
                                        <span className="bg-black px-1.5 py-0.5 text-white">{m.santri?.nama ?? '-'}</span>{' '}
                                        · {m.tanggal} · {m.jenis} · {m.surah} {m.ayat_mulai}-{m.ayat_selesai}
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

AdminDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
