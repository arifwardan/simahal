import { router } from '@inertiajs/react';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Mic, Save } from 'lucide-react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import PageContainer from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { gradeLabel } from '@/lib/mutabaah-bulanan';
import { index as halaqahIndex } from '@/routes/muhafidz/halaqahs';
import { index as tasmiIndex, store as tasmiStore } from '@/routes/muhafidz/tasmi';

type Santri = { id: number; nama: string; nis?: string | null };
type PageProps = {
    santris: Santri[];
    santriId: number | null;
    minggu: { senin: string; ahad: string; pekan_ke: number };
    totalSepekan: number;
    tasmiPekan: number | null;
    catatanTasmi: string | null;
    errors?: Record<string, string>;
};

const GRADE_LEGEND = [
    { label: 'A', range: '90-100', color: 'bg-emerald-500 text-white' },
    { label: 'B', range: '80-89', color: 'bg-blue-500 text-white' },
    { label: 'C', range: '70-79', color: 'bg-yellow-400 text-black' },
    { label: 'D', range: '60-69', color: 'bg-orange-500 text-white' },
    { label: 'E', range: '<60', color: 'bg-red-500 text-white' },
] as const;

function getGradeColor(value: number | null): string {
    if (value === null || value === undefined) {
        return 'bg-white dark:bg-zinc-900 text-black dark:text-[#FFF7E8]';
    }
    if (value >= 90) {
        return 'bg-emerald-500 text-white';
    }
    if (value >= 80) {
        return 'bg-blue-500 text-white';
    }
    if (value >= 70) {
        return 'bg-yellow-400 text-black';
    }
    if (value >= 60) {
        return 'bg-orange-500 text-white';
    }
    return 'bg-red-500 text-white';
}

function shiftWeek(senin: string, offset: number): string {
    const d = new Date(senin);
    d.setDate(d.getDate() + offset * 7);
    return d.toISOString().split('T')[0];
}

export default function TasmiIndex({ santris, santriId, minggu, totalSepekan, tasmiPekan, catatanTasmi, errors = {} }: PageProps) {
    const activeSantri = santris.find((s) => s.id === santriId) ?? null;
    const [nilai, setNilai] = useState<string>(tasmiPekan?.toString() ?? '');
    const [catatan, setCatatan] = useState<string>(catatanTasmi ?? '');
    const [processing, setProcessing] = useState(false);

    const parsed = nilai === '' ? null : parseInt(nilai);

    function navigate(santri: string | number | null, senin: string) {
        router.get(
            tasmiIndex.url({ query: { santri_id: santri ?? undefined, minggu: senin } }),
            {},
            { preserveState: false, replace: true },
        );
    }

    function handleSantriChange(value: string) {
        navigate(value, minggu.senin);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setProcessing(true);
        router.post(
            tasmiStore.url(),
            {
                santri_id: santriId,
                minggu: minggu.senin,
                tasmi_pekan: nilai === '' ? null : parseInt(nilai),
                catatan_tasmi: catatan || null,
            },
            { onFinish: () => setProcessing(false) },
        );
    }

    return (
        <PageContainer className="space-y-4 pb-28">
            <Heading
                title="Tasmi Pekanan"
                description={`${activeSantri?.nama ?? 'Pilih santri'} · Pekan ${minggu.pekan_ke} · ${new Date(minggu.senin).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`}
            />

            {/* Week picker + santri */}
            <Card className="overflow-hidden border-[3px] border-black dark:border-[#FFF7E8] bg-[#FF90E8] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                <CardContent className="flex flex-col gap-3 bg-[#FFF7E8] dark:bg-zinc-900 p-4 sm:flex-row sm:items-end">
                    <div className="flex-1 space-y-1">
                        <Label htmlFor="santri">Santri</Label>
                        <Select value={santriId?.toString() ?? ''} onValueChange={handleSantriChange}>
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
                        <Label>Pekan</Label>
                        <div className="flex items-center gap-1 rounded-none border-[3px] border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => navigate(santriId, shiftWeek(minggu.senin, -1))}
                                aria-label="Pekan sebelumnya"
                                className="h-7 w-7 cursor-pointer rounded-full"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="px-2 text-xs font-black whitespace-nowrap">
                                {new Date(minggu.senin).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} –{' '}
                                {new Date(minggu.ahad).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => navigate(santriId, shiftWeek(minggu.senin, 1))}
                                aria-label="Pekan berikutnya"
                                className="h-7 w-7 cursor-pointer rounded-full"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
                {/* Total sepekan read-only */}
                <Card className="overflow-hidden border-[3px] border-black dark:border-[#FFF7E8] bg-[#FFF7E8] dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                    <CardHeader className="flex-row items-center gap-2 bg-[#5CE1E6] py-3 text-black">
                        <Mic className="h-4 w-4" />
                        <CardTitle className="text-sm font-black uppercase">Total Sepekan</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center py-6">
                        <div className="flex h-24 w-24 items-center justify-center rounded-none border-[3px] border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 text-4xl font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
                            {totalSepekan}
                        </div>
                        <div className="mt-2 text-xs font-black uppercase text-black/60 dark:text-[#FFF7E8]/60">baris</div>
                        <p className="mt-3 text-center text-[10px] font-bold text-black/50 dark:text-[#FFF7E8]/50">Otomatis dari setoran harian pekan ini</p>
                    </CardContent>
                </Card>

                {/* Nilai tasmi */}
                <Card className="overflow-hidden border-[3px] border-black dark:border-[#FFF7E8] bg-[#FFF7E8] dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                    <CardHeader className="flex-row items-center gap-2 bg-[#FF90E8] py-3 text-black">
                        <Mic className="h-4 w-4" />
                        <CardTitle className="text-sm font-black uppercase">Nilai Tasmi Pekan {minggu.pekan_ke}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-4">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="nilai" className="w-12 text-xs font-black uppercase">Nilai</Label>
                            <Input
                                id="nilai"
                                type="number"
                                inputMode="numeric"
                                min={10}
                                max={100}
                                value={nilai}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    if (v === '') {
                                        setNilai('');
                                        return;
                                    }
                                    setNilai(String(Math.min(100, Math.max(10, parseInt(v) || 10))));
                                }}
                                placeholder="10-100"
                                className="h-9 w-24 cursor-pointer border-[3px] border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 text-center font-black"
                            />
                            {parsed !== null && (
                                <span className={`rounded-full border-[3px] border-black dark:border-[#FFF7E8] px-3 py-1 text-sm font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] ${getGradeColor(parsed)}`}>
                                    {gradeLabel(parsed)}
                                </span>
                            )}
                        </div>
                        <InputError message={errors.tasmi_pekan} />
                        <p className="flex flex-wrap gap-1">
                            {GRADE_LEGEND.map((g) => (
                                <span key={g.label} className={`inline-flex rounded-full border-2 border-black dark:border-[#FFF7E8] px-1.5 py-0.5 text-[10px] font-black ${g.color}`}>
                                    {g.label} {g.range}
                                </span>
                            ))}
                        </p>
                        <div className="space-y-1">
                            <Label htmlFor="catatan">Catatan Tasmi</Label>
                            <Textarea
                                id="catatan"
                                value={catatan}
                                onChange={(e) => setCatatan(e.target.value)}
                                placeholder="Catatan optional..."
                                className="h-20 cursor-pointer resize-none border-2 border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 text-sm"
                            />
                        </div>
                        <InputError message={errors.catatan_tasmi} />
                    </CardContent>
                </Card>
            </div>

            {/* Sticky footer */}
            <div className="fixed inset-x-0 bottom-0 z-10 border-t-[3px] border-black dark:border-[#FFF7E8] bg-black p-3">
                <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
                    <div className="text-[#FFF7E8]">
                        <p className="font-head text-xl leading-none font-black">{parsed !== null ? `${parsed} (${gradeLabel(parsed)})` : '—'}</p>
                        <p className="mt-1 text-[11px] font-bold text-[#FFF7E8]/70">Pekan {minggu.pekan_ke} · {totalSepekan} baris sepekan</p>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <Button
                            type="submit"
                            disabled={processing || santriId === null}
                            className="cursor-pointer border-[3px] border-white bg-[#FF90E8] font-black text-black shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:bg-[#ff7ae2] disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" /> {processing ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </form>
                </div>
            </div>
        </PageContainer>
    );
}

TasmiIndex.layout = { breadcrumbs: [{ title: 'Halaqah Saya', href: halaqahIndex() }, { title: 'Tasmi Pekanan', href: tasmiIndex() }] };
