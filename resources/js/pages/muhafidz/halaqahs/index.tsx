import { Link } from '@inertiajs/react';
import { BookOpen, ChevronRight, Clock, GraduationCap, Library, Search, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import Heading from '@/components/heading';
import PageContainer from '@/components/page-container';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { index } from '@/routes/muhafidz/halaqahs';
import { show as santrisShow } from '@/routes/muhafidz/halaqahs/santris';

type HalaqahRow = {
    id: number;
    nama: string;
    jadwal: string | null;
    status: string;
    santri_count: number;
};

export default function MuhafidzHalaqahsIndex({
    halaqahs,
}: {
    halaqahs: { data: HalaqahRow[]; total: number; current_page: number; last_page: number; links: { url: string | null; label: string; active: boolean }[] };
}) {
    const totalSantri = halaqahs.data.reduce((s, h) => s + h.santri_count, 0);
    const [q, setQ] = useState('');
    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return halaqahs.data;
        return halaqahs.data.filter((h) => h.nama.toLowerCase().includes(s) || (h.jadwal ?? '').toLowerCase().includes(s));
    }, [q, halaqahs.data]);
    const cardColors = ['bg-[#FFD600]', 'bg-[#FF90E8]', 'bg-[#5CE1E6]', 'bg-[#22c55e]', 'bg-[#FF3B30]'] as const;

    const columns = useMemo<DataTableColumn<HalaqahRow>[]>(
        () => [
            {
                id: 'nama',
                header: 'Halaqah',
                accessor: (r) => r.nama,
                cell: (row) => (
                    <div>
                        <p className="font-black text-black">{row.nama}</p>
                        <p className="text-xs font-bold text-black/60">{row.jadwal ?? 'Belum ada jadwal'}</p>
                    </div>
                ),
            },
            {
                id: 'santri',
                header: 'Santri',
                cell: (row) => (
                    <span className="inline-flex items-center gap-1 border-2 border-black bg-[#5CE1E6] px-2 py-1 text-xs font-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <GraduationCap className="h-3 w-3" /> {row.santri_count}
                    </span>
                ),
            },
            {
                id: 'status',
                header: 'Status',
                cell: (row) => <Badge className="border-2 border-black">{row.status}</Badge>,
            },
            {
                id: 'aksi',
                header: 'Aksi',
                headerClassName: 'text-right',
                className: 'text-right',
                cell: (row) => (
                    <Link
                        href={santrisShow({ halaqah: row.id })}
                        prefetch
                        className="inline-flex cursor-pointer items-center gap-1 rounded-none border-[3px] border-black bg-primary px-3 py-1 text-xs font-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                    >
                        Lihat Santri <ChevronRight className="h-4 w-4" />
                    </Link>
                ),
            },
        ],
        [],
    );

    return (
        <PageContainer>
            <Heading title="Halaqah Saya" description="Pilih halaqah untuk melihat santri dan mencatat mutabaah." />

            <Card className="overflow-hidden border-[3px] border-black bg-[#FFD600] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <CardContent className="flex flex-col gap-3 bg-[#FFF7E8] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="font-head text-lg font-black uppercase">Semangat Menghafal Hari Ini! 📖</p>
                        <p className="max-w-xl text-xs font-bold text-black/70">Input setoran harian, tasmi pekanan, dan ujian bulanan — satu layar satu tugas per santri.</p>
                    </div>
                    {halaqahs.data[0] && (
                        <Link
                            href={santrisShow({ halaqah: halaqahs.data[0].id })}
                            className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-none border-[3px] border-black bg-black px-4 py-2 text-xs font-black uppercase text-[#FFF7E8] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]"
                        >
                            Input Setoran →
                        </Link>
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-3">
                <Card className="border-[3px] border-black bg-[#FFF7E8] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <CardHeader className="flex-row items-center gap-3 bg-primary py-3">
                        <Library className="h-5 w-5" />
                        <CardTitle className="font-black uppercase">Total Halaqah</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <p className="font-head text-4xl font-black">{halaqahs.total}</p>
                        <p className="text-xs font-bold text-black/60">halaqah ampuan</p>
                    </CardContent>
                </Card>
                <Card className="border-[3px] border-black bg-[#FFF7E8] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <CardHeader className="flex-row items-center gap-3 bg-[#5CE1E6] py-3">
                        <GraduationCap className="h-5 w-5" />
                        <CardTitle className="font-black uppercase">Total Santri</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <p className="font-head text-4xl font-black">{totalSantri}</p>
                        <p className="text-xs font-bold text-black/60">santri di halaman ini</p>
                    </CardContent>
                </Card>
                <Card className="border-[3px] border-black bg-[#FF90E8] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <CardHeader className="flex-row items-center gap-3 bg-black py-3 text-[#FFF7E8]">
                        <CardTitle className="font-black uppercase text-[#FFF7E8]">Jadwal</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <p className="text-sm font-black">Masjid</p>
                        <p className="text-xs font-bold text-black/60">Setiap hari · cek jadwal halaqah</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="overflow-hidden border-[3px] border-black bg-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <CardHeader className="bg-black py-3">
                    <CardTitle className="flex items-center gap-2 font-head font-black uppercase text-[#FFF7E8]">
                        <Sparkles className="h-5 w-5 text-[#FFD600]" /> Daftar Halaqah ({halaqahs.total})
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 bg-[#FFF7E8] pt-6">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/60" />
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Cari halaqah / jadwal..."
                            className="h-10 w-full border-[3px] border-black bg-[#FFFEF2] pl-9 pr-3 text-sm font-bold placeholder:text-black/40"
                        />
                    </div>

                    {filtered.length === 0 ? (
                        <div className="border-[3px] border-dashed border-black bg-white p-8 text-center">
                            <p className="font-black uppercase text-black/60">Tidak ada halaqah</p>
                            <p className="text-xs font-bold text-black/40">Coba kata kunci lain</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {filtered.map((h, idx) => (
                                <div
                                    key={h.id}
                                    className={`group relative flex flex-col overflow-hidden rounded-none border-[3px] border-black ${cardColors[idx % cardColors.length]} p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]`}
                                >
                                    <div className="absolute right-2 top-2 rotate-3 border-2 border-black bg-white px-2 py-0.5 text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                        {h.status}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-none border-[3px] border-black bg-black text-[#FFF7E8] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                            <BookOpen className="h-5 w-5" />
                                        </div>
                                        <span className="border-2 border-black bg-white px-2 py-1 text-xs font-black">#{idx + 1}</span>
                                    </div>
                                    <h3 className="mt-3 font-head text-lg font-black uppercase leading-tight text-black line-clamp-2">{h.nama}</h3>
                                    <p className="mt-1 flex items-center gap-1 text-xs font-bold text-black/70">
                                        <Clock className="h-3 w-3" /> {h.jadwal ?? 'Belum ada jadwal'} · Masjid
                                    </p>
                                    <div className="mt-3 flex items-center gap-2">
                                        <span className="inline-flex items-center gap-1 border-[3px] border-black bg-black px-3 py-1 text-xs font-black text-[#FFF7E8]">
                                            <GraduationCap className="h-3 w-3" /> {h.santri_count} santri
                                        </span>
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        <Link
                                            href={santrisShow({ halaqah: h.id })}
                                            prefetch
                                            className="flex-1 cursor-pointer rounded-none border-[3px] border-black bg-white px-3 py-2 text-center text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-[#FFF7E8]"
                                        >
                                            Lihat Santri
                                        </Link>
                                        <Link
                                            href={santrisShow({ halaqah: h.id })}
                                            prefetch
                                            className="cursor-pointer rounded-none border-[3px] border-black bg-black px-3 py-2 text-xs font-black uppercase text-[#FFF7E8] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                        >
                                            Input →
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <details className="rounded-none border-[3px] border-black bg-white">
                        <summary className="cursor-pointer list-none bg-black px-3 py-2 text-xs font-black uppercase text-[#FFF7E8]">Tampilan tabel (alternatif)</summary>
                        <div className="p-3">
                            <DataTable columns={columns} data={halaqahs.data} pagination={halaqahs} perPage={5} searchPlaceholder="Cari halaqah..." emptyMessage="Belum ada halaqah." />
                        </div>
                    </details>
                </CardContent>
            </Card>
        </PageContainer>
    );
}

MuhafidzHalaqahsIndex.layout = {
    breadcrumbs: [{
        title: 'Halaqah Saya',
        href: index(),
    }],
};