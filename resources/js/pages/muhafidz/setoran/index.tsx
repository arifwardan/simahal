import { router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { Award, BookOpen, Calculator, CalendarDays, Library, Mic, RotateCcw, Save } from 'lucide-react';
import Heading from '@/components/heading';
import PageContainer from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { gradeLabel, pekanNumberInMonth } from '@/lib/mutabaah-bulanan';
import { index as halaqahIndex } from '@/routes/muhafidz/halaqahs';
import { index as setoranIndex, store as setoranStore } from '@/routes/muhafidz/setoran';

type Halaqah = { id: number; nama: string };
type Santri = { id: number; nama: string; nis?: string | null };
type Harian = Record<string, number | null>;
type PageProps = {
  halaqah: Halaqah;
  santri: Santri | null;
  listSantris: Santri[];
  harian: Harian;
  totalSepekan: number;
  tasmiPekan: number | null;
  totalBulanan: number;
  ujianBulanan: number | null;
  ujianSoal: (boolean | null)[];
  ujianTotal: number;
  targetHarian: number;
  catatanTasmi: string | null;
  catatanUjian: string | null;
  minggu: { senin: string; ahad: string; pekan_ke: number };
  settings: { konversi_juz_halaman: number; ambang_hadiah_juz: number; tahun_aktif: number };
};
const DAYS = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'ahad'] as const;
const DAY_LABELS: Record<string, string> = { senin: 'Senin', selasa: 'Selasa', rabu: 'Rabu', kamis: 'Kamis', jumat: 'Jumat', sabtu: 'Sabtu', ahad: 'Ahad' };
const GRADE_LEGEND = [
  { label: 'A', range: '90-100', color: 'bg-emerald-500' },
  { label: 'B', range: '80-89', color: 'bg-blue-500' },
  { label: 'C', range: '70-79', color: 'bg-yellow-400' },
  { label: 'D', range: '60-69', color: 'bg-orange-500' },
  { label: 'E', range: '<60', color: 'bg-red-500' },
] as const;
function getGradeColor(value: number | null): string {
  if (value === null || value === undefined) return 'bg-white text-black';
  if (value >= 90) return 'bg-emerald-500 text-white';
  if (value >= 80) return 'bg-blue-500 text-white';
  if (value >= 70) return 'bg-yellow-400 text-black';
  if (value >= 60) return 'bg-orange-500 text-white';
  return 'bg-red-500 text-white';
}
export default function SetoranIndex({ halaqah, santri, listSantris, harian, tasmiPekan, totalBulanan, ujianSoal: ujianSoalProp, targetHarian, catatanTasmi, catatanUjian, minggu, settings }: PageProps) {
  const [harianForm, setHarianForm] = useState<Harian>({ ...harian });
  const [tasmiValue, setTasmiValue] = useState<string>(tasmiPekan?.toString() ?? '');
  const [ujianSoal, setUjianSoal] = useState<(boolean | null)[]>(ujianSoalProp ?? [null, null, null, null, null]);
  const [catatanTasmiValue, setCatatanTasmiValue] = useState<string>(catatanTasmi ?? '');
  const [catatanUjianValue, setCatatanUjianValue] = useState<string>(catatanUjian ?? '');
  const liveTotal = useMemo(() => Object.values(harianForm).reduce<number>((acc, v) => acc + (v ?? 0), 0), [harianForm]);
  const liveUjianTotal = useMemo(() => ujianSoal.filter((v) => v === true).length * 20, [ujianSoal]);
  const pekanNumber = pekanNumberInMonth(new Date(minggu.senin));
  const isCrossMonth = useMemo(() => new Date(minggu.senin).getMonth() !== new Date(minggu.ahad).getMonth(), [minggu.senin, minggu.ahad]);
  function handleSantriChange(santriId: string) {
    router.get(setoranIndex.url(halaqah.id, { query: { minggu: minggu.senin, santri_id: santriId } }), {}, { preserveState: true, replace: true });
  }
  function handleWeekChange(offset: number) {
    const current = new Date(minggu.senin);
    current.setDate(current.getDate() + offset * 7);
    router.get(setoranIndex.url(halaqah.id, { query: { minggu: current.toISOString().split('T')[0], santri_id: santri?.id } }), {}, { preserveState: true, replace: true });
  }
  function handleDayChange(day: string, value: string) {
    const num = value === '' ? null : Math.min(30, Math.max(0, parseInt(value) || 0));
    setHarianForm((prev) => ({ ...prev, [day]: num }));
  }
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.post(setoranStore.url(), { halaqah_id: halaqah.id, santri_id: santri?.id, minggu: minggu.senin, harian: harianForm, tasmi_pekan: tasmiValue === '' ? null : parseInt(tasmiValue), ujian_soal: ujianSoal, catatan_tasmi: catatanTasmiValue || null, catatan_ujian: catatanUjianValue || null });
  }
  return (
    <PageContainer className="space-y-4">
      <Heading title="Input Setoran Halaqah" description={`${halaqah.nama} · Pekan ${minggu.pekan_ke} · ${new Date(minggu.senin).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`} />
      {/* HERO picker */}
      <Card className="overflow-hidden border-[3px] border-black bg-[#FFD600] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardContent className="flex flex-col gap-3 bg-[#FFF7E8] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-none border-[3px] border-black bg-black text-sm font-black text-[#FFF7E8] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {santri ? santri.nama.slice(0, 2).toUpperCase() : '??'}
            </div>
            <div>
              <p className="font-head text-sm font-black uppercase">{santri?.nama ?? 'Pilih Santri'}</p>
              <p className="text-xs font-bold text-black/60">{santri?.nis ?? '—'} · {halaqah.nama}</p>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full border-2 border-black bg-black px-3 py-1 text-xs font-black text-[#FFF7E8]">Pekan {pekanNumber}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-full border-[3px] border-black bg-white p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Button variant="ghost" size="icon-sm" onClick={() => handleWeekChange(-1)} className="h-7 w-7 cursor-pointer rounded-full">←</Button>
              <span className="px-2 text-xs font-black whitespace-nowrap">{new Date(minggu.senin).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - {new Date(minggu.ahad).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
              <Button variant="ghost" size="icon-sm" onClick={() => handleWeekChange(1)} className="h-7 w-7 cursor-pointer rounded-full">→</Button>
            </div>
            {isCrossMonth && (
              <span className="inline-flex items-center rounded-full border-2 border-amber-600 bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">⚠ Pekan lintas bulan — tercatat di bulan Senin</span>
            )}
            <Select value={santri?.id?.toString() ?? ''} onValueChange={handleSantriChange}>
              <SelectTrigger className="w-48 cursor-pointer border-[3px] border-black bg-white font-black"><SelectValue placeholder="Pilih santri..." /></SelectTrigger>
              <SelectContent>{listSantris.map((s) => <SelectItem key={s.id} value={s.id.toString()} className="cursor-pointer font-bold">{s.nama}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* PANEL 1 Harian - yellow */}
        <Card className="col-span-full overflow-hidden border-[3px] border-black bg-[#FFF7E8] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] lg:col-span-1">
          <CardHeader className="flex-row items-center gap-2 bg-[#FFD600] py-3"><CalendarDays className="h-4 w-4" /><CardTitle className="text-sm font-black uppercase">Setoran Harian (Baris)</CardTitle></CardHeader>
          <CardContent className="space-y-1 pt-3">
            <p className="text-[10px] font-bold text-black/50">Target {targetHarian} baris/hari</p>
            {DAYS.map((day, idx) => (
              <div key={day} className={`flex items-center gap-2 rounded-none border-2 p-2 ${idx % 2 === 0 ? 'bg-white border-black' : 'bg-[#FFF7E8] border-black/30'} ${harianForm[day] ? 'border-black bg-[#FFD600]/40' : ''}`}>
                <Label className="w-14 text-xs font-black uppercase">{DAY_LABELS[day]}</Label>
                <Input type="number" min={0} max={30} value={harianForm[day] ?? ''} onChange={(e) => handleDayChange(day, e.target.value)} className="h-8 w-16 cursor-pointer border-2 border-black bg-white text-center font-black" />
                <span className="text-xs font-black">{harianForm[day] ? '✓' : '○'}</span>
                <span className="ml-auto text-[10px] font-bold text-black/50">{harianForm[day] ?? 0} baris</span>
              </div>
            ))}
            <div className="mt-2 flex items-center justify-between rounded-none border-[3px] border-black bg-black px-3 py-2 text-[#FFF7E8]"><span className="text-xs font-black uppercase">Total Harian</span><span className="font-head text-lg font-black">{liveTotal} baris</span></div>
          </CardContent>
        </Card>
        {/* PANEL 2 Total Sepekan - cyan */}
        <Card className="col-span-full overflow-hidden border-[3px] border-black bg-[#FFF7E8] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] lg:col-span-1">
          <CardHeader className="flex-row items-center gap-2 bg-[#5CE1E6] py-3"><Calculator className="h-4 w-4" /><CardTitle className="text-sm font-black uppercase">Total Sepekan</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-none border-[3px] border-black bg-white text-4xl font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">{liveTotal}</div>
            <div className="mt-2 text-xs font-black uppercase text-black/60">baris</div>
            <div className={`mt-3 rounded-full border-[3px] border-black px-4 py-1 text-xs font-black ${getGradeColor(liveTotal)} shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>{gradeLabel(liveTotal)}</div>
            <p className="mt-3 text-center text-[10px] font-bold text-black/50">Otomatis dari total harian</p>
            <div className="mt-2 h-2 w-full border-2 border-black bg-white"><div className="h-full bg-black transition-all" style={{ width: `${Math.min(100, (liveTotal / 20) * 100)}%` }} /></div>
          </CardContent>
        </Card>
        {/* PANEL 3 Tasmi - pink */}
        <Card className="col-span-full overflow-hidden border-[3px] border-black bg-[#FFF7E8] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] lg:col-span-1">
          <CardHeader className="flex-row items-center gap-2 bg-[#FF90E8] py-3"><Mic className="h-4 w-4" /><CardTitle className="text-sm font-black uppercase">Tasmi Pekan {pekanNumber}</CardTitle></CardHeader>
          <CardContent className="space-y-3 pt-3">
            <div className="flex items-center gap-2"><Label className="w-12 text-xs font-black uppercase">Nilai</Label><Input type="number" min={1} max={100} value={tasmiValue} onChange={(e) => { const v = e.target.value; if (v === '') { setTasmiValue(''); return; } const n = Math.min(100, Math.max(1, parseInt(v) || 1)); setTasmiValue(String(n)); }} className="h-9 w-20 cursor-pointer border-[3px] border-black bg-white text-center font-black" placeholder="1-100" />{tasmiValue && <span className={`rounded-full border-[3px] border-black px-3 py-1 text-sm font-black ${getGradeColor(parseInt(tasmiValue))} shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>{gradeLabel(parseInt(tasmiValue))}</span>}</div>
            <p className="flex flex-wrap gap-1">{GRADE_LEGEND.map((g) => <span key={g.label} className={`inline-flex rounded-full border-2 border-black px-1.5 py-0.5 text-[10px] font-black ${g.color} ${g.label === 'C' ? 'text-black' : 'text-white'}`}>{g.label} {g.range}</span>)}</p>
            <div className="space-y-1"><Label className="text-xs font-black uppercase">Catatan Tasmi</Label><Textarea value={catatanTasmiValue} onChange={(e) => setCatatanTasmiValue(e.target.value)} className="h-20 cursor-pointer resize-none border-2 border-black bg-white text-sm" placeholder="Catatan optional..." /></div>
          </CardContent>
        </Card>
        {/* PANEL 4 Total Bulanan - green */}
        <Card className="col-span-full overflow-hidden border-[3px] border-black bg-[#FFF7E8] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] lg:col-span-1">
          <CardHeader className="flex-row items-center gap-2 bg-[#22c55e] py-3 text-white"><Library className="h-4 w-4" /><CardTitle className="text-sm font-black uppercase text-white">Total Bulanan</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-none border-[3px] border-black bg-black text-4xl font-black text-[#FFF7E8] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">{totalBulanan}</div>
            <div className="mt-2 text-xs font-black uppercase text-black/60">baris</div>
            <div className="mt-2 rounded-full border-2 border-black bg-white px-3 py-1 text-xs font-black">Target {settings.konversi_juz_halaman} baris/juz</div>
            <p className="mt-3 text-center text-[10px] font-bold text-black/50">Rekap total hafalan bulan ini</p>
          </CardContent>
        </Card>
        {/* PANEL 5 Ujian - red */}
        <Card className="col-span-full overflow-hidden border-[3px] border-black bg-[#FFF7E8] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] lg:col-span-1">
          <CardHeader className="flex-row items-center gap-2 bg-[#FF3B30] py-3 text-white"><Award className="h-4 w-4" /><CardTitle className="text-sm font-black uppercase text-white">Ujian Bulanan</CardTitle></CardHeader>
          <CardContent className="space-y-3 pt-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <label key={i} className="flex cursor-pointer items-center gap-2 rounded-none border-2 border-black bg-white p-2">
                <input
                  type="checkbox"
                  checked={ujianSoal[i] === true}
                  onChange={(e) => setUjianSoal((prev) => prev.map((v, idx) => (idx === i ? e.target.checked : v)))}
                  className="h-5 w-5 cursor-pointer accent-black"
                />
                <span className="text-xs font-black uppercase">Soal {i + 1}</span>
                <span className="ml-auto text-[10px] font-bold text-black/50">{ujianSoal[i] === true ? '20 ✓' : '0 ○'}</span>
              </label>
            ))}
            <div className="flex items-center justify-between rounded-none border-[3px] border-black bg-black px-3 py-2 text-[#FFF7E8]">
              <span className="text-xs font-black uppercase">Total Ujian</span>
              <span className="font-head text-lg font-black">{liveUjianTotal}/100</span>
            </div>
            <p className="flex flex-wrap gap-1">{GRADE_LEGEND.map((g) => <span key={g.label} className={`inline-flex rounded-full border-2 border-black px-1.5 py-0.5 text-[10px] font-black ${g.color} ${g.label === 'C' ? 'text-black' : 'text-white'}`}>{g.label} {g.range}</span>)}</p>
            <div className="space-y-1"><Label className="text-xs font-black uppercase">Catatan Ujian</Label><Textarea value={catatanUjianValue} onChange={(e) => setCatatanUjianValue(e.target.value)} className="h-20 cursor-pointer resize-none border-2 border-black bg-white text-sm" placeholder="Catatan optional..." /></div>
          </CardContent>
        </Card>
      </div>
      <div className="sticky bottom-2 z-10 flex items-center justify-between rounded-none border-[3px] border-black bg-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <Button type="button" variant="outline" onClick={() => { setHarianForm({ ...harian }); setTasmiValue(tasmiPekan?.toString() ?? ''); setUjianSoal(ujianSoalProp ?? [null, null, null, null, null]); setCatatanTasmiValue(catatanTasmi ?? ''); setCatatanUjianValue(catatanUjian ?? ''); }} className="cursor-pointer border-2 border-white bg-white font-black text-black"><RotateCcw className="h-4 w-4" /> Reset</Button>
        <div className="hidden sm:flex items-center gap-2 text-xs font-black text-[#FFF7E8]"><BookOpen className="h-4 w-4" /> {liveTotal} baris sepekan · {totalBulanan} baris bulan ini</div>
        <form onSubmit={handleSubmit}><Button type="submit" className="cursor-pointer border-[3px] border-white bg-[#FFD600] font-black text-black shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:bg-[#FFEB3B]"><Save className="h-4 w-4" /> Simpan Setoran</Button></form>
      </div>
    </PageContainer>
  );
}
SetoranIndex.layout = { breadcrumbs: [{ title: 'Halaqah Saya', href: halaqahIndex() }] };
