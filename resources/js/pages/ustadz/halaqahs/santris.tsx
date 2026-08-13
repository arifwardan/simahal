import { Form } from '@inertiajs/react';
import { useState } from 'react';
import MutabaahBulananController from '@/actions/App/Http/Controllers/Ustadz/MutabaahBulananController';
import MutabaahForm from '@/components/forms/MutabaahForm';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import PageContainer from '@/components/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { keterangan, tambahHalaman, tambahJuz } from '@/lib/mutabaah-bulanan';
import { index as halaqahIndex } from '@/routes/ustadz/halaqahs';

type SantriRow = {
    id: number;
    nama: string;
    nis?: string | null;
    mutabaah_hari_ini?: {
        id: number;
        tanggal: string;
        jenis: string;
        surah: string;
        ayat_mulai: number;
        ayat_selesai: number;
        status: string;
    } | null;
};

type Option = { value: string; label: string };

type Settings = {
    konversi_juz_halaman: number;
    ambang_hadiah_juz: number;
    tahun_aktif: number;
};

type BulananRow = {
    santri_id: number;
    nama: string;
    halaman_awal_bulan: number | null;
    prefill_kumulatif: number | null;
    existing: {
        halaman_kumulatif: number | null;
        juz_dihafal: number | null;
        tasmi_pekan_1: number | null;
        tasmi_pekan_2: number | null;
        tasmi_pekan_3: number | null;
        tasmi_pekan_4: number | null;
        tasmi_pekan_5: number | null;
        ujian_soal_1: number | null;
        ujian_soal_2: number | null;
        ujian_soal_3: number | null;
        ujian_soal_4: number | null;
        ujian_soal_5: number | null;
    } | null;
};

type BatchRow = {
    santri_id: number;
    nama: string;
    halaman_awal_bulan: number | null;
    halaman_kumulatif: number | string;
    juz_dihafal: string;
    tasmi_pekan_1: number | string;
    tasmi_pekan_2: number | string;
    tasmi_pekan_3: number | string;
    tasmi_pekan_4: number | string;
    tasmi_pekan_5: number | string;
    ujian_soal_1: number | string;
    ujian_soal_2: number | string;
    ujian_soal_3: number | string;
    ujian_soal_4: number | string;
    ujian_soal_5: number | string;
};

type Halaqah = { id: number; nama: string };

type PageProps = {
    halaqah: Halaqah;
    santris: { data: SantriRow[]; total: number };
    jenisOptions: Option[];
    statusOptions: Option[];
    settings: Settings;
    bulan: number;
    tahun: number;
    bulanan: BulananRow[];
};

const NAMA_BULAN = [
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

const TASMI_KEYS = [
    'tasmi_pekan_1',
    'tasmi_pekan_2',
    'tasmi_pekan_3',
    'tasmi_pekan_4',
    'tasmi_pekan_5',
] as const;

const UJIAN_KEYS = [
    'ujian_soal_1',
    'ujian_soal_2',
    'ujian_soal_3',
    'ujian_soal_4',
    'ujian_soal_5',
] as const;

function buildRows(bulanan: BulananRow[]): BatchRow[] {
    return bulanan.map((b) => ({
        santri_id: b.santri_id,
        nama: b.nama,
        halaman_awal_bulan: b.halaman_awal_bulan,
        halaman_kumulatif:
            b.existing?.halaman_kumulatif ?? b.prefill_kumulatif ?? '',
        juz_dihafal:
            b.existing?.juz_dihafal != null
                ? String(b.existing.juz_dihafal)
                : '',
        tasmi_pekan_1: b.existing?.tasmi_pekan_1 ?? '',
        tasmi_pekan_2: b.existing?.tasmi_pekan_2 ?? '',
        tasmi_pekan_3: b.existing?.tasmi_pekan_3 ?? '',
        tasmi_pekan_4: b.existing?.tasmi_pekan_4 ?? '',
        tasmi_pekan_5: b.existing?.tasmi_pekan_5 ?? '',
        ujian_soal_1: b.existing?.ujian_soal_1 ?? '',
        ujian_soal_2: b.existing?.ujian_soal_2 ?? '',
        ujian_soal_3: b.existing?.ujian_soal_3 ?? '',
        ujian_soal_4: b.existing?.ujian_soal_4 ?? '',
        ujian_soal_5: b.existing?.ujian_soal_5 ?? '',
    }));
}

function toNumber(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const parsed = Number(value);

    return Number.isNaN(parsed) ? null : parsed;
}

function RekapBulananDialog({
    halaqahNama,
    bulan,
    settings,
    bulanan,
    onClose,
}: {
    halaqahNama: string;
    bulan: number;
    settings: Settings;
    bulanan: BulananRow[];
    onClose: () => void;
}) {
    const [rekapBulan, setRekapBulan] = useState(bulan);
    const [rows, setRows] = useState<BatchRow[]>(() => buildRows(bulanan));

    function updateRow(
        i: number,
        field: keyof BatchRow,
        value: number | string,
    ): void {
        setRows((prev) =>
            prev.map((row, idx) =>
                idx === i ? { ...row, [field]: value } : row,
            ),
        );
    }

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-5xl">
                <DialogHeader>
                    <DialogTitle>Rekap Bulanan</DialogTitle>
                    <DialogDescription>
                        Input mutabaah bulanan untuk semua santri dalam halaqah{' '}
                        {halaqahNama}.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...MutabaahBulananController.update.form({
                        bulan: rekapBulan,
                    })}
                    onSuccess={onClose}
                >
                    {({ errors, processing }) => (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Label className="shrink-0">Bulan</Label>
                                <Select
                                    value={String(rekapBulan)}
                                    onValueChange={(value) =>
                                        setRekapBulan(Number(value))
                                    }
                                >
                                    <SelectTrigger className="w-44">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {NAMA_BULAN.map((label, i) => (
                                            <SelectItem
                                                key={label}
                                                value={String(i + 1)}
                                            >
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="max-h-[calc(100%-2rem)] overflow-auto rounded-lg border">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="sticky top-0 bg-muted/50 py-2 pr-4">
                                                Santri
                                            </th>
                                            <th className="py-2 pr-4">
                                                Halaman Awal
                                            </th>
                                            <th className="py-2 pr-4">
                                                Halaman Kumulatif
                                            </th>
                                            <th className="py-2 pr-4">
                                                Juz Dihafal
                                            </th>
                                            <th className="py-2 pr-4">
                                                Tasmi (Pekan 1-5)
                                            </th>
                                            <th className="py-2 pr-4">
                                                Ujian (Soal 1-5)
                                            </th>
                                            <th className="py-2">Preview</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row, i) => {
                                            const kumulatif = toNumber(
                                                row.halaman_kumulatif,
                                            );

                                            return (
                                                <tr
                                                    key={row.santri_id}
                                                    className="border-b align-top last:border-0"
                                                >
                                                    <td className="py-2 pr-4 font-medium">
                                                        {row.nama}
                                                    </td>
                                                    <td className="py-2 pr-4">
                                                        {row.halaman_awal_bulan ??
                                                            '—'}
                                                    </td>
                                                    <td className="py-2 pr-4">
                                                        <input
                                                            type="hidden"
                                                            name={`records[${i}][santri_id]`}
                                                            value={
                                                                row.santri_id
                                                            }
                                                        />
                                                        <Input
                                                            type="number"
                                                            name={`records[${i}][halaman_kumulatif]`}
                                                            min={
                                                                row.halaman_awal_bulan ??
                                                                0
                                                            }
                                                            value={
                                                                row.halaman_kumulatif
                                                            }
                                                            onChange={(e) =>
                                                                updateRow(
                                                                    i,
                                                                    'halaman_kumulatif',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                    </td>
                                                    <td className="py-2 pr-4">
                                                        <Input
                                                            type="text"
                                                            name={`records[${i}][juz_dihafal]`}
                                                            value={
                                                                row.juz_dihafal
                                                            }
                                                            onChange={(e) =>
                                                                updateRow(
                                                                    i,
                                                                    'juz_dihafal',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                    </td>
                                                    <td className="py-2 pr-4">
                                                        <div className="grid grid-cols-5 gap-1">
                                                            {TASMI_KEYS.map(
                                                                (key) => (
                                                                    <Input
                                                                        key={
                                                                            key
                                                                        }
                                                                        type="number"
                                                                        name={`records[${i}][${key}]`}
                                                                        min={10}
                                                                        max={
                                                                            100
                                                                        }
                                                                        value={
                                                                            row[
                                                                                key
                                                                            ]
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateRow(
                                                                                i,
                                                                                key,
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                    />
                                                                ),
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-2 pr-4">
                                                        <div className="grid grid-cols-5 gap-1">
                                                            {UJIAN_KEYS.map(
                                                                (key) => (
                                                                    <Input
                                                                        key={
                                                                            key
                                                                        }
                                                                        type="number"
                                                                        name={`records[${i}][${key}]`}
                                                                        min={10}
                                                                        max={
                                                                            100
                                                                        }
                                                                        value={
                                                                            row[
                                                                                key
                                                                            ]
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateRow(
                                                                                i,
                                                                                key,
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                    />
                                                                ),
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-2">
                                                        <div className="space-y-0.5 text-xs text-muted-foreground">
                                                            <p>
                                                                +
                                                                {tambahHalaman(
                                                                    kumulatif,
                                                                    row.halaman_awal_bulan,
                                                                )}{' '}
                                                                hal
                                                            </p>
                                                            <p>
                                                                +
                                                                {tambahJuz(
                                                                    kumulatif,
                                                                    row.halaman_awal_bulan,
                                                                    settings.konversi_juz_halaman,
                                                                )}{' '}
                                                                juz
                                                            </p>
                                                            <p className="font-medium text-foreground">
                                                                {keterangan(
                                                                    kumulatif,
                                                                    row.halaman_awal_bulan,
                                                                    settings,
                                                                )}
                                                            </p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <InputError message={errors.records} />

                            <div className="flex justify-end">
                                <Button type="submit" disabled={processing}>
                                    {processing
                                        ? 'Menyimpan...'
                                        : 'Simpan Rekap Bulanan'}
                                </Button>
                            </div>
                        </div>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default function UstadzHalaqahSantris({
    halaqah,
    santris,
    jenisOptions,
    statusOptions,
    settings,
    bulan,
    bulanan,
}: PageProps) {
    const [catatSantri, setCatatSantri] = useState<SantriRow | null>(null);
    const [showRekap, setShowRekap] = useState(false);
    const [highlightId, setHighlightId] = useState<number | null>(null);
    const [processingSantri, setProcessingSantri] = useState<number | null>(null);

    return (
        <PageContainer>
            <Heading
                title={halaqah.nama}
                description="Daftar santri dalam halaqah ini."
            />

            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <CardTitle>Santri ({santris.total})</CardTitle>
                    <Button
                        variant="outline"
                        onClick={() => setShowRekap(true)}
                    >
                        Rekap Bulanan
                    </Button>
                </CardHeader>
                <CardContent>
                    <ul className="divide-y rounded-lg border">
                        {santris.data.map((santri) => {
                            const recorded = santri.mutabaah_hari_ini;
                            const isHighlighted = highlightId === santri.id;

                            return (
                                <li
                                    key={santri.id}
                                    className={`flex items-center justify-between gap-4 p-4 transition-colors ${
                                        isHighlighted ? 'bg-emerald-50 ring-1 ring-emerald-300 dark:bg-emerald-500/10 dark:ring-emerald-500/40' : ''
                                    }`}
                                >
                                    <div>
                                        <p className="font-medium">{santri.nama}</p>
                                        {santri.nis && (
                                            <p className="text-sm text-muted-foreground">
                                                {santri.nis}
                                            </p>
                                        )}
                                        {recorded && (
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {recorded.jenis} · {recorded.surah} {recorded.ayat_mulai}-{recorded.ayat_selesai}
                                            </p>
                                        )}
                                    </div>
                                    {recorded ? (
                                        <Badge variant="secondary" className="shrink-0">
                                            Sudah dicatat ✓
                                        </Badge>
                                    ) : (
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                setProcessingSantri(santri.id);
                                                setCatatSantri(santri);
                                            }}
                                            disabled={processingSantri !== null}
                                        >
                                            Catat
                                        </Button>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </CardContent>
            </Card>

            <Dialog
                open={catatSantri !== null}
                onOpenChange={(open) => !open && setCatatSantri(null)}
            >
                <DialogContent key={catatSantri?.id}>
                    <DialogHeader>
                        <DialogTitle>Catat Mutabaah</DialogTitle>
                        <DialogDescription>
                            {catatSantri
                                ? `${catatSantri.nama}${catatSantri.nis ? ` (${catatSantri.nis})` : ''}`
                                : ''}
                        </DialogDescription>
                    </DialogHeader>
                    {catatSantri && (
                        <MutabaahForm
                            santri={catatSantri}
                            jenisOptions={jenisOptions}
                            statusOptions={statusOptions}
                            onSuccess={() => {
                                setProcessingSantri(null);
                                setCatatSantri(null);
                                const next = santris.data.find(
                                    (s) =>
                                        s.id !== catatSantri?.id &&
                                        !s.mutabaah_hari_ini,
                                );
                                setHighlightId(next?.id ?? null);
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {showRekap && (
                <RekapBulananDialog
                    halaqahNama={halaqah.nama}
                    bulan={bulan}
                    settings={settings}
                    bulanan={bulanan}
                    onClose={() => setShowRekap(false)}
                />
            )}
        </PageContainer>
    );
}

UstadzHalaqahSantris.layout = {
    breadcrumbs: [
        {
            title: 'Halaqah Saya',
            href: halaqahIndex(),
        },
    ],
};
