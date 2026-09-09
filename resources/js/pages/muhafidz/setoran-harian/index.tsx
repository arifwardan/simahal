import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { BookOpen, CalendarDays, Plus, Save, Search, Trash2 } from 'lucide-react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import PageContainer from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { index as halaqahIndex } from '@/routes/muhafidz/halaqahs';
import { index as setoranHarianIndex, store as setoranHarianStore } from '@/routes/muhafidz/setoran-harian';

type Santri = { id: number; nama: string; nis?: string | null };
type Surah = { id: number; nomor: number; nama_latin: string; nama_arab: string; jumlah_ayat: number; juz: number };
type DetailRow = { surah_id: number | null; baris: string };
type PageProps = {
    santris: Santri[];
    santriId: number | null;
    tanggal: string;
    details: { surah_id: number; baris: number }[];
    totalBaris: number;
    surahs: Surah[];
    targetHarian: number;
    errors?: Record<string, string>;
};

function surahLabel(s: Surah): string {
    return `${s.nomor}. ${s.nama_latin} (${s.nama_arab})`;
}

export default function SetoranHarianIndex({ santris, santriId, tanggal, details, surahs, targetHarian, errors = {} }: PageProps) {
    const today = new Date().toISOString().split('T')[0];
    const activeSantri = santris.find((s) => s.id === santriId) ?? null;

    const [santriValue, setSantriValue] = useState<string>(santriId?.toString() ?? '');
    const [tanggalValue, setTanggalValue] = useState<string>(tanggal);
    const [rows, setRows] = useState<DetailRow[]>(
        details.length > 0 ? details.map((d) => ({ surah_id: d.surah_id, baris: String(d.baris) })) : [{ surah_id: null, baris: '' }],
    );
    const [search, setSearch] = useState('');
    const [processing, setProcessing] = useState(false);

    const filteredSurahs = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) {
            return surahs;
        }
        return surahs.filter((s) => s.nama_latin.toLowerCase().includes(q) || String(s.nomor) === q);
    }, [surahs, search]);

    const liveTotal = useMemo(() => rows.reduce((acc, r) => acc + (parseInt(r.baris) || 0), 0), [rows]);
    const filledCount = useMemo(() => rows.filter((r) => r.surah_id !== null).length, [rows]);
    const hasExisting = details.length > 0;

    function navigate(url: string) {
        router.get(url, {}, { preserveState: false, replace: true });
    }

    function handleSantriChange(value: string) {
        if (isRowsDirty() && !window.confirm('Pindah santri? Perubahan yang belum disimpan akan hilang.')) {
            return;
        }
        setSantriValue(value);
        navigate(setoranHarianIndex.url({ query: { santri_id: value, tanggal: tanggalValue } }));
    }

    function handleTanggalChange(value: string) {
        if (isRowsDirty() && !window.confirm('Pindah tanggal? Perubahan yang belum disimpan akan hilang.')) {
            return;
        }
        setTanggalValue(value);
        if (santriValue) {
            navigate(setoranHarianIndex.url({ query: { santri_id: santriValue, tanggal: value } }));
        }
    }

    function isRowsDirty(): boolean {
        const initial = details.length > 0 ? details.map((d) => ({ surah_id: d.surah_id, baris: String(d.baris) })) : [{ surah_id: null, baris: '' }];
        return JSON.stringify(rows) !== JSON.stringify(initial);
    }

    function updateRow(idx: number, patch: Partial<DetailRow>) {
        setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
    }

    function removeRow(idx: number) {
        setRows((prev) => (prev.length <= 1 ? [{ surah_id: null, baris: '' }] : prev.filter((_, i) => i !== idx)));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const payload = rows
            .filter((r) => r.surah_id !== null)
            .map((r) => ({ surah_id: r.surah_id as number, baris: Math.min(30, Math.max(1, parseInt(r.baris) || 1)) }));
        const santriName = santris.find((s) => s.id.toString() === santriValue)?.nama ?? 'Santri';
        const tanggalId = new Date(`${tanggalValue}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        const totalBaris = payload.reduce((acc, r) => acc + r.baris, 0);
        const successMessage = `Setoran ${santriName} ${tanggalId} disimpan: ${totalBaris} baris, ${payload.length} surah`;
        setProcessing(true);
        router.post(
            setoranHarianStore.url(),
            { santri_id: santriValue ? parseInt(santriValue) : null, tanggal: tanggalValue, details: payload },
            { onSuccess: () => toast.success(successMessage), onFinish: () => setProcessing(false) },
        );
    }

    function handleDeleteDay() {
        if (!window.confirm(`Hapus seluruh setoran ${activeSantri?.nama ?? ''} pada ${new Date(tanggalValue).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}?`)) {
            return;
        }
        setProcessing(true);
        router.post(
            setoranHarianStore.url(),
            { santri_id: santriValue ? parseInt(santriValue) : null, tanggal: tanggalValue, details: [] },
            { onFinish: () => setProcessing(false) },
        );
    }

    return (
        <PageContainer className="space-y-4 pb-28">
            <Heading
                title="Setoran Harian"
                description={`${activeSantri?.nama ?? 'Pilih santri'} · ${new Date(tanggalValue).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
            />

            {/* Hero: santri + tanggal */}
            <Card className="overflow-hidden border-[3px] border-black bg-[#FFD600] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <CardContent className="flex flex-col gap-3 bg-[#FFF7E8] p-4 sm:flex-row sm:items-end">
                    <div className="flex-1 space-y-1">
                        <Label htmlFor="santri">Santri</Label>
                        <Select value={santriValue} onValueChange={handleSantriChange}>
                            <SelectTrigger id="santri" className="cursor-pointer border-[3px] border-black bg-white font-black">
                                <SelectValue placeholder="Pilih santri..." />
                            </SelectTrigger>
                            <SelectContent>
                                {santris.map((s) => (
                                    <SelectItem key={s.id} value={s.id.toString()} className="cursor-pointer font-bold">
                                        {s.nama}{s.nis ? ` · ${s.nis}` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="tanggal">Tanggal</Label>
                        <Input
                            id="tanggal"
                            type="date"
                            max={today}
                            value={tanggalValue}
                            onChange={(e) => handleTanggalChange(e.target.value)}
                            className="cursor-pointer border-[3px] border-black bg-white font-black"
                        />
                    </div>
                </CardContent>
            </Card>

            {(errors.santri_id || errors.tanggal) && (
                <div className="border-[3px] border-black bg-[#FF3B30] p-3 text-sm font-black text-white">
                    {errors.santri_id && <InputError message={errors.santri_id} />}
                    {errors.tanggal && <InputError message={errors.tanggal} className="text-white" />}
                </div>
            )}

            {/* Surah rows */}
            <Card className="overflow-hidden border-[3px] border-black bg-[#FFF7E8] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <CardHeader className="flex-row items-center gap-2 bg-[#FFD600] py-3">
                    <BookOpen className="h-4 w-4" />
                    <CardTitle className="text-sm font-black uppercase">Surah Hari Ini ({filledCount} surah)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                    <div className="relative">
                        <Label htmlFor="cari-surah" className="sr-only">Cari surah</Label>
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input
                            id="cari-surah"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari surah (nama / nomor)..."
                            className="border-2 border-black bg-white pl-9"
                        />
                    </div>

                    {rows.map((row, idx) => (
                        <div key={idx} className="flex flex-col gap-2 border-[3px] border-black bg-white p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sm:flex-row sm:items-end">
                            <div className="flex-1 space-y-1">
                                <Label htmlFor={`surah-${idx}`}>Surah {idx + 1}</Label>
                                <Select
                                    value={row.surah_id?.toString() ?? ''}
                                    onValueChange={(v) => updateRow(idx, { surah_id: v ? parseInt(v) : null })}
                                >
                                    <SelectTrigger id={`surah-${idx}`} className="cursor-pointer border-2 border-black bg-white font-bold">
                                        <SelectValue placeholder="Pilih surah..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredSurahs.map((s) => (
                                            <SelectItem key={s.id} value={s.id.toString()} className="cursor-pointer font-bold">
                                                {surahLabel(s)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors[`details.${idx}.surah_id`]} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor={`baris-${idx}`}>Baris (1–30)</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id={`baris-${idx}`}
                                        type="number"
                                        inputMode="numeric"
                                        min={1}
                                        max={30}
                                        value={row.baris}
                                        onChange={(e) => updateRow(idx, { baris: e.target.value })}
                                        placeholder="3"
                                        className="h-10 w-24 border-2 border-black bg-white text-center font-black"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeRow(idx)}
                                        aria-label={`Hapus baris ${idx + 1}`}
                                        className="cursor-pointer border-2 border-black bg-[#FF3B30] text-white hover:bg-[#d92d24]"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <InputError message={errors[`details.${idx}.baris`]} />
                            </div>
                        </div>
                    ))}

                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setRows((prev) => [...prev, { surah_id: null, baris: '' }])}
                        className="w-full cursor-pointer border-[3px] border-dashed border-black bg-white font-black hover:bg-[#FFD600]/30"
                    >
                        <Plus className="h-4 w-4" /> Tambah Surah
                    </Button>

                    {hasExisting && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleDeleteDay}
                            disabled={processing}
                            className="w-full cursor-pointer border-2 border-black bg-white font-black text-[#FF3B30] hover:bg-[#FF3B30] hover:text-white"
                        >
                            <Trash2 className="h-4 w-4" /> Hapus setoran hari ini
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Sticky footer */}
            <div className="fixed inset-x-0 bottom-0 z-10 border-t-[3px] border-black bg-black p-3">
                <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
                    <div className="text-[#FFF7E8]">
                        <p className="font-head text-xl leading-none font-black">{liveTotal} baris</p>
                        <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-[#FFF7E8]/70">
                            <CalendarDays className="h-3 w-3" /> Target {targetHarian} baris/hari · {filledCount} surah
                        </p>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <Button
                            type="submit"
                            disabled={processing || !santriValue}
                            className="cursor-pointer border-[3px] border-white bg-[#FFD600] font-black text-black shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:bg-[#FFEB3B] disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" /> {processing ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </form>
                </div>
            </div>
        </PageContainer>
    );
}

SetoranHarianIndex.layout = { breadcrumbs: [{ title: 'Halaqah Saya', href: halaqahIndex() }, { title: 'Setoran Harian', href: setoranHarianIndex() }] };
