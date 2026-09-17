import { Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { BookOpen, CalendarDays, CalendarRange, Filter, History, LayoutDashboard, Sparkles } from 'lucide-react';
import Heading from '@/components/heading';
import PageContainer from '@/components/page-container';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatTanggal } from '@/lib/utils';
import { history } from '@/routes/admin/mutabaahs';

type MutabaahRow = {
  id: number; tanggal: string; jenis: string; surah: string; ayat_mulai: number; ayat_selesai: number; nilai: number | null; status: string; catatan: string | null;
  santri: { nama: string; nis: string | null }; muhafidz: { nama: string } | null;
};
type WeeklyRow = { week_start: string; week_end: string; label: string; total: number; unique_santri: number; by_santri: { santri: string; count: number }[]; items: { id:number; tanggal:string; santri:{nama:string}|null; status:string }[] };
type BulananRow = { id:number; tahun:number; bulan:number; halaman_awal_bulan:number|null; halaman_kumulatif:number|null; juz_dihafal:string|null; tasmi_pekan_1:number|null; tasmi_pekan_2:number|null; tasmi_pekan_3:number|null; tasmi_pekan_4:number|null; tasmi_pekan_5:number|null; ujian_bulanan:number|null; santri:{ nama:string; nis:string|null } };
type RekapRow = { jenis:string; kelompok:string; muhafidz:string|null; jumlah_santri:number; terisi:number; rata_halaman_kumulatif:number|null; rata_tambah_juz:number|null; rata_tasmi:number|null; rata_ujian:number|null; berprestasi:number };
type DistribusiRow = { kategori:string; ikhwan:number; akhwat:number; total:number };
type Paginated<T> = { data:T[]; total:number; links:{url:string|null; label:string; active:boolean}[]; current_page:number; last_page:number };
type PageProps = { mutabaahs:Paginated<MutabaahRow>; mingguan:Paginated<WeeklyRow>; bulanan:Paginated<BulananRow>; rekap:{ rows:RekapRow[]; distribusi:DistribusiRow[]; bulan:number; tahun:number; settings:{konversi_juz_halaman:number;ambang_hadiah_juz:number;tahun_aktif:number} }; santriOptions:{id:number;nama:string}[]; halaqahOptions:{id:number;nama:string;muhafidz:string|null}[]; filters:{santri?:number; halaqah?:number; rekap_bulan?:number} };
const statusColor: Record<string,string> = { lancar:'bg-emerald-500', mengulang:'bg-yellow-400 text-black', belum:'bg-red-500' };
const bulanNama=['','Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const bulanNames=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

export default function AdminMutabaahHistory({ mutabaahs, mingguan, bulanan, rekap, santriOptions, halaqahOptions, filters }: PageProps) {
  const [santri,setSantri]=useState(filters?.santri?String(filters.santri):'');
  const [halaqah,setHalaqah]=useState(filters?.halaqah?String(filters.halaqah):'');
  const [rekapBulan,setRekapBulan]=useState(String(filters?.rekap_bulan ?? rekap.bulan));
  const [tab,setTab]=useState<'harian'|'mingguan'|'bulanan'|'rekap'>('harian');
  const push = (s:string,h:string,rb?:string)=>{ const params:any={}; if(s&&s!=='__all__') params.santri=s; if(h&&h!=='__all__') params.halaqah=h; if(rb) params.rekap_bulan=rb; else if(filters?.rekap_bulan) params.rekap_bulan=filters.rekap_bulan; router.get(history(), params,{preserveState:true,replace:true}); };
  const rekapColumns = useMemo<DataTableColumn<RekapRow>[]>(()=>[
    {id:'jenis', header:'Jenis', cell:r=><span className="font-bold">{r.jenis}</span>},
    {id:'kelompok', header:'Kelompok', cell:r=><span className="font-black">{r.kelompok}</span>},
    {id:'muhafidz', header:'Muhafidz', cell:r=><span>{r.muhafidz??'-'}</span>},
    {id:'jumlah_santri', header:'Jml', headerClassName:'text-right', className:'text-right font-bold', cell:r=>r.jumlah_santri},
    {id:'terisi', header:'Terisi', headerClassName:'text-right', className:'text-right font-bold', cell:r=>r.terisi},
    {id:'rata_kumulatif', header:'Rata Kum', headerClassName:'text-right', className:'text-right font-bold', cell:r=>r.rata_halaman_kumulatif??'-'},
    {id:'rata_juz', header:'Rata Juz', headerClassName:'text-right', className:'text-right font-bold', cell:r=>r.rata_tambah_juz??'-'},
    {id:'rata_tasmi', header:'Rata Tasmi', headerClassName:'text-right', className:'text-right font-bold', cell:r=>r.rata_tasmi??'-'},
    {id:'rata_ujian', header:'Rata Ujian', headerClassName:'text-right', className:'text-right font-bold', cell:r=>r.rata_ujian??'-'},
    {id:'berprestasi', header:'Prestasi', headerClassName:'text-right', className:'text-right font-black', cell:r=>r.berprestasi},
  ],[]);
  const distribusiColumns = useMemo<DataTableColumn<DistribusiRow>[]>(()=>[
    {id:'kategori', header:'Kategori', cell:r=><span className="font-black">{r.kategori}</span>},
    {id:'ikhwan', header:'Ikhwan', headerClassName:'text-right', className:'text-right font-bold', cell:r=>r.ikhwan},
    {id:'akhwat', header:'Akhwat', headerClassName:'text-right', className:'text-right font-bold', cell:r=>r.akhwat},
    {id:'total', header:'Total', headerClassName:'text-right', className:'text-right font-black', cell:r=>r.total},
  ],[]);
  return (
    <PageContainer className="space-y-4">
      <Heading title="Mutabaah — Admin" description="Satu menu: harian, mingguan, bulanan & rekap halaqah." />
      <Card className="overflow-hidden border-[3px] border-black dark:border-[#FFF7E8] bg-[#FFD600] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
        <CardContent className="flex flex-col gap-2 bg-[#FFF7E8] dark:bg-zinc-900 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center border-[3px] border-black dark:border-[#FFF7E8] bg-black text-white"><History className="h-5 w-5"/></div><div><p className="font-head text-sm font-black uppercase">Filter Global</p><p className="text-xs font-bold text-black/60">{tab==='harian'?`${mutabaahs.total} harian`:tab==='mingguan'?`${mingguan.total} pekan`:tab==='bulanan'?`${bulanan.total} bulanan`:`Rekap ${bulanNama[rekap.bulan]} ${rekap.tahun}`} · semua halaqah</p></div></div>
          <div className="flex flex-wrap items-center gap-2">
            {tab!=='rekap' ? <>
              <Select value={santri} onValueChange={(v)=>{setSantri(v); push(v,halaqah);}}><SelectTrigger className="w-[150px] border-[3px] border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 font-black"><SelectValue placeholder="Santri"/></SelectTrigger><SelectContent><SelectItem value="__all__">Semua santri</SelectItem>{santriOptions.map(s=><SelectItem key={s.id} value={String(s.id)}>{s.nama}</SelectItem>)}</SelectContent></Select>
              <Select value={halaqah} onValueChange={(v)=>{setHalaqah(v); push(santri,v);}}><SelectTrigger className="w-[170px] border-[3px] border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 font-black"><SelectValue placeholder="Halaqah"/></SelectTrigger><SelectContent><SelectItem value="__all__">Semua halaqah</SelectItem>{halaqahOptions.map(h=><SelectItem key={h.id} value={String(h.id)}>{h.nama} — {h.muhafidz??'-'}</SelectItem>)}</SelectContent></Select>
            </> : (
              <Select value={rekapBulan} onValueChange={(v)=>{setRekapBulan(v); push(santri,halaqah,v);}}><SelectTrigger className="w-[170px] border-[3px] border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 font-black"><SelectValue placeholder="Bulan"/></SelectTrigger><SelectContent>{bulanNames.map((n,i)=><SelectItem key={i+1} value={String(i+1)}>{n}</SelectItem>)}</SelectContent></Select>
            )}
            <Filter className="h-4 w-4"/>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {[{key:'harian',label:'Harian',desc:`${mutabaahs.total}`,icon:BookOpen},{key:'mingguan',label:'Mingguan',desc:`${mingguan.total}`,icon:CalendarRange},{key:'bulanan',label:'Bulanan',desc:`${bulanan.total}`,icon:CalendarDays},{key:'rekap',label:'Rekap',desc:`Halaqah`,icon:LayoutDashboard}].map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key as never)} className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 border-[3px] border-black dark:border-[#FFF7E8] px-3 py-2 text-center font-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] ${tab===t.key?'bg-black text-[#FFF7E8]':'bg-white dark:bg-zinc-900 hover:bg-[#FFD600]'}`}>
            <t.icon className="h-4 w-4"/><span className="text-sm">{t.label}</span><span className="hidden sm:inline text-[10px] opacity-70">· {t.desc}</span>
          </button>
        ))}
      </div>

      {tab==='harian' && (
        <>
          {mutabaahs.data.length===0?<Card className="border-[3px] border-dashed border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 p-8 text-center"><Sparkles className="mx-auto h-8 w-8"/><p className="mt-2 font-black uppercase">Belum ada data harian</p></Card>:(
            <div className="grid gap-3 sm:grid-cols-2">
              {mutabaahs.data.map((m,idx)=>(
                <div key={m.id} className={`border-[3px] border-black dark:border-[#FFF7E8] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] ${idx%3===0?'bg-[#FFF7E8] dark:bg-zinc-900':idx%3===1?'bg-[#FFD600]/60 dark:bg-[#FFD600]/15':'bg-[#5CE1E6]/40 dark:bg-[#5CE1E6]/15'}`}>
                  <div className="flex justify-between gap-2"><span className="border-2 border-black dark:border-[#FFF7E8] bg-black px-2 py-1 text-xs font-black text-white"><CalendarDays className="mr-1 inline h-3 w-3"/>{formatTanggal(m.tanggal)}</span><Badge className={`border-2 border-black dark:border-[#FFF7E8] font-black ${statusColor[m.status.toLowerCase()]??'bg-zinc-800 text-white'}`}>{m.status}</Badge></div>
                  <p className="mt-2 font-head text-sm font-black uppercase">{m.santri.nama} <span className="text-xs normal-case">{m.muhafidz?`· ${m.muhafidz.nama}`:''}</span></p>
                  <p className="flex items-center gap-1 text-xs font-bold"><BookOpen className="h-3 w-3"/> {m.jenis} · {m.surah} {m.ayat_mulai}-{m.ayat_selesai} {m.nilai!==null&&<span className="ml-1 border-2 border-black dark:border-[#FFF7E8] bg-[#FFD600] px-1 py-0.5">Nilai {m.nilai}</span>}</p>
                  {m.catatan&&<p className="mt-2 border-l-[4px] border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 p-2 text-xs font-bold">{m.catatan}</p>}
                </div>
              ))}
            </div>
          )}
          {mutabaahs.last_page>1&&<div className="flex justify-between border-[3px] border-black dark:border-[#FFF7E8] bg-[#FFF7E8] dark:bg-zinc-900 p-2 text-xs font-black">Hal {mutabaahs.current_page}/{mutabaahs.last_page} · {mutabaahs.total}<div className="flex gap-1">{mutabaahs.links.map((l,i)=>!l.url?<span key={i} className="border-2 border-black dark:border-[#FFF7E8] px-3 py-1 opacity-40" dangerouslySetInnerHTML={{__html:l.label}}/>:<Link key={i} href={l.url} className={`border-[3px] border-black dark:border-[#FFF7E8] px-3 py-1 ${l.active?'bg-primary':'bg-white dark:bg-zinc-900'}`} dangerouslySetInnerHTML={{__html:l.label}}/>)}</div></div>}
        </>
      )}
      {tab==='mingguan' && (
        <>
          {mingguan.data.length===0?<Card className="border-[3px] border-dashed border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 p-8 text-center"><CalendarRange className="mx-auto h-8 w-8"/><p className="font-black uppercase">Belum ada mingguan</p></Card>:(
            <div className="grid gap-3 sm:grid-cols-2">
              {mingguan.data.map(w=>(
                <div key={w.week_start} className="border-[3px] border-black dark:border-[#FFF7E8] bg-[#FFF7E8] dark:bg-zinc-900 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                  <div className="flex justify-between"><span className="border-2 border-black dark:border-[#FFF7E8] bg-black px-2 py-1 text-xs font-black text-white">{w.label}</span><span className="border-2 border-black dark:border-[#FFF7E8] bg-[#FFD600] px-2 py-1 text-xs font-black">{w.total} · {w.unique_santri} santri</span></div>
                  <p className="mt-2 text-xs font-bold">{w.by_santri.slice(0,4).map(b=>`${b.santri}(${b.count})`).join(', ')}</p>
                  <ul className="mt-2 divide-y border-2 border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 text-xs font-bold">{w.items.map(it=><li key={it.id} className="flex justify-between px-2 py-1"><span>{formatTanggal(it.tanggal)} · {it.santri?.nama??'-'}</span><Badge className="text-[10px]">{it.status}</Badge></li>)}</ul>
                </div>
              ))}
            </div>
          )}
          {mingguan.last_page>1&&<div className="flex justify-between border-[3px] border-black dark:border-[#FFF7E8] bg-[#FFF7E8] dark:bg-zinc-900 p-2 text-xs font-black">Hal {mingguan.current_page}/{mingguan.last_page}<div className="flex gap-1">{mingguan.links.map((l,i)=>!l.url?<span key={i} className="border-2 border-black dark:border-[#FFF7E8] px-3 py-1 opacity-40" dangerouslySetInnerHTML={{__html:l.label}}/>:<Link key={i} href={l.url} className={`border-[3px] border-black dark:border-[#FFF7E8] px-3 py-1 ${l.active?'bg-primary':'bg-white dark:bg-zinc-900'}`} dangerouslySetInnerHTML={{__html:l.label}}/>)}</div></div>}
        </>
      )}
      {tab==='bulanan' && (
        <>
          {bulanan.data.length===0?<Card className="border-[3px] border-dashed border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 p-8 text-center"><CalendarDays className="mx-auto h-8 w-8"/><p className="font-black uppercase">Belum ada bulanan</p></Card>:(
            <div className="grid gap-3 sm:grid-cols-2">
              {bulanan.data.map(b=>(
                <div key={b.id} className="border-[3px] border-black dark:border-[#FFF7E8] bg-[#FFF7E8] dark:bg-zinc-900 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                  <div className="flex justify-between"><span className="border-2 border-black dark:border-[#FFF7E8] bg-black px-2 py-1 text-xs font-black text-white">{bulanNama[b.bulan]} {b.tahun}</span><span className="border-2 border-black dark:border-[#FFF7E8] bg-[#FF90E8] px-2 py-1 text-xs font-black">{b.santri.nama}</span></div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-bold"><span className="border-2 border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 px-2 py-1">Awal {b.halaman_awal_bulan??'-'}</span><span className="border-2 border-black dark:border-[#FFF7E8] bg-[#FFD600] px-2 py-1">Kumulatif {b.halaman_kumulatif??'-'}</span></div>
                  <div className="mt-2 grid grid-cols-5 gap-1 text-center text-xs font-black">{[b.tasmi_pekan_1,b.tasmi_pekan_2,b.tasmi_pekan_3,b.tasmi_pekan_4,b.tasmi_pekan_5].map((v,i)=><span key={i} className="border-2 border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 py-1">P{i+1}<br/>{v??'-'}</span>)}</div>
                  <p className="mt-2 border-2 border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 px-2 py-1 text-xs font-bold">Ujian {b.ujian_bulanan??'-'} · Juz {b.juz_dihafal??'-'}</p>
                </div>
              ))}
            </div>
          )}
          {bulanan.last_page>1&&<div className="flex justify-between border-[3px] border-black dark:border-[#FFF7E8] bg-[#FFF7E8] dark:bg-zinc-900 p-2 text-xs font-black">Hal {bulanan.current_page}/{bulanan.last_page}<div className="flex gap-1">{bulanan.links.map((l,i)=>!l.url?<span key={i} className="border-2 border-black dark:border-[#FFF7E8] px-3 py-1 opacity-40" dangerouslySetInnerHTML={{__html:l.label}}/>:<Link key={i} href={l.url} className={`border-[3px] border-black dark:border-[#FFF7E8] px-3 py-1 ${l.active?'bg-primary':'bg-white dark:bg-zinc-900'}`} dangerouslySetInnerHTML={{__html:l.label}}/>)}</div></div>}
        </>
      )}
      {tab==='rekap' && (
        <div className="space-y-4">
          <Card className="overflow-hidden bg-[#FFE7A3] dark:bg-zinc-900">
            <CardHeader className="bg-primary"><CardTitle className="font-head font-black uppercase">Ringkasan per Halaqah — {bulanNama[rekap.bulan]} {rekap.tahun}</CardTitle><CardDescription className="font-bold text-black">Rata-rata kumulatif, juz, tasmi & ujian per kelompok. Tahun aktif {rekap.tahun}.</CardDescription></CardHeader>
            <CardContent className="bg-[#FFF7E8] dark:bg-zinc-900 pt-6"><DataTable columns={rekapColumns} data={rekap.rows} perPage={5} emptyMessage="Belum ada data rekap."/></CardContent>
          </Card>
          <Card className="overflow-hidden bg-[#5CE1E6]">
            <CardHeader className="bg-black text-[#FFF7E8]"><CardTitle className="font-head font-black uppercase">Distribusi Kategori Juz</CardTitle><CardDescription className="font-bold text-[#FFF7E8]/80">Jumlah santri per kategori hafalan (ikhwan/akhwat).</CardDescription></CardHeader>
            <CardContent className="bg-[#FFF7E8] dark:bg-zinc-900 pt-6"><DataTable columns={distribusiColumns} data={rekap.distribusi} perPage={5} emptyMessage="Belum ada distribusi."/></CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
AdminMutabaahHistory.layout={ breadcrumbs:[{title:'Mutabaah', href: history()}] };
