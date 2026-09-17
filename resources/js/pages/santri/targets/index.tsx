import { Form } from '@inertiajs/react';
import { useState } from 'react';
import { Award, Edit3, Plus, Target, Trash2 } from 'lucide-react';
import TargetHafalanController from '@/actions/App/Http/Controllers/Santri/TargetHafalanController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import PageContainer from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { index } from '@/routes/santri/targets';

type TargetRow = { id:number; periode:string; target:number; progress:number; progress_percent:number; status:string; status_label:string };
type Props = { targets: TargetRow[]; statuses:{value:string;label:string}[] };

export default function SantriTargetsIndex({ targets, statuses }: Props){
    const [showCreate,setShowCreate]=useState(false);
    const [editing,setEditing]=useState<TargetRow|null>(null);
    return (
        <PageContainer className="space-y-4">
            <Heading title="Target Hafalan Saya" description="Buat dan kelola target hafalanmu sendiri — maksimal 30 Juz."/>
            <div className="grid gap-4 sm:grid-cols-2">
                <Card className="border-[3px] border-black dark:border-[#FFF7E8] bg-[#FFD600] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"><CardHeader className="bg-black py-2"><CardTitle className="flex items-center gap-2 text-xs font-black uppercase text-white"><Target className="h-4 w-4"/> Total Target</CardTitle></CardHeader><CardContent className="bg-[#FFF7E8] dark:bg-zinc-900 pt-4"><p className="font-head text-3xl font-black">{targets.length}</p></CardContent></Card>
                <Card className="border-[3px] border-black dark:border-[#FFF7E8] bg-[#5CE1E6] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"><CardHeader className="bg-black py-2"><CardTitle className="flex items-center gap-2 text-xs font-black uppercase text-white"><Award className="h-4 w-4"/> Progress Rata</CardTitle></CardHeader><CardContent className="bg-[#FFF7E8] dark:bg-zinc-900 pt-4"><p className="font-head text-3xl font-black">{targets.length? Math.round(targets.reduce((a,t)=>a+t.progress_percent,0)/targets.length):0}%</p></CardContent></Card>
            </div>
            <Card className="overflow-hidden border-[3px] border-black dark:border-[#FFF7E8] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                <CardHeader className="flex flex-row items-center justify-between bg-black py-3"><CardTitle className="font-head font-black uppercase text-white">Target Saya</CardTitle>
                    <Dialog open={showCreate} onOpenChange={setShowCreate}><DialogTrigger asChild><Button className="cursor-pointer border-2 border-white bg-[#FFD600] font-black text-black"><Plus className="h-4 w-4"/> Tambah Target</Button></DialogTrigger>
                    <DialogContent><DialogHeader><DialogTitle>Tambah Target</DialogTitle><DialogDescription>Periode mis. 2026-2027, target 1-30 Juz.</DialogDescription></DialogHeader>
                        <Form {...TargetHafalanController.store.form()} onSuccess={()=>setShowCreate(false)} className="space-y-4">
                            {({errors}:any)=><>
                                <div className="grid gap-2"><Label>Periode</Label><Input name="periode" placeholder="2026-2027" required/><InputError message={errors.periode}/></div>
                                <div className="grid gap-2"><Label>Target (Juz)</Label><Input name="target" type="number" min={1} max={30} required/><InputError message={errors.target}/><p className="text-xs font-bold opacity-60">Maks 30 Juz</p></div>
                                <div className="grid gap-2"><Label>Status</Label><Select name="status" defaultValue="berlangsung"><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{statuses.map(s=><SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select><InputError message={errors.status}/></div>
                                <Button type="submit" className="w-full">Simpan Target</Button>
                            </>}
                        </Form>
                    </DialogContent></Dialog>
                </CardHeader>
                <CardContent className="bg-[#FFF7E8] dark:bg-zinc-900 p-4">
                    {targets.length===0? <p className="border-[3px] border-dashed border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 p-8 text-center font-black">Belum ada target — tambah sekarang!</p> :
                    <div className="grid gap-3 sm:grid-cols-2">
                        {targets.map(t=>(
                            <div key={t.id} className="border-[3px] border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
                                <div className="flex justify-between"><p className="text-xs font-black uppercase">Periode {t.periode}</p><span className="border-2 border-black dark:border-[#FFF7E8] bg-[#FFD600] px-2 py-0.5 text-xs font-black">{t.progress_percent}%</span></div>
                                <p className="mt-2 text-sm font-black">{(t.progress/20).toFixed(1)}/{t.target} Juz · {t.progress}/{t.target*20} hal</p>
                                <div className="mt-2 h-3 border-2 border-black dark:border-[#FFF7E8] bg-[#FFF7E8] dark:bg-zinc-900"><div className="h-full bg-black" style={{width:`${t.progress_percent}%`}}/></div>
                                <p className="mt-1 text-xs font-bold">{t.status_label}</p>
                                <div className="mt-3 flex gap-2">
                                    <Button variant="outline" size="sm" onClick={()=>setEditing(t)} className="cursor-pointer border-2 border-black dark:border-[#FFF7E8] font-black"><Edit3 className="h-3 w-3"/> Edit</Button>
                                    <Form {...TargetHafalanController.destroy.form({targetHafalan:t.id})}><Button type="submit" size="sm" className="cursor-pointer border-2 border-black dark:border-[#FFF7E8] bg-[#FF3B30] font-black text-white"><Trash2 className="h-3 w-3"/> Hapus</Button></Form>
                                </div>
                            </div>
                        ))}
                    </div>}
                </CardContent>
            </Card>
            <Dialog open={!!editing} onOpenChange={o=>!o&&setEditing(null)}><DialogContent><DialogHeader><DialogTitle>Edit Target</DialogTitle></DialogHeader>
                {editing && <Form {...TargetHafalanController.update.form({targetHafalan:editing.id})} onSuccess={()=>setEditing(null)} className="space-y-4">
                    {({errors}:any)=><>
                        <div className="grid gap-2"><Label>Periode</Label><Input name="periode" defaultValue={editing.periode} required/><InputError message={errors.periode}/></div>
                        <div className="grid gap-2"><Label>Target (Juz)</Label><Input name="target" type="number" min={1} max={30} defaultValue={editing.target} required/><InputError message={errors.target}/></div>
                        <div className="grid gap-2"><Label>Status</Label><Select name="status" defaultValue={editing.status}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{statuses.map(s=><SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
                        <Button type="submit" className="w-full">Simpan Perubahan</Button>
                    </>}
                </Form>}
            </DialogContent></Dialog>
        </PageContainer>
    );
}
SantriTargetsIndex.layout={breadcrumbs:[{title:'Target Hafalan', href:index()}]};
