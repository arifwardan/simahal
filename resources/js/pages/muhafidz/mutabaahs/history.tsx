import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { BookOpen, CalendarDays, CalendarRange, Filter, History, Sparkles } from 'lucide-react';
import Heading from '@/components/heading';
import PageContainer from '@/components/page-container';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatTanggal } from '@/lib/utils';
import { history } from '@/routes/muhafidz/mutabaahs';

type MutabaahRow = {
  id: number;
  tanggal: string;
  jenis: string;
  surah: string;
  ayat_mulai: number;
  ayat_selesai: number;
  nilai: number | null;
  status: string;
  catatan: string | null;
  santri: { nama: string };
};
type WeeklyRow = {
  week_start: string;
  week_end: string;
  label: string;
  total: number;
  unique_santri: number;
  by_santri: { santri: string; count: number }[];
  items: { id: number; tanggal: string; santri: { id: number; nama: string } | null; jenis: string; status: string }[];
};
type BulananRow = {
  id: number;
  tahun: number;
  bulan: number;
  halaman_awal_bulan: number | null;
  halaman_kumulatif: number | null;
  juz_dihafal: string | null;
  tasmi_pekan_1: number | null;
  tasmi_pekan_2: number | null;
  tasmi_pekan_3: number | null;
  tasmi_pekan_4: number | null;
  tasmi_pekan_5: number | null;
  ujian_bulanan: number | null;
  santri: { id: number; nama: string; nis: string | null };
};
type Paginated<T> = { data: T[]; total: number; links: { url: string | null; label: string; active: boolean }[]; current_page: number; last_page: number };
type PageProps = {
  mutabaahs: Paginated<MutabaahRow>;
  mingguan: Paginated<WeeklyRow>;
  bulanan: Paginated<BulananRow>;
  santriOptions: { id: number; nama: string }[];
  filters?: { santri?: number };
};
const statusColor: Record<string, string> = { lancar: 'bg-emerald-500', mengulang: 'bg-yellow-400 text-black', belum: 'bg-red-500' };
const bulanNama = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export default function MuhafidzMutabaahHistory({ mutabaahs, mingguan, bulanan, santriOptions, filters }: PageProps) {
  const [santri, setSantri] = useState<string>(filters?.santri ? String(filters.santri) : '');
  const [tab, setTab] = useState<'harian' | 'mingguan' | 'bulanan'>('harian');

  const onSantriChange = (value: string) => {
    setSantri(value);
    const v = value === '__all__' ? '' : value;
    router.get(history(), v ? { santri: v } : {}, { preserveState: true, replace: true });
  };

  return (
    <PageContainer className="space-y-4">
      <Heading title="Riwayat Mutabaah" description="Riwayat harian, mingguan, dan bulanan yang Anda catat." />

      {/* Filter */}
      <Card className="overflow-hidden border-[3px] border-black bg-[#FFD600] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardContent className="flex flex-col gap-2 bg-[#FFF7E8] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border-[3px] border-black bg-black text-white">
              <History className="h-5 w-5" />
            </div>
            <div>
              <p className="font-head text-sm font-black uppercase">Filter Riwayat</p>
              <p className="text-xs font-bold text-black/60">
                {tab === 'harian' ? `${mutabaahs.total} harian` : tab === 'mingguan' ? `${mingguan.total} pekan` : `${bulanan.total} bulanan`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <Select value={santri} onValueChange={onSantriChange}>
              <SelectTrigger className="w-[200px] cursor-pointer border-[3px] border-black bg-white font-black">
                <SelectValue placeholder="Semua santri" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__" className="cursor-pointer font-bold">
                  Semua santri
                </SelectItem>
                {santriOptions.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)} className="cursor-pointer">
                    {s.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'harian', label: 'Harian', desc: `${mutabaahs.total} catatan` },
          { key: 'mingguan', label: 'Mingguan', desc: `${mingguan.total} pekan` },
          { key: 'bulanan', label: 'Bulanan', desc: `${bulanan.total} bulan` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as never)}
            className={`flex-1 cursor-pointer border-[3px] border-black px-3 py-2 text-center font-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition ${
              tab === t.key ? 'bg-black text-[#FFF7E8]' : 'bg-white hover:bg-[#FFD600]'
            }`}
          >
            <span className="block text-sm">{t.label}</span>
            <span className="block text-[10px] opacity-70">{t.desc}</span>
          </button>
        ))}
      </div>

      {/* Stats row per tab */}
      {tab === 'harian' && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-[3px] border-black bg-[#FFF7E8] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <CardHeader className="bg-primary py-2">
              <CardTitle className="text-xs font-black uppercase">Total Harian</CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <p className="font-head text-3xl font-black">{mutabaahs.total}</p>
            </CardContent>
          </Card>
          <Card className="border-[3px] border-black bg-[#FFF7E8] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <CardHeader className="bg-[#5CE1E6] py-2">
              <CardTitle className="text-xs font-black uppercase">Halaman Ini</CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <p className="font-head text-3xl font-black">{mutabaahs.data.length}</p>
            </CardContent>
          </Card>
          <Card className="border-[3px] border-black bg-[#FF90E8] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <CardHeader className="bg-black py-2">
              <CardTitle className="text-xs font-black uppercase text-white">Filter</CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <p className="text-sm font-black">{santri ? santriOptions.find((s) => String(s.id) === santri)?.nama : 'Semua'}</p>
            </CardContent>
          </Card>
        </div>
      )}
      {tab === 'mingguan' && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-[3px] border-black bg-[#FFF7E8] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <CardHeader className="bg-[#5CE1E6] py-2">
              <CardTitle className="text-xs font-black uppercase">Total Pekan</CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <p className="font-head text-3xl font-black">{mingguan.total}</p>
            </CardContent>
          </Card>
          <Card className="border-[3px] border-black bg-[#FFF7E8] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <CardHeader className="bg-[#FFD600] py-2">
              <CardTitle className="text-xs font-black uppercase">Catatan Pekan Ini</CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <p className="font-head text-3xl font-black">{mingguan.data[0]?.total ?? 0}</p>
              <p className="text-xs font-bold">{mingguan.data[0]?.label ?? '-'}</p>
            </CardContent>
          </Card>
          <Card className="border-[3px] border-black bg-[#FFF7E8] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <CardHeader className="bg-black py-2">
              <CardTitle className="text-xs font-black uppercase text-white">Halaman Ini</CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <p className="font-head text-3xl font-black">{mingguan.data.length}</p>
            </CardContent>
          </Card>
        </div>
      )}
      {tab === 'bulanan' && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-[3px] border-black bg-[#FFF7E8] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <CardHeader className="bg-[#FF90E8] py-2">
              <CardTitle className="text-xs font-black uppercase">Total Bulanan</CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <p className="font-head text-3xl font-black">{bulanan.total}</p>
            </CardContent>
          </Card>
          <Card className="border-[3px] border-black bg-[#FFF7E8] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <CardHeader className="bg-primary py-2">
              <CardTitle className="text-xs font-black uppercase">Halaman Ini</CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <p className="font-head text-3xl font-black">{bulanan.data.length}</p>
            </CardContent>
          </Card>
          <Card className="border-[3px] border-black bg-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <CardHeader className="bg-white py-2"><CardTitle className="text-xs font-black uppercase">Filter</CardTitle></CardHeader>
            <CardContent className="bg-[#FFF7E8] pt-3">
              <p className="text-sm font-black">{santri ? santriOptions.find((s) => String(s.id) === santri)?.nama : 'Semua'}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Content */}
      {tab === 'harian' && (
        <>
          {mutabaahs.data.length === 0 ? (
            <Card className="border-[3px] border-dashed border-black bg-white p-8 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Sparkles className="mx-auto h-8 w-8" />
              <p className="mt-2 font-black uppercase">Belum ada riwayat harian</p>
              <p className="text-xs font-bold text-black/50">Catatan mutabaah harian akan muncul di sini</p>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {mutabaahs.data.map((m, idx) => (
                <div
                  key={m.id}
                  className={`relative flex flex-col overflow-hidden border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${idx % 3 === 0 ? 'bg-[#FFF7E8]' : idx % 3 === 1 ? 'bg-[#FFD600]/60' : 'bg-[#5CE1E6]/40'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 border-2 border-black bg-black px-2 py-1 text-xs font-black text-white">
                      <CalendarDays className="h-3 w-3" /> {formatTanggal(m.tanggal)}
                    </span>
                    <Badge className={`border-2 border-black font-black ${statusColor[m.status.toLowerCase()] ?? 'bg-zinc-800 text-white'}`}>{m.status}</Badge>
                  </div>
                  <p className="mt-3 font-head text-sm font-black uppercase">{m.santri.nama}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs font-bold">
                    <BookOpen className="h-3 w-3" /> {m.jenis} · {m.surah} {m.ayat_mulai}-{m.ayat_selesai}{' '}
                    {m.nilai !== null && <span className="ml-1 border-2 border-black bg-[#FFD600] px-1.5 py-0.5 text-xs font-black">Nilai {m.nilai}</span>}
                  </p>
                  {m.catatan && <p className="mt-2 border-l-[4px] border-black bg-white p-2 text-xs font-bold">{m.catatan}</p>}
                </div>
              ))}
            </div>
          )}
          {mutabaahs.last_page > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-[3px] border-black bg-[#FFF7E8] p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <span className="px-2 text-xs font-black uppercase">Hal {mutabaahs.current_page} dari {mutabaahs.last_page} · {mutabaahs.total} data</span>
              <div className="flex gap-1">
                {mutabaahs.links.map((link, i) =>
                  !link.url ? (
                    <span key={i} className="border-2 border-black bg-white px-3 py-1 text-xs font-black opacity-40" dangerouslySetInnerHTML={{ __html: link.label }} />
                  ) : (
                    <Link key={i} href={link.url} preserveState preserveScroll className={`cursor-pointer border-[3px] border-black px-3 py-1 text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${link.active ? 'bg-primary text-black' : 'bg-white hover:bg-black hover:text-white'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                  ),
                )}
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'mingguan' && (
        <>
          {mingguan.data.length === 0 ? (
            <Card className="border-[3px] border-dashed border-black bg-white p-8 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <CalendarRange className="mx-auto h-8 w-8" />
              <p className="mt-2 font-black uppercase">Belum ada riwayat mingguan</p>
              <p className="text-xs font-bold text-black/50">Agregasi per pekan (Senin–Minggu) dari mutabaah harian</p>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {mingguan.data.map((w, idx) => (
                <div key={w.week_start} className={`border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${idx % 2 === 0 ? 'bg-[#FFF7E8]' : 'bg-[#5CE1E6]/30'}`}>
                  <div className="flex items-center justify-between">
                    <span className="border-2 border-black bg-black px-2 py-1 text-xs font-black text-white">
                      <CalendarRange className="mr-1 inline h-3 w-3" /> {w.label}
                    </span>
                    <span className="border-2 border-black bg-[#FFD600] px-2 py-1 text-xs font-black">{w.total} catatan</span>
                  </div>
                  <p className="mt-2 text-xs font-bold">{w.unique_santri} santri · {w.by_santri.map((b) => `${b.santri}(${b.count})`).join(', ')}</p>
                  <ul className="mt-2 divide-y border-2 border-black bg-white text-xs font-bold">
                    {w.items.map((it) => (
                      <li key={it.id} className="flex justify-between px-2 py-1">
                        <span>{formatTanggal(it.tanggal)} · {it.santri?.nama ?? '-'}</span>
                        <Badge className="border border-black text-[10px]">{it.status}</Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
          {mingguan.last_page > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-[3px] border-black bg-[#FFF7E8] p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <span className="px-2 text-xs font-black uppercase">Hal {mingguan.current_page} dari {mingguan.last_page}</span>
              <div className="flex gap-1">
                {mingguan.links.map((link, i) =>
                  !link.url ? (
                    <span key={i} className="border-2 border-black bg-white px-3 py-1 text-xs font-black opacity-40" dangerouslySetInnerHTML={{ __html: link.label }} />
                  ) : (
                    <Link key={i} href={link.url} preserveState preserveScroll className={`cursor-pointer border-[3px] border-black px-3 py-1 text-xs font-black ${link.active ? 'bg-primary' : 'bg-white hover:bg-black hover:text-white'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                  ),
                )}
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'bulanan' && (
        <>
          {bulanan.data.length === 0 ? (
            <Card className="border-[3px] border-dashed border-black bg-white p-8 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <CalendarDays className="mx-auto h-8 w-8" />
              <p className="mt-2 font-black uppercase">Belum ada riwayat bulanan</p>
              <p className="text-xs font-bold text-black/50">Data dari mutabaah bulanan (tasmi pekan + ujian)</p>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {bulanan.data.map((b) => (
                <div key={b.id} className="border-[3px] border-black bg-[#FFF7E8] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center justify-between">
                    <span className="border-2 border-black bg-black px-2 py-1 text-xs font-black text-white">
                      {bulanNama[b.bulan]} {b.tahun}
                    </span>
                    <span className="border-2 border-black bg-[#FF90E8] px-2 py-1 text-xs font-black">{b.santri.nama}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-bold">
                    <span className="border-2 border-black bg-white px-2 py-1">Awal: {b.halaman_awal_bulan ?? '-'}</span>
                    <span className="border-2 border-black bg-[#FFD600] px-2 py-1">Kumulatif: {b.halaman_kumulatif ?? '-'}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-5 gap-1 text-center text-xs font-black">
                    {[b.tasmi_pekan_1, b.tasmi_pekan_2, b.tasmi_pekan_3, b.tasmi_pekan_4, b.tasmi_pekan_5].map((v, i) => (
                      <span key={i} className="border-2 border-black bg-white py-1">
                        P{i + 1}
                        <br />
                        {v ?? '-'}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 border-2 border-black bg-white px-2 py-1 text-xs font-bold">Ujian: {b.ujian_bulanan ?? '-'} · Juz: {b.juz_dihafal ?? '-'}</p>
                </div>
              ))}
            </div>
          )}
          {bulanan.last_page > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-[3px] border-black bg-[#FFF7E8] p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <span className="px-2 text-xs font-black uppercase">Hal {bulanan.current_page} dari {bulanan.last_page}</span>
              <div className="flex gap-1">
                {bulanan.links.map((link, i) =>
                  !link.url ? (
                    <span key={i} className="border-2 border-black bg-white px-3 py-1 text-xs font-black opacity-40" dangerouslySetInnerHTML={{ __html: link.label }} />
                  ) : (
                    <Link key={i} href={link.url} preserveState preserveScroll className={`cursor-pointer border-[3px] border-black px-3 py-1 text-xs font-black ${link.active ? 'bg-primary' : 'bg-white hover:bg-black hover:text-white'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                  ),
                )}
              </div>
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}
MuhafidzMutabaahHistory.layout = { breadcrumbs: [{ title: 'Riwayat Mutabaah', href: history() }] };
