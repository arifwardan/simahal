import { Head } from '@inertiajs/react';
import { BookOpen, CalendarDays, GraduationCap, Heart, Medal, TrendingUp, Trophy } from 'lucide-react';
import ChildrenProgressDonut from '@/components/dashboard/charts/children-progress-donut';
import MutabaahStatusDonut from '@/components/dashboard/charts/mutabaah-status-donut';
import DashboardHero from '@/components/dashboard/dashboard-hero';
import SectionHeading from '@/components/dashboard/section-heading';
import PageContainer from '@/components/page-container';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatTanggal } from '@/lib/utils';
import { dashboard } from '@/routes';

type ChartSlice = { key: string; label: string; count: number };
type ChildProgress = { target: number; progress: number; percent: number; status: string; status_label: string; periode: string | null };
type Child = {
    id: number; nama: string; nis: string | null; progress: ChildProgress;
    halaqahs: { id:number; nama:string; jam_mulai:string|null; jam_selesai:string|null }[];
    riwayat: { id:number; tanggal:string; jenis:string; surah:string; ayat_mulai:number; ayat_selesai:number; status:string; nilai:number|null }[];
    mutabaahByStatus: ChartSlice[];
    recentBulanan: { id:number; tahun:number; bulan:number; halaman_kumulatif:number|null; tasmi_pekan_1:number|null; ujian_bulanan:number|null }[];
    totalMutabaah: number;
};
type PageProps = { children: Child[]; childrenProgress: ChartSlice[]; stats: { total:number; avgPercent:number; bestChild:{nama:string;percent:number}|null; totalMutabaah:number } };
const bulanNama=['','Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

export default function OrangTuaDashboard({ children, childrenProgress, stats }: PageProps) {
    return (
        <PageContainer className="space-y-8">
            <Head title="Dashboard Orang Tua" />
            <DashboardHero subtitle="Pantau hafalan & mutabaah ananda — dukung langkah kecil setiap hari." />

            {children.length === 0 ? (
                <Card className="border-[3px] border-dashed border-black dark:border-[#FFF7E8] bg-[#FFF7E8] dark:bg-zinc-900 p-10 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                    <Heart className="mx-auto h-8 w-8" />
                    <p className="mt-2 font-head font-black uppercase">Belum ada ananda terhubung</p>
                    <p className="text-sm font-bold text-black/60 dark:text-[#FFF7E8]/60">Hubungi admin untuk menautkan santri ke akun Anda.</p>
                </Card>
            ) : (
                <>
                    {/* Stat cards */}
                    <div className="grid gap-4 sm:grid-cols-4">
                        <Card className="border-[3px] border-black dark:border-[#FFF7E8] bg-[#FFD600] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                            <CardContent className="bg-[#FFF7E8] dark:bg-zinc-900 p-4 text-center">
                                <GraduationCap className="mx-auto h-5 w-5" />
                                <p className="mt-1 text-xs font-black uppercase">Ananda</p>
                                <p className="font-head text-3xl font-black">{stats.total}</p>
                                <p className="text-xs font-bold">terhubung</p>
                            </CardContent>
                        </Card>
                        <Card className="border-[3px] border-black dark:border-[#FFF7E8] bg-[#5CE1E6] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                            <CardContent className="bg-[#FFF7E8] dark:bg-zinc-900 p-4 text-center">
                                <TrendingUp className="mx-auto h-5 w-5" />
                                <p className="text-xs font-black uppercase">Rata Progress</p>
                                <p className="font-head text-3xl font-black">{stats.avgPercent}%</p>
                                <div className="mx-auto mt-1 h-2 w-full max-w-[100px] border-2 border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900"><div className="h-full bg-black" style={{width:`${stats.avgPercent}%`}}/></div>
                            </CardContent>
                        </Card>
                        <Card className="border-[3px] border-black dark:border-[#FFF7E8] bg-[#FF90E8] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                            <CardContent className="bg-[#FFF7E8] dark:bg-zinc-900 p-4 text-center">
                                <Trophy className="mx-auto h-5 w-5" />
                                <p className="text-xs font-black uppercase">Terdepan</p>
                                <p className="truncate font-head text-sm font-black">{stats.bestChild?.nama ?? '-'}</p>
                                <Badge className="mt-1 border-2 border-black dark:border-[#FFF7E8] bg-black text-white">{stats.bestChild?.percent ?? 0}%</Badge>
                            </CardContent>
                        </Card>
                        <Card className="border-[3px] border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                            <CardContent className="bg-[#FFF7E8] dark:bg-zinc-900 p-4 text-center">
                                <BookOpen className="mx-auto h-5 w-5" />
                                <p className="text-xs font-black uppercase">Mutabaah</p>
                                <p className="font-head text-3xl font-black">{stats.totalMutabaah}</p>
                                <p className="text-xs font-bold">catatan ananda</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Progress overview */}
                    <section>
                        <SectionHeading title="Ringkasan Ananda" description="Sebaran status hafalan & tips pendampingan" />
                        <div className="mt-4 grid gap-4 lg:grid-cols-5">
                            <div className="lg:col-span-3 flex"><ChildrenProgressDonut data={childrenProgress} /></div>
                            <div className="lg:col-span-2 flex flex-col gap-4">
                                <Card className="border-[3px] border-black dark:border-[#FFF7E8] bg-[#FFD600] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                                    <CardContent className="bg-[#FFF7E8] dark:bg-zinc-900 p-5">
                                        <p className="font-head font-black uppercase flex items-center gap-2"><Heart className="h-4 w-4"/> Ayah/Bunda Hebat</p>
                                        <p className="mt-2 text-sm font-bold leading-relaxed">15 menit murajaah ba&apos;da Maghrib + doa. Konsistensi &gt; intensitas. Tanya ananda: “Hari ini setoran surah apa?”</p>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <span className="border-2 border-black dark:border-[#FFF7E8] bg-black px-2 py-1 text-xs font-black text-white">Rutinkan</span>
                                            <span className="border-2 border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 px-2 py-1 text-xs font-black">Apresiasi</span>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="flex-1 border-[3px] border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
                                    <CardContent className="flex h-full items-center justify-between bg-[#FFF7E8] dark:bg-zinc-900 p-4">
                                        <div><p className="text-xs font-black uppercase">Total Ananda</p><p className="font-head text-2xl font-black">{children.length} anak</p></div>
                                        <Medal className="h-8 w-8 opacity-20" />
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </section>

                    {/* Per anak detail */}
                    <section className="space-y-6">
                        <SectionHeading title="Detail Ananda" description="Progress, halaqah, mutabaah terbaru & bulanan" />
                        {children.map((child, idx) => (
                            <Card key={child.id} className="overflow-hidden border-[3px] border-black dark:border-[#FFF7E8] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
                                <CardHeader className={`${idx%3===0?'bg-[#FFD600]':idx%3===1?'bg-[#5CE1E6]':'bg-[#FF90E8]'} border-b-[3px] border-black dark:border-[#FFF7E8]`}>
                                    <CardTitle className="flex flex-wrap items-center justify-between gap-2 font-head font-black uppercase text-black">
                                        <span className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center border-[3px] border-black dark:border-[#FFF7E8] bg-black text-white text-sm">{idx+1}</span>{child.nama} <span className="text-xs normal-case font-bold opacity-70">· {child.nis ?? '-'}</span></span>
                                        <Badge className="border-[3px] border-black dark:border-[#FFF7E8] bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">{child.progress.percent}% · {child.progress.status_label || '—'}</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 bg-[#FFFEF2] dark:bg-zinc-900 p-4 sm:p-6">
                                    {/* progress bar */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-black uppercase"><span>Target {child.progress.periode ?? '-'}</span><span>{child.progress.progress}/{child.progress.target} · {child.progress.percent}%</span></div>
                                        <div className="h-4 w-full border-[3px] border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 p-1"><div className="h-full bg-black transition-all" style={{width:`${Math.min(100, child.progress.percent)}%`}}/></div>
                                        <p className="text-xs font-bold">{child.progress.percent >=100 ? 'Alhamdulillah tercapai!' : `${100-child.progress.percent}% lagi menuju target`}</p>
                                    </div>

                                    <div className="grid gap-4 lg:grid-cols-3">
                                        {/* Halaqah & bulanan */}
                                        <div className="space-y-3">
                                            <div className="border-[3px] border-black dark:border-[#FFF7E8] bg-[#FFF7E8] dark:bg-zinc-900 p-3">
                                                <p className="text-xs font-black uppercase flex items-center gap-1"><GraduationCap className="h-3 w-3"/> Halaqah</p>
                                                {child.halaqahs.length===0?<p className="mt-2 text-sm font-bold">Belum terdaftar</p>:<ul className="mt-2 space-y-1">{child.halaqahs.map(h=><li key={h.id} className="border-2 border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 px-2 py-1 text-xs font-black">{h.nama} <span className="font-bold opacity-60">{h.jam_mulai?`${h.jam_mulai}-${h.jam_selesai}`:''}</span></li>)}</ul>}
                                            </div>
                                            <div className="border-[3px] border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 p-3">
                                                <p className="text-xs font-black uppercase flex items-center gap-1"><CalendarDays className="h-3 w-3"/> Bulanan Terbaru</p>
                                                {child.recentBulanan.length===0?<p className="mt-2 text-xs font-bold">Belum ada</p>:<ul className="mt-2 divide-y border-2 border-black dark:border-[#FFF7E8] text-xs font-bold">{child.recentBulanan.map(b=><li key={b.id} className="flex justify-between bg-[#FFF7E8] dark:bg-zinc-900 px-2 py-1"><span>{bulanNama[b.bulan]} {b.tahun}</span><span>{b.halaman_kumulatif??'-'} hal · T {b.tasmi_pekan_1??'-'} U {b.ujian_bulanan??'-'}</span></li>)}</ul>}
                                            </div>
                                        </div>

                                        {/* Riwayat */}
                                        <div className="border-[3px] border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900">
                                            <div className="border-b-[3px] border-black dark:border-[#FFF7E8] bg-black px-3 py-2 text-xs font-black uppercase text-white">Riwayat Terbaru</div>
                                            {child.riwayat.length===0?<p className="p-4 text-sm font-bold">Belum ada mutabaah</p>:<ul className="divide-y-[3px] divide-black dark:divide-[#FFF7E8]">{child.riwayat.map(m=><li key={m.id} className="flex items-center justify-between gap-2 bg-[#FFF7E8] dark:bg-zinc-900 p-2.5 text-xs font-bold"><span><span className="bg-black px-1 py-0.5 text-white">{formatTanggal(m.tanggal)}</span> {m.surah} {m.ayat_mulai}-{m.ayat_selesai} · {m.jenis}</span><Badge className="shrink-0 border-2 border-black dark:border-[#FFF7E8] text-[10px]">{m.status}</Badge></li>)}</ul>}
                                            <div className="border-t-[3px] border-black dark:border-[#FFF7E8] bg-[#FFD600] px-3 py-2 text-center text-xs font-black text-black">{child.totalMutabaah} total catatan</div>
                                        </div>

                                        {/* Donut mini */}
                                        <div className="border-[3px] border-black dark:border-[#FFF7E8] bg-[#FFF7E8] dark:bg-zinc-900 p-2 flex flex-col">
                                            <p className="px-2 py-1 text-xs font-black uppercase">Status Mutabaah</p>
                                            {child.mutabaahByStatus.length===0?<p className="p-4 text-sm font-bold">Belum ada</p>:<div className="flex-1"><MutabaahStatusDonut data={child.mutabaahByStatus} /></div>}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </section>
                </>
            )}
        </PageContainer>
    );
}
OrangTuaDashboard.layout = { breadcrumbs: [{ title: 'Dashboard', href: dashboard() }] };
