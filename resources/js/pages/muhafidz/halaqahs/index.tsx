import { Link } from '@inertiajs/react';
import { ChevronRight, GraduationCap, Library } from 'lucide-react';
import { useMemo } from 'react';
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

            <div className="grid gap-4 sm:grid-cols-2">
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
                        <p className="text-xs font-bold text-black/60">santri di hal ini</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="overflow-hidden border-[3px] border-black bg-[#FFE7A3] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <CardHeader className="bg-primary">
                    <CardTitle className="font-head font-black uppercase">Daftar Halaqah ({halaqahs.total})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 bg-[#FFF7E8] pt-6">
                    <DataTable columns={columns} data={halaqahs.data} pagination={halaqahs} perPage={5} searchPlaceholder="Cari halaqah..." emptyMessage="Belum ada halaqah." />
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