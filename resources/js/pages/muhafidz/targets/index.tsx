import { Form } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { Award, BookOpen, GraduationCap, Plus, Target, Trash2, Edit3 } from 'lucide-react';
import TargetHafalanController from '@/actions/App/Http/Controllers/Muhafidz/TargetHafalanController';
import TargetForm from '@/components/forms/TargetForm';
import type { TargetRow } from '@/components/forms/TargetForm';
import Heading from '@/components/heading';
import PageContainer from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { index } from '@/routes/muhafidz/targets';
type Target = { id: number; periode: string; target: number; progress: number; progress_percent: number; status: string; status_label: string };
type SantriWithTargets = { id: number; nama: string; targets: Target[] };
type Option = { value: string; label: string };
type PageProps = { santris: SantriWithTargets[]; statuses: Option[] };
export default function MuhafidzTargetsIndex({ santris, statuses }: PageProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<TargetRow | null>(null);
  const stats = useMemo(() => {
    const all = santris.flatMap((s) => s.targets);
    const avg = all.length ? Math.round(all.reduce((a, t) => a + t.progress_percent, 0) / all.length) : 0;
    return { total: all.length, santri: santris.length, avg };
  }, [santris]);
  return (
    <PageContainer className="space-y-4">
      <Heading title="Target Hafalan" description="Pantau dan kelola target hafalan santri halaqah Anda." />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-[3px] border-black dark:border-[#FFF7E8] bg-[#FFD600] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"><CardHeader className="bg-black py-2"><CardTitle className="flex items-center gap-2 text-xs font-black uppercase text-[#FFF7E8]"><Target className="h-4 w-4 text-[#FFD600]" /> Total Target</CardTitle></CardHeader><CardContent className="bg-[#FFF7E8] dark:bg-zinc-900 pt-4"><p className="font-head text-3xl font-black">{stats.total}</p><p className="text-xs font-bold text-black/60 dark:text-[#FFF7E8]/60">target aktif</p></CardContent></Card>
        <Card className="border-[3px] border-black dark:border-[#FFF7E8] bg-[#FFF7E8] dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"><CardHeader className="bg-[#5CE1E6] py-2"><CardTitle className="flex items-center gap-2 text-xs font-black uppercase text-black"><Award className="h-4 w-4" /> Rata Progress</CardTitle></CardHeader><CardContent className="pt-4"><p className="font-head text-3xl font-black">{stats.avg}%</p><div className="mt-2 h-2 border-2 border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900"><div className="h-full bg-black" style={{ width: `${stats.avg}%` }} /></div></CardContent></Card>
        <Card className="border-[3px] border-black dark:border-[#FFF7E8] bg-[#FF90E8] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"><CardHeader className="bg-black py-2"><CardTitle className="flex items-center gap-2 text-xs font-black uppercase text-white"><GraduationCap className="h-4 w-4" /> Santri</CardTitle></CardHeader><CardContent className="bg-[#FFF7E8] dark:bg-zinc-900 pt-4"><p className="font-head text-3xl font-black">{stats.santri}</p><p className="text-xs font-bold text-black/60 dark:text-[#FFF7E8]/60">santri di halaqah</p></CardContent></Card>
      </div>
      <Card className="overflow-hidden border-[3px] border-black dark:border-[#FFF7E8] bg-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
        <CardHeader className="flex flex-row items-center justify-between bg-black py-3"><CardTitle className="font-head font-black uppercase text-[#FFF7E8]">Progres Santri</CardTitle><Dialog open={showCreate} onOpenChange={setShowCreate}><DialogTrigger asChild><Button className="cursor-pointer border-[3px] border-white bg-[#FFD600] font-black text-black shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"><Plus className="h-4 w-4" /> Tambah Target</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Tambah Target</DialogTitle><DialogDescription>Tambahkan target hafalan baru.</DialogDescription></DialogHeader><TargetForm santris={santris} statuses={statuses} onSuccess={() => setShowCreate(false)} /></DialogContent></Dialog></CardHeader>
        <CardContent className="bg-[#FFF7E8] dark:bg-zinc-900 p-4">
          {santris.length === 0 ? (
            <div className="border-[3px] border-dashed border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 p-8 text-center"><BookOpen className="mx-auto h-8 w-8" /><p className="mt-2 font-black uppercase">Belum ada santri</p></div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {santris.map((santri, idx) => (
                <div key={santri.id} className={`flex flex-col overflow-hidden border-[3px] border-black dark:border-[#FFF7E8] p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] ${idx % 3 === 0 ? 'bg-white dark:bg-zinc-900' : idx % 3 === 1 ? 'bg-[#FFD600]/40 dark:bg-[#FFD600]/15' : 'bg-[#5CE1E6]/30 dark:bg-[#5CE1E6]/15'}`}>
                  <div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center border-2 border-black dark:border-[#FFF7E8] bg-black text-xs font-black text-white">{santri.nama.slice(0, 2).toUpperCase()}</div><p className="font-head text-sm font-black uppercase">{santri.nama}</p><span className="ml-auto border-2 border-black dark:border-[#FFF7E8] bg-black px-2 py-1 text-xs font-black text-white">{santri.targets.length} target</span></div>
                  {santri.targets.length === 0 ? (
                    <p className="mt-3 border-2 border-dashed border-black dark:border-[#FFF7E8] bg-[#FFF7E8] dark:bg-zinc-900 p-3 text-center text-xs font-bold">Belum ada target.</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {santri.targets.map((target) => (
                        <li key={target.id} className="border-[3px] border-black dark:border-[#FFF7E8] bg-[#FFF7E8] dark:bg-zinc-900 p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                          <div className="flex items-center justify-between gap-2"><p className="text-xs font-black uppercase">Periode {target.periode} · {target.progress}/{target.target} juz</p><span className="border-2 border-black dark:border-[#FFF7E8] bg-[#FFD600] px-2 py-0.5 text-xs font-black text-black">{target.progress_percent}%</span></div>
                          <div className="mt-2 h-3 border-2 border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 p-0.5"><div className="h-full bg-black transition-all" style={{ width: `${target.progress_percent}%` }} /></div>
                          <div className="mt-2 flex items-center justify-between"><span className="border-2 border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 px-2 py-0.5 text-[10px] font-black uppercase">{target.status_label}</span><div className="flex gap-1"><Button variant="outline" size="sm" onClick={() => setEditing({ id: target.id, santri_id: santri.id, periode: target.periode, target: target.target, status: target.status })} className="h-7 cursor-pointer border-2 border-black dark:border-[#FFF7E8] px-2 text-xs font-black"><Edit3 className="h-3 w-3" /> Edit</Button><Form {...TargetHafalanController.destroy.form({ targetHafalan: target.id })}><Button type="submit" size="sm" variant="ghost" className="h-7 cursor-pointer border-2 border-black dark:border-[#FFF7E8] bg-[#FF3B30] px-2 text-xs font-black text-white"><Trash2 className="h-3 w-3" /> Hapus</Button></Form></div></div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}><DialogContent key={editing?.id}><DialogHeader><DialogTitle>Edit Target</DialogTitle><DialogDescription>Perbarui target hafalan.</DialogDescription></DialogHeader>{editing && <TargetForm nilaiAwal={editing} santris={santris} statuses={statuses} onSuccess={() => setEditing(null)} />}</DialogContent></Dialog>
    </PageContainer>
  );
}
MuhafidzTargetsIndex.layout = { breadcrumbs: [{ title: 'Target Hafalan', href: index() }] };
