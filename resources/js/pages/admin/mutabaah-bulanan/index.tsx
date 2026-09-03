import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import Heading from '@/components/heading';
import PageContainer from '@/components/page-container';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { index } from '@/routes/admin/mutabaah-bulanan';

type MutabaahRow = {
    jenis: string;
    kelompok: string;
    muhafidz: string | null;
    jumlah_santri: number;
    terisi: number;
    rata_halaman_kumulatif: number | null;
    rata_tambah_juz: number | null;
    rata_tasmi: number | null;
    rata_ujian: number | null;
    berprestasi: number;
};

type DistribusiRow = {
    kategori: string;
    ikhwan: number;
    akhwat: number;
    total: number;
};

type Props = {
    rows: MutabaahRow[];
    distribusi: DistribusiRow[];
    bulan: number;
    tahun: number;
};

const bulanNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
];

export default function AdminMutabaahBulananDashboard({ rows, distribusi, bulan, tahun }: Props) {
    const [selectedBulan, setSelectedBulan] = useState<string>(String(bulan));

    const ringkasanColumns = useMemo<DataTableColumn<MutabaahRow>[]>(
        () => [
            {
                id: 'jenis',
                header: 'Jenis',
                cell: (r) => <span className="font-bold text-black">{r.jenis}</span>,
            },
            {
                id: 'kelompok',
                header: 'Kelompok',
                cell: (r) => <span className="font-black text-black">{r.kelompok}</span>,
            },
            {
                id: 'muhafidz',
                header: 'Muhafidz',
                cell: (r) => <span className="font-bold text-black">{r.muhafidz ?? '-'}</span>,
            },
            {
                id: 'jumlah_santri',
                header: 'Jml Santri',
                headerClassName: 'text-right',
                className: 'text-right font-bold',
                cell: (r) => r.jumlah_santri,
            },
            {
                id: 'terisi',
                header: 'Terisi',
                headerClassName: 'text-right',
                className: 'text-right font-bold',
                cell: (r) => r.terisi,
            },
            {
                id: 'rata_kumulatif',
                header: 'Rata Kumulatif',
                headerClassName: 'text-right',
                className: 'text-right font-bold',
                cell: (r) => r.rata_halaman_kumulatif ?? '-',
            },
            {
                id: 'rata_juz',
                header: 'Rata Tambah Juz',
                headerClassName: 'text-right',
                className: 'text-right font-bold',
                cell: (r) => r.rata_tambah_juz ?? '-',
            },
            {
                id: 'rata_tasmi',
                header: "Rata Tasmi'",
                headerClassName: 'text-right',
                className: 'text-right font-bold',
                cell: (r) => r.rata_tasmi ?? '-',
            },
            {
                id: 'rata_ujian',
                header: 'Rata Ujian',
                headerClassName: 'text-right',
                className: 'text-right font-bold',
                cell: (r) => r.rata_ujian ?? '-',
            },
            {
                id: 'berprestasi',
                header: 'Berprestasi',
                headerClassName: 'text-right',
                className: 'text-right font-black',
                cell: (r) => r.berprestasi,
            },
        ],
        [],
    );

    const distribusiColumns = useMemo<DataTableColumn<DistribusiRow>[]>(
        () => [
            {
                id: 'kategori',
                header: 'Kategori',
                cell: (r) => <span className="font-black text-black">{r.kategori}</span>,
            },
            {
                id: 'ikhwan',
                header: 'Ikhwan',
                headerClassName: 'text-right',
                className: 'text-right font-bold',
                cell: (r) => r.ikhwan,
            },
            {
                id: 'akhwat',
                header: 'Akhwat',
                headerClassName: 'text-right',
                className: 'text-right font-bold',
                cell: (r) => r.akhwat,
            },
            {
                id: 'total',
                header: 'Total',
                headerClassName: 'text-right',
                className: 'text-right font-black',
                cell: (r) => r.total,
            },
        ],
        [],
    );

    return (
        <PageContainer>
            <Heading
                title="Dashboard Mutabaah Bulanan"
                description={`Ringkasan mutabaah bulanan santri tahun ${tahun}.`}
            />

            <Card className="overflow-hidden bg-[#FFE7A3]">
                <CardHeader className="bg-primary">
                    <CardTitle className="font-head font-black uppercase">Ringkasan per Kelompok</CardTitle>
                    <CardDescription className="font-bold text-black">
                        Pilih bulan untuk melihat data mutabaah bulanan — paginasi otomatis jika &gt;10 kelompok.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 bg-[#FFF7E8] pt-6">
                    <Select
                        value={selectedBulan}
                        onValueChange={(value) => {
                            setSelectedBulan(value);
                            router.get(index(), { bulan: value }, { preserveState: true, replace: true });
                        }}
                    >
                        <SelectTrigger className="w-[200px] border-[3px] border-black font-bold">
                            <SelectValue placeholder="Pilih bulan" />
                        </SelectTrigger>
                        <SelectContent>
                            {bulanNames.map((nama, i) => (
                                <SelectItem key={i + 1} value={String(i + 1)}>
                                    {nama}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <DataTable
                        columns={ringkasanColumns}
                        data={rows}
                        perPage={5}
                        emptyMessage="Belum ada data kelompok untuk bulan ini."
                    />
                </CardContent>
            </Card>

            <Card className="overflow-hidden bg-[#5CE1E6]">
                <CardHeader className="bg-black text-[#FFF7E8]">
                    <CardTitle className="font-head font-black uppercase">Distribusi Kategori Juz</CardTitle>
                    <CardDescription className="font-bold text-[#FFF7E8]/80">
                        Jumlah santri per kategori hafalan, dibedakan ikhwan dan akhwat.
                    </CardDescription>
                </CardHeader>
                <CardContent className="bg-[#FFF7E8] pt-6">
                    <DataTable
                        columns={distribusiColumns}
                        data={distribusi}
                        perPage={5}
                        emptyMessage="Belum ada data distribusi."
                    />
                </CardContent>
            </Card>
        </PageContainer>
    );
}

AdminMutabaahBulananDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Mutabaah Bulanan',
            href: index(),
        },
    ],
};
