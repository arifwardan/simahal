import { Form, router } from '@inertiajs/react';
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
import { show as santrisShow } from '@/routes/ustadz/halaqahs/santris';

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
                            min={row.halaman_awal_bulan ?? 0}
                            value={halamanKumulatif}
                            onChange={(e) => setHalamanKumulatif(e.target.value)}
                        />
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
