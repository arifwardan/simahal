import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Award, Library, Save } from 'lucide-react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import PageContainer from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { index as halaqahIndex } from '@/routes/muhafidz/halaqahs';
import { index as ujianIndex, store as ujianStore } from '@/routes/muhafidz/ujian';

type Santri = { id: number; nama: string; nis?: string | null };
type PageProps = {
    santris: Santri[];
    santriId: number | null;
    tahun: number;
    bulan: number;
    totalBulanan: number;
    ujianSoal: (boolean | null)[];
    ujianTotal: number;
    catatanUjian: string | null;
    errors?: Record<string, string>;
};

const BULAN_LABELS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function UjianIndex({ santris, santriId, tahun, bulan, totalBulanan, ujianSoal: ujianSoalProp, catatanUjian, errors = {} }: PageProps) {
    const activeSantri = santris.find((s) => s.id === santriId) ?? null;
    const [soal, setSoal] = useState<(boolean | null)[]>(ujianSoalProp ?? [null, null, null, null, null]);
    const [catatan, setCatatan] = useState<string>(catatanUjian ?? '');
    const [processing, setProcessing] = useState(false);

    const liveTotal = useMemo(() => soal.filter((v) => v === true).length * 20, [soal]);

    function navigate(santri: string | number | null, t: number, b: number) {
        router.get(
            ujianIndex.url({ query: { santri_id: santri ?? undefined, tahun: t, bulan: b } }),
            {},
            { preserveState: false, replace: true },
        );
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setProcessing(true);
        router.post(
            ujianStore.url(),
            { santri_id: santriId, tahun, bulan, ujian_soal: soal, catatan_ujian: catatan || null },
            { onFinish: () => setProcessing(false) },
        );
    }

    return (
        <PageContainer className="space-y-4 pb-28">
            <Heading
                title="Ujian Bulanan"
                description={`${activeSantri?.nama ?? 'Pilih santri'} · ${BULAN_LABELS[bulan - 1]} ${tahun}`}
            />

            {/* Month + santri picker */}
            <Card className="overflow-hidden border-[3px] border-black dark:border-[#FFF7E8] bg-[#FF3B30] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                <CardContent className="flex flex-col gap-3 bg-[#FFF7E8] dark:bg-zinc-900 p-4 sm:flex-row sm:items-end">
                    <div className="flex-1 space-y-1">
                        <Label htmlFor="santri">Santri</Label>
                        <Select value={santriId?.toString() ?? ''} onValueChange={(v) => navigate(v, tahun, bulan)}>
                            <SelectTrigger id="santri" className="cursor-pointer border-[3px] border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 font-black">
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
                        <Label htmlFor="bulan">Bulan</Label>
                        <Input
                            id="bulan"
                            type="month"
                            value={`${tahun}-${String(bulan).padStart(2, '0')}`}
                            onChange={(e) => {
                                if (!e.target.value) {
                                    return;
                                }
                                const [y, m] = e.target.value.split('-').map(Number);
                                navigate(santriId, y, m);
                            }}
                            className="cursor-pointer border-[3px] border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 font-black"
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
                {/* Total bulanan read-only */}
                <Card className="overflow-hidden border-[3px] border-black dark:border-[#FFF7E8] bg-[#FFF7E8] dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                    <CardHeader className="flex-row items-center gap-2 bg-[#22c55e] py-3 text-white">
                        <Library className="h-4 w-4" />
                        <CardTitle className="text-sm font-black uppercase text-white">Total Bulanan</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center py-6">
                        <div className="flex h-24 w-24 items-center justify-center rounded-none border-[3px] border-black dark:border-[#FFF7E8] bg-black text-4xl font-black text-[#FFF7E8] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
                            {totalBulanan}
                        </div>
                        <div className="mt-2 text-xs font-black uppercase text-black/60 dark:text-[#FFF7E8]/60">baris</div>
                        <p className="mt-3 text-center text-[10px] font-bold text-black/50 dark:text-[#FFF7E8]/50">Rekap total hafalan bulan ini</p>
                    </CardContent>
                </Card>

                {/* 5 soal */}
                <Card className="overflow-hidden border-[3px] border-black dark:border-[#FFF7E8] bg-[#FFF7E8] dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                    <CardHeader className="flex-row items-center gap-2 bg-[#FF3B30] py-3 text-white">
                        <Award className="h-4 w-4" />
                        <CardTitle className="text-sm font-black uppercase text-white">Soal Ujian (5 × 20)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-4">
                        {[0, 1, 2, 3, 4].map((i) => (
                            <label key={i} htmlFor={`soal-${i}`} className="flex cursor-pointer items-center gap-2 rounded-none border-2 border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 p-2">
                                <input
                                    id={`soal-${i}`}
                                    type="checkbox"
                                    checked={soal[i] === true}
                                    onChange={(e) => setSoal((prev) => prev.map((v, idx) => (idx === i ? e.target.checked : v)))}
                                    className="h-5 w-5 cursor-pointer accent-black dark:accent-[#FFF7E8]"
                                />
                                <span className="text-xs font-black uppercase">Soal {i + 1}</span>
                                <span className="ml-auto text-[10px] font-bold text-black/50 dark:text-[#FFF7E8]/50">{soal[i] === true ? '20 ✓' : '0 ○'}</span>
                            </label>
                        ))}
                        <InputError message={errors.ujian_soal} />
                        <div className="flex items-center justify-between rounded-none border-[3px] border-black dark:border-[#FFF7E8] bg-black px-3 py-2 text-[#FFF7E8]">
                            <span className="text-xs font-black uppercase">Total Ujian</span>
                            <span className="font-head text-lg font-black">{liveTotal}/100</span>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="catatan">Catatan Ujian</Label>
                            <Textarea
                                id="catatan"
                                value={catatan}
                                onChange={(e) => setCatatan(e.target.value)}
                                placeholder="Catatan optional..."
                                className="h-20 cursor-pointer resize-none border-2 border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 text-sm"
                            />
                        </div>
                        <InputError message={errors.catatan_ujian} />
                    </CardContent>
                </Card>
            </div>

            {/* Sticky footer */}
            <div className="fixed inset-x-0 bottom-0 z-10 border-t-[3px] border-black dark:border-[#FFF7E8] bg-black p-3">
                <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
                    <div className="text-[#FFF7E8]">
                        <p className="font-head text-xl leading-none font-black">{liveTotal}/100</p>
                        <p className="mt-1 text-[11px] font-bold text-[#FFF7E8]/70">{BULAN_LABELS[bulan - 1]} {tahun} · {totalBulanan} baris bulan ini</p>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <Button
                            type="submit"
                            disabled={processing || santriId === null}
                            className="cursor-pointer border-[3px] border-white bg-[#FF3B30] font-black text-white shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:bg-[#d92d24] disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" /> {processing ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </form>
                </div>
            </div>
        </PageContainer>
    );
}

UjianIndex.layout = { breadcrumbs: [{ title: 'Halaqah Saya', href: halaqahIndex() }, { title: 'Ujian Bulanan', href: ujianIndex() }] };
