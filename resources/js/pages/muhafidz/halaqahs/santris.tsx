import { Form, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import MutabaahBulananController from '@/actions/App/Http/Controllers/Muhafidz/MutabaahBulananController';
import MutabaahForm from '@/components/forms/MutabaahForm';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import PageContainer from '@/components/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
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
import { index as halaqahIndex } from '@/routes/muhafidz/halaqahs';
import { show as santrisShow } from '@/routes/muhafidz/halaqahs/santris';
import { index as setoranIndex } from '@/routes/muhafidz/setoran';

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

type Halaqah = { id: number; nama: string };

type PageProps = {
    halaqah: Halaqah;
    santris: { data: SantriRow[]; total: number; current_page: number; last_page: number; links: { url: string | null; label: string; active: boolean }[] };
    jenisOptions: Option[];
    statusOptions: Option[];
    settings: Settings;
    bulan: number;
    tahun: number;
    bulanan: BulananRow[];
    availableSantris: { id: number; nama: string; nis: string | null }[];
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

function toNumber(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const parsed = Number(value);

    return Number.isNaN(parsed) ? null : parsed;
}

function RekapSantriForm({
    row,
    bulan,
    settings,
    onBack,
    onSuccess,
}: {
    row: BulananRow;
    bulan: number;
    settings: Settings;
    onBack: () => void;
    onSuccess: () => void;
}) {
    const [halamanKumulatif, setHalamanKumulatif] = useState<string | number>(
        row.existing?.halaman_kumulatif ?? row.prefill_kumulatif ?? '',
    );

    const initial = {
        juz_dihafal: row.existing?.juz_dihafal ?? '',
        tasmi_pekan_1: row.existing?.tasmi_pekan_1 ?? '',
        tasmi_pekan_2: row.existing?.tasmi_pekan_2 ?? '',
        tasmi_pekan_3: row.existing?.tasmi_pekan_3 ?? '',
        tasmi_pekan_4: row.existing?.tasmi_pekan_4 ?? '',
        tasmi_pekan_5: row.existing?.tasmi_pekan_5 ?? '',
        ujian_soal_1: row.existing?.ujian_soal_1 ?? '',
        ujian_soal_2: row.existing?.ujian_soal_2 ?? '',
        ujian_soal_3: row.existing?.ujian_soal_3 ?? '',
        ujian_soal_4: row.existing?.ujian_soal_4 ?? '',
        ujian_soal_5: row.existing?.ujian_soal_5 ?? '',
    };

    const kumulatif = toNumber(halamanKumulatif);

    return (
        <Form
            {...MutabaahBulananController.update.form({ bulan })}
            onSuccess={onSuccess}
        >
            {({ errors, processing }) => (
                <div className="space-y-4">
                    <input type="hidden" name="santri_id" value={row.santri_id} />

                    <div className="grid gap-2">
                        <Label>Halaman Kumulatif</Label>
                        <Input
                            type="number"
                            name="halaman_kumulatif"
                            min={0}
                            value={halamanKumulatif}
                            onChange={(e) => setHalamanKumulatif(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Bebas diisi sesuai kemampuan santri (tidak wajib ≥ halaman awal {row.halaman_awal_bulan ?? 0}).
                        </p>
                        <InputError message={errors.halaman_kumulatif} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Juz Dihafal</Label>
                        <Input
                            type="text"
                            name="juz_dihafal"
                            defaultValue={initial.juz_dihafal}
                        />
                        <InputError message={errors.juz_dihafal} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Tasmi (Pekan 1-5)</Label>
                        <div className="grid grid-cols-5 gap-1">
                            {TASMI_KEYS.map((key) => (
                                <Input
                                    key={key}
                                    type="number"
                                    min={10}
                                    max={100}
                                    name={key}
                                    defaultValue={initial[key]}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Ujian (Soal 1-5)</Label>
                        <div className="grid grid-cols-5 gap-1">
                            {UJIAN_KEYS.map((key) => (
                                <Input
                                    key={key}
                                    type="number"
                                    min={10}
                                    max={100}
                                    name={key}
                                    defaultValue={initial[key]}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="space-y-0.5 rounded-lg border bg-muted/40 p-3 text-sm">
                        <p>
                            +{tambahHalaman(kumulatif, row.halaman_awal_bulan)}{' '}
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
                        <p className="font-medium">
                            {keterangan(kumulatif, row.halaman_awal_bulan, settings)}
                        </p>
                    </div>

                    <div className="flex justify-between">
                        <Button type="button" variant="outline" onClick={onBack}>
                            Kembali
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Simpan Rekap'}
                        </Button>
                    </div>
                </div>
            )}
        </Form>
    );
}

function RekapBulananDialog({
    halaqahNama,
    halaqahId,
    bulan,
    settings,
    bulanan,
    onClose,
}: {
    halaqahNama: string;
    halaqahId: number;
    bulan: number;
    settings: Settings;
    bulanan: BulananRow[];
    onClose: () => void;
}) {
    const [selected, setSelected] = useState<BulananRow | null>(null);

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>
                        {selected
                            ? `Rekap Bulanan — ${selected.nama}`
                            : 'Rekap Bulanan'}
                    </DialogTitle>
                    <DialogDescription>
                        {selected
                            ? `Input mutabaah bulanan untuk ${selected.nama} (halaqah ${halaqahNama}).`
                            : `Pilih santri untuk mengisi mutabaah bulanan halaqah ${halaqahNama}.`}
                    </DialogDescription>
                </DialogHeader>

                {selected ? (
                    <RekapSantriForm
                        key={selected.santri_id}
                        row={selected}
                        bulan={bulan}
                        settings={settings}
                        onBack={() => setSelected(null)}
                        onSuccess={() => setSelected(null)}
                    />
                ) : (
                    <>
                        <div className="flex items-center gap-2">
                            <Label className="shrink-0">Bulan</Label>
                            <Select
                                value={String(bulan)}
                                onValueChange={(value) => {
                                    const next = Number(value);

                                    if (next !== bulan) {
                                        router.get(
                                            santrisShow(
                                                { halaqah: halaqahId },
                                                { query: { bulan: next } },
                                            ),
                                            {},
                                            {
                                                preserveState: true,
                                                replace: true,
                                            },
                                        );
                                    }
                                }}
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

                        <ul className="max-h-[60vh] divide-y overflow-auto rounded-lg border">
                            {bulanan.map((row) => {
                                const kumulatif =
                                    row.existing?.halaman_kumulatif ?? null;
                                const terisi = row.existing !== null;

                                return (
                                    <li key={row.santri_id}>
                                        <button
                                            type="button"
                                            onClick={() => setSelected(row)}
                                            className="flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-muted/50"
                                        >
                                            <div>
                                                <p className="font-medium">
                                                    {row.nama}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {terisi
                                                        ? `Kumulatif ${row.existing?.halaman_kumulatif} hal · +${tambahHalaman(kumulatif, row.halaman_awal_bulan)} hal · +${tambahJuz(kumulatif, row.halaman_awal_bulan, settings.konversi_juz_halaman)} juz · ${keterangan(kumulatif, row.halaman_awal_bulan, settings)}`
                                                        : 'Belum diisi bulan ini'}
                                                </p>
                                            </div>
                                            {terisi ? (
                                                <Badge variant="secondary">
                                                    Sudah diisi ✓
                                                </Badge>
                                            ) : (
                                                <span className="text-sm font-medium text-primary">
                                                    Isi Rekap
                                                </span>
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

export default function MuhafidzHalaqahSantris({
    halaqah,
    santris,
    jenisOptions,
    statusOptions,
    settings,
    bulan,
    bulanan,
    availableSantris,
}: PageProps) {
    const [catatSantri, setCatatSantri] = useState<SantriRow | null>(null);
    const [showRekap, setShowRekap] = useState(false);
    const [showTambah, setShowTambah] = useState(false);
    const [selectedSantriId, setSelectedSantriId] = useState<string>('');
    const [highlightId, setHighlightId] = useState<number | null>(null);
    const [processingSantri, setProcessingSantri] = useState<number | null>(null);

    const columns = useMemo<DataTableColumn<SantriRow>[]>(
        () => [
            {
                id: 'santri',
                header: 'Santri',
                accessor: (r) => `${r.nama} ${r.nis ?? ''}`,
                cell: (row) => (
                    <div className={highlightId === row.id ? 'rounded bg-emerald-100 px-1' : ''}>
                        <p className="font-black text-black">{row.nama}</p>
                        {row.nis && <p className="text-xs font-bold text-black/60">{row.nis}</p>}
                    </div>
                ),
            },
            {
                id: 'mutabaah',
                header: 'Mutabaah Hari Ini',
                cell: (row) =>
                    row.mutabaah_hari_ini ? (
                        <span className="text-xs font-bold text-black/70">
                            {row.mutabaah_hari_ini.jenis} · {row.mutabaah_hari_ini.surah} {row.mutabaah_hari_ini.ayat_mulai}-{row.mutabaah_hari_ini.ayat_selesai}
                        </span>
                    ) : (
                        <span className="text-xs font-bold text-black/40">Belum dicatat</span>
                    ),
            },
            {
                id: 'aksi',
                header: 'Aksi',
                headerClassName: 'text-right',
                className: 'text-right',
                cell: (row) =>
                    row.mutabaah_hari_ini ? (
                        <Badge variant="secondary" className="shrink-0 border-2 border-black">
                            Sudah dicatat ✓
                        </Badge>
                    ) : (
                        <Link
                            href={setoranIndex.url(halaqah.id, { query: { santri_id: row.id } })}
                            className="inline-flex cursor-pointer items-center justify-center rounded-none border-[3px] border-black bg-primary px-3 py-1 text-xs font-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                        >
                            Input Setoran
                        </Link>
                    ),
            },
        ],
        [halaqah.id, highlightId],
    );

    return (
        <PageContainer>
            <Heading
                title={halaqah.nama}
                description="Daftar santri dalam halaqah ini."
            />

            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <CardTitle>Santri ({santris.total})</CardTitle>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowTambah(true)} className="cursor-pointer border-[3px] border-black bg-[#FFF7E8]">
                            Tambah Santri
                        </Button>
                        <Button variant="outline" onClick={() => setShowRekap(true)} className="cursor-pointer">
                            Rekap Bulanan
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={columns}
                        data={santris.data}
                        pagination={santris}
                        perPage={5}
                        searchPlaceholder="Cari santri / NIS..."
                        emptyMessage="Belum ada santri di halaqah ini."
                    />
                </CardContent>
            </Card>

            <Dialog
                open={catatSantri !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setCatatSantri(null);
                        setProcessingSantri(null);
                    }
                }}
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
                    halaqahId={halaqah.id}
                    bulan={bulan}
                    settings={settings}
                    bulanan={bulanan}
                    onClose={() => setShowRekap(false)}
                />
            )}

            <Dialog open={showTambah} onOpenChange={(o) => !o && setShowTambah(false)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tambah Santri ke Halaqah</DialogTitle>
                        <DialogDescription>Pilih santri yang belum ada di halaqah {halaqah.nama}.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Santri</Label>
                            <Select value={selectedSantriId} onValueChange={setSelectedSantriId}>
                                <SelectTrigger className="cursor-pointer border-[3px] border-black bg-[#FFF7E8]">
                                    <SelectValue placeholder="Pilih santri..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableSantris.length === 0 ? (
                                        <div className="p-2 text-sm text-muted-foreground">Semua santri sudah di halaqah</div>
                                    ) : (
                                        availableSantris.map((s) => (
                                            <SelectItem key={s.id} value={String(s.id)} className="cursor-pointer">
                                                {s.nama} {s.nis ? `· ${s.nis}` : ''}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowTambah(false)} className="cursor-pointer">
                                Batal
                            </Button>
                            <Button
                                disabled={!selectedSantriId}
                                onClick={() => {
                                    router.post(
                                        `/muhafidz/halaqah-saya/${halaqah.id}/santri`,
                                        { santri_id: Number(selectedSantriId) },
                                        {
                                            onSuccess: () => {
                                                setShowTambah(false);
                                                setSelectedSantriId('');
                                            },
                                        },
                                    );
                                }}
                                className="cursor-pointer border-[3px] border-black"
                            >
                                Tambahkan
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </PageContainer>
    );
}

MuhafidzHalaqahSantris.layout = {
    breadcrumbs: [
        {
            title: 'Halaqah Saya',
            href: halaqahIndex(),
        },
    ],
};
