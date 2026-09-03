import { router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import Heading from '@/components/heading';
import PageContainer from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { totalSepekan, gradeLabel, pekanNumberInMonth } from '@/lib/mutabaah-bulanan';
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
  catatanTasmi: string | null;
  catatanUjian: string | null;
  minggu: { senin: string; ahad: string; pekan_ke: number };
  settings: { konversi_juz_halaman: number; ambang_hadiah_juz: number; tahun_aktif: number };
};

const DAYS = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'ahad'] as const;
const DAY_LABELS: Record<string, string> = {
  senin: 'Senin', selasa: 'Selasa', rabu: 'Rabu', kamis: 'Kamis',
  jumat: 'Jumat', sabtu: 'Sabtu', ahad: 'Ahad',
};

const GRADE_OPTIONS = [
  { value: '95', label: 'A (90-100)' },
  { value: '85', label: 'B (80-89)' },
  { value: '75', label: 'C (70-79)' },
  { value: '65', label: 'D (60-69)' },
  { value: '50', label: 'E (<60)' },
];

function getGradeColor(value: number | null): string {
  if (value === null) return '';
  if (value >= 90) return 'text-emerald-600';
  if (value >= 80) return 'text-blue-600';
  if (value >= 70) return 'text-yellow-600';
  if (value >= 60) return 'text-orange-600';
  return 'text-red-600';
}

export default function SetoranIndex({
  halaqah,
  santri,
  listSantris,
  harian,
  totalSepekan,
  tasmiPekan,
  totalBulanan,
  ujianBulanan,
  catatanTasmi,
  catatanUjian,
  minggu,
  settings,
}: PageProps) {
  const [harianForm, setHarianForm] = useState<Harian>({ ...harian });
  const [tasmiValue, setTasmiValue] = useState<string>(tasmiPekan?.toString() ?? '');
  const [ujianValue, setUjianValue] = useState<string>(ujianBulanan?.toString() ?? '');
  const [catatanTasmiValue, setCatatanTasmiValue] = useState<string>(catatanTasmi ?? '');
  const [catatanUjianValue, setCatatanUjianValue] = useState<string>(catatanUjian ?? '');

  const liveTotal = useMemo(() => {
    return Object.values(harianForm).reduce<number>((acc, v) => acc + (v ?? 0), 0);
  }, [harianForm]);
  const pekanNumber = pekanNumberInMonth(new Date(minggu.senin));

  function handleSantriChange(santriId: string) {
    router.get(
      setoranIndex.url(halaqah.id, { query: { minggu: minggu.senin, santri_id: santriId } }),
      { preserveState: true, replace: true }
    );
  }

  function handleWeekChange(offset: number) {
    const current = new Date(minggu.senin);
    current.setDate(current.getDate() + offset * 7);
    router.get(
      setoranIndex.url(halaqah.id, { query: { minggu: current.toISOString().split('T')[0], santri_id: santri?.id } }),
      { preserveState: true, replace: true }
    );
  }

  function handleDayChange(day: string, value: string) {
    const num = value === '' ? null : Math.min(20, Math.max(0, parseInt(value) || 0));
    setHarianForm((prev) => ({ ...prev, [day]: num }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.post(setoranStore.url(), {
      halaqah_id: halaqah.id,
      santri_id: santri?.id,
      minggu: minggu.senin,
      harian: harianForm,
      tasmi_pekan: tasmiValue === '' ? null : parseInt(tasmiValue),
      ujian_bulanan: ujianValue === '' ? null : parseInt(ujianValue),
      catatan_tasmi: catatanTasmiValue || null,
      catatan_ujian: catatanUjianValue || null,
    });
  }

  return (
    <PageContainer>
      <Heading
        title="Input Setoran Halaqah"
        description={`Setoran harian pekan ${minggu.pekan_ke} · ${halaqah.nama}`}
      />

      <div className="grid gap-4 lg:grid-cols-5">
        {/* PANEL 1: Setoran Harian */}
        <Card className="col-span-full lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Setoran Harian</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {DAYS.map((day) => (
              <div key={day} className="flex items-center gap-2">
                <Label className="w-16 text-xs">{DAY_LABELS[day]}</Label>
                <Input
                  type="number"
                  min={0}
                  max={20}
                  value={harianForm[day] ?? ''}
                  onChange={(e) => handleDayChange(day, e.target.value)}
                  className="h-8 w-20 text-center"
                />
                {harianForm[day] !== null && harianForm[day] !== undefined && harianForm[day]! > 0 && (
                  <span className="text-xs text-emerald-600">✓</span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* PANEL 2: Total Sepekan */}
        <Card className="col-span-full lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Sepekan</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="text-4xl font-bold">{liveTotal}</div>
            <div className="text-sm text-muted-foreground">halaman</div>
            <div className="mt-2 text-xs">
              {gradeLabel(liveTotal)}
            </div>
          </CardContent>
        </Card>

        {/* PANEL 3: Tasmi */}
        <Card className="col-span-full lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tasmi Pekan {pekanNumber}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="w-12 text-xs">Nilai</Label>
              <Input
                type="number"
                min={10}
                max={100}
                value={tasmiValue}
                onChange={(e) => setTasmiValue(e.target.value)}
                className="h-8 w-20"
              />
              {tasmiValue && (
                <span className={`text-sm font-bold ${getGradeColor(parseInt(tasmiValue))}`}>
                  {gradeLabel(parseInt(tasmiValue))}
                </span>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Catatan Tasmi</Label>
              <Textarea
                value={catatanTasmiValue}
                onChange={(e) => setCatatanTasmiValue(e.target.value)}
                className="h-20 resize-none text-sm"
                placeholder="Catatan optional..."
              />
            </div>
          </CardContent>
        </Card>

        {/* PANEL 4: Total Bulanan */}
        <Card className="col-span-full lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Bulanan</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="text-4xl font-bold">{totalBulanan}</div>
            <div className="text-sm text-muted-foreground">halaman</div>
            <div className="mt-2 text-xs">
              Target: {settings.konversi_juz_halaman} hal/juz
            </div>
          </CardContent>
        </Card>

        {/* PANEL 5: Ujian Bulanan */}
        <Card className="col-span-full lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Ujian Bulanan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Nilai Ujian</Label>
              <Select value={ujianValue} onValueChange={setUjianValue}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih nilai..." />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Catatan Ujian</Label>
              <Textarea
                value={catatanUjianValue}
                onChange={(e) => setCatatanUjianValue(e.target.value)}
                className="h-20 resize-none text-sm"
                placeholder="Catatan optional..."
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation & Santri Picker */}
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleWeekChange(-1)}>
            ← Minggu Lalu
          </Button>
          <div className="text-sm font-medium">
            {new Date(minggu.senin).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
            {' - '}
            {new Date(minggu.ahad).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
          </div>
          <Button variant="outline" onClick={() => handleWeekChange(1)}>
            Minggu Depan →
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-sm">Santri:</Label>
          <Select value={santri?.id?.toString() ?? ''} onValueChange={handleSantriChange}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Pilih santri..." />
            </SelectTrigger>
            <SelectContent>
              {listSantris.map((s) => (
                <SelectItem key={s.id} value={s.id.toString()}>
                  {s.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-6 flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setHarianForm({ ...harian });
            setTasmiValue(tasmiPekan?.toString() ?? '');
            setUjianValue(ujianBulanan?.toString() ?? '');
            setCatatanTasmiValue(catatanTasmi ?? '');
            setCatatanUjianValue(catatanUjian ?? '');
          }}
        >
          Reset
        </Button>
        <form onSubmit={handleSubmit}>
          <Button type="submit">
            Simpan Setoran
          </Button>
        </form>
      </div>
    </PageContainer>
  );
}

SetoranIndex.layout = {
  breadcrumbs: [
    { title: 'Halaqah Saya', href: halaqahIndex() },
  ],
};
