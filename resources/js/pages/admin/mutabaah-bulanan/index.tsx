import { router } from '@inertiajs/react';
import Heading from '@/components/heading';
import PageContainer from '@/components/page-container';
import { index } from '@/routes/admin/mutabaah-bulanan';
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
import { useState } from 'react';

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

    return (
        <PageContainer>
            <Heading
                title="Dashboard Mutabaah Bulanan"
                description={`Ringkasan mutabaah bulanan santri tahun ${tahun}.`}
            />

            <Card>
                <CardHeader>
                    <CardTitle>Ringkasan per Kelompok</CardTitle>
                    <CardDescription>
                        Pilih bulan untuk melihat data mutabaah bulanan.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Select
                        value={selectedBulan}
                        onValueChange={(value) => {
                            setSelectedBulan(value);
                            router.get(
                                index(),
                                { bulan: value },
                                { preserveState: true, replace: true },
                            );
                        }}
                    >
                        <SelectTrigger className="w-[200px]">
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

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-muted-foreground">
                                    <th className="py-2 pr-4">Jenis</th>
                                    <th className="py-2 pr-4">Kelompok</th>
                                    <th className="py-2 pr-4">Muhafidz</th>
                                    <th className="py-2 pr-4 text-right">Jml Santri</th>
                                    <th className="py-2 pr-4 text-right">Terisi</th>
                                    <th className="py-2 pr-4 text-right">Rata Kumulatif</th>
                                    <th className="py-2 pr-4 text-right">Rata Tambah Juz</th>
                                    <th className="py-2 pr-4 text-right">Rata Tasmi'</th>
                                    <th className="py-2 pr-4 text-right">Rata Ujian</th>
                                    <th className="py-2 text-right">Berprestasi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row) => (
                                    <tr key={row.kelompok} className="border-b last:border-0">
                                        <td className="py-2 pr-4">{row.jenis}</td>
                                        <td className="py-2 pr-4 font-medium">{row.kelompok}</td>
                                        <td className="py-2 pr-4">{row.muhafidz ?? '-'}</td>
                                        <td className="py-2 pr-4 text-right">{row.jumlah_santri}</td>
                                        <td className="py-2 pr-4 text-right">{row.terisi}</td>
                                        <td className="py-2 pr-4 text-right">
                                            {row.rata_halaman_kumulatif ?? '-'}
                                        </td>
                                        <td className="py-2 pr-4 text-right">
                                            {row.rata_tambah_juz ?? '-'}
                                        </td>
                                        <td className="py-2 pr-4 text-right">
                                            {row.rata_tasmi ?? '-'}
                                        </td>
                                        <td className="py-2 pr-4 text-right">
                                            {row.rata_ujian ?? '-'}
                                        </td>
                                        <td className="py-2 text-right">{row.berprestasi}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Distribusi Kategori Juz</CardTitle>
                    <CardDescription>
                        Jumlah santri per kategori hafalan, dibedakan ikhwan dan akhwat.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-muted-foreground">
                                    <th className="py-2 pr-4">Kategori</th>
                                    <th className="py-2 pr-4 text-right">Ikhwan</th>
                                    <th className="py-2 pr-4 text-right">Akhwat</th>
                                    <th className="py-2 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {distribusi.map((row) => (
                                    <tr key={row.kategori} className="border-b last:border-0">
                                        <td className="py-2 pr-4">{row.kategori}</td>
                                        <td className="py-2 pr-4 text-right">{row.ikhwan}</td>
                                        <td className="py-2 pr-4 text-right">{row.akhwat}</td>
                                        <td className="py-2 text-right">{row.total}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
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
