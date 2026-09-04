import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { BookOpen, CalendarDays, Filter, History, Search, Sparkles } from 'lucide-react';
import Heading from '@/components/heading';
import PageContainer from '@/components/page-container';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
type PageProps = {
  mutabaahs: { data: MutabaahRow[]; total: number; links: { url: string | null; label: string; active: boolean }[]; current_page: number; last_page: number };
  santriOptions: { id: number; nama: string }[];
  filters?: { santri?: number };
};
const statusColor: Record<string, string> = { lancar: 'bg-emerald-500', mengulang: 'bg-yellow-400 text-black', belum: 'bg-red-500' };
export default function MuhafidzMutabaahHistory({ mutabaahs, santriOptions, filters }: PageProps) {
  const [santri, setSantri] = useState<string>(filters?.santri ? String(filters.santri) : '');
  return (
    <PageContainer className="space-y-4">
      <Heading title="Riwayat Mutabaah" description="Riwayat pencatatan mutabaah yang Anda lakukan." />
      <Card className="overflow-hidden border-[3px] border-black bg-[#FFD600] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardContent className="flex flex-col gap-2 bg-[#FFF7E8] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center border-[3px] border-black bg-black text-white"><History className="h-5 w-5" /></div><div><p className="font-head text-sm font-black uppercase">Filter Riwayat</p><p className="text-xs font-bold text-black/60">{mutabaahs.total} catatan total</p></div></div>
          <div className="flex items-center gap-2"><Filter className="h-4 w-4" /><Select value={santri} onValueChange={(value) => { setSantri(value); const v = value === '__all__' ? '' : value; router.get(history(), v ? { santri: v } : {}, { preserveState: true, replace: true }); }}><SelectTrigger className="w-[200px] cursor-pointer border-[3px] border-black bg-white font-black"><SelectValue placeholder="Semua santri" /></SelectTrigger><SelectContent><SelectItem value="__all__" className="cursor-pointer font-bold">Semua santri</SelectItem>{santriOptions.map((s) => <SelectItem key={s.id} value={String(s.id)} className="cursor-pointer">{s.nama}</SelectItem>)}</SelectContent></Select></div>
        </CardContent>
      </Card>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-[3px] border-black bg-[#FFF7E8] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"><CardHeader className="bg-primary py-2"><CardTitle className="text-xs font-black uppercase">Total Catatan</CardTitle></CardHeader><CardContent className="pt-3"><p className="font-head text-3xl font-black">{mutabaahs.total}</p></CardContent></Card>
        <Card className="border-[3px] border-black bg-[#FFF7E8] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"><CardHeader className="bg-[#5CE1E6] py-2"><CardTitle className="text-xs font-black uppercase">Halaman Ini</CardTitle></CardHeader><CardContent className="pt-3"><p className="font-head text-3xl font-black">{mutabaahs.data.length}</p></CardContent></Card>
        <Card className="border-[3px] border-black bg-[#FF90E8] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"><CardHeader className="bg-black py-2"><CardTitle className="text-xs font-black uppercase text-white">Filter</CardTitle></CardHeader><CardContent className="pt-3"><p className="text-sm font-black">{santri ? santriOptions.find((s) => String(s.id) === santri)?.nama : 'Semua'}</p></CardContent></Card>
      </div>
      {mutabaahs.data.length === 0 ? (
        <Card className="border-[3px] border-dashed border-black bg-white p-8 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"><Sparkles className="mx-auto h-8 w-8" /><p className="mt-2 font-black uppercase">Belum ada riwayat</p><p className="text-xs font-bold text-black/50">Catatan mutabaah akan muncul di sini</p></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {mutabaahs.data.map((m, idx) => (
            <div key={m.id} className={`relative flex flex-col overflow-hidden border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${idx % 3 === 0 ? 'bg-[#FFF7E8]' : idx % 3 === 1 ? 'bg-[#FFD600]/60' : 'bg-[#5CE1E6]/40'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 border-2 border-black bg-black px-2 py-1 text-xs font-black text-white"><CalendarDays className="h-3 w-3" /> {m.tanggal}</span>
                <Badge className={`border-2 border-black font-black ${statusColor[m.status.toLowerCase()] ?? 'bg-zinc-800 text-white'}`}>{m.status}</Badge>
              </div>
              <p className="mt-3 font-head text-sm font-black uppercase">{m.santri.nama}</p>
              <p className="mt-1 flex items-center gap-1 text-xs font-bold"><BookOpen className="h-3 w-3" /> {m.jenis} · {m.surah} {m.ayat_mulai}-{m.ayat_selesai} {m.nilai !== null && <span className="ml-1 border-2 border-black bg-[#FFD600] px-1.5 py-0.5 text-xs font-black">Nilai {m.nilai}</span>}</p>
              {m.catatan && <p className="mt-2 border-l-[4px] border-black bg-white p-2 text-xs font-bold">{m.catatan}</p>}
            </div>
          ))}
        </div>
      )}
      {mutabaahs.last_page > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-[3px] border-black bg-[#FFF7E8] p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <span className="px-2 text-xs font-black uppercase">Hal {mutabaahs.current_page} dari {mutabaahs.last_page} · {mutabaahs.total} data</span>
          <div className="flex gap-1">{mutabaahs.links.map((link, i) => !link.url ? <span key={i} className="border-2 border-black bg-white px-3 py-1 text-xs font-black opacity-40" dangerouslySetInnerHTML={{ __html: link.label }} /> : <Link key={i} href={link.url} preserveState preserveScroll className={`cursor-pointer border-[3px] border-black px-3 py-1 text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${link.active ? 'bg-primary text-black' : 'bg-white hover:bg-black hover:text-white'}`} dangerouslySetInnerHTML={{ __html: link.label }} />)}</div>
        </div>
      )}
    </PageContainer>
  );
}
MuhafidzMutabaahHistory.layout = { breadcrumbs: [{ title: 'Riwayat Mutabaah', href: history() }] };
