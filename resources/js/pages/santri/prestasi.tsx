import { Head } from '@inertiajs/react';
import { Award, Crown, Download, Share2, Star, Trophy } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import PageContainer from '@/components/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
    santri:{id:number;nama:string;nis:string|null};
    progress:{target:number;progress:number;percent:number;status:string;label:string;periode:string|null}|null;
    recentBulanan:{tahun:number;bulan:number;halaman_kumulatif:number|null;tambah_halaman:number;tambah_juz:number;total_juz:number;kategori:string|null;keterangan:string;rata_tasmi:number|null;rata_ujian:number|null}|null;
    historyBulanan:{id:number;tahun:number;bulan:number;halaman_kumulatif:number|null}[];
    rank:number|null; totalSantri:number;
    halaqahs:{id:number;nama:string}[];
};
const bulanNama=['','Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const bulanFull=['','Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

function buildCanvas(p:Props):HTMLCanvasElement{
    const W=1080,H=1350, c=p, canvas=document.createElement('canvas'); canvas.width=W; canvas.height=H;
    const ctx=canvas.getContext('2d')!; ctx.fillStyle='#FFFEF2'; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='#000'; ctx.lineWidth=10; ctx.strokeRect(6,6,W-12,H-12);
    const isBerprestasi=c.recentBulanan?.keterangan==='Berprestasi (Hadiah)'; const isTop3=c.rank!==null&&c.rank<=3;
    const headerColor=isTop3?'#FFD600':isBerprestasi?'#FF90E8':'#5CE1E6';
    ctx.fillStyle=headerColor; ctx.fillRect(10,10,W-20,260); ctx.fillStyle='#000'; ctx.fillRect(10,265,W-20,6);
    ctx.fillStyle='#000'; ctx.fillRect(40,36,220,42); ctx.fillStyle='#FFF7E8'; ctx.font='900 26px sans-serif'; ctx.fillText('SIMAHAL',60,65);
    ctx.fillStyle='#000'; ctx.font='900 18px sans-serif'; ctx.fillText('PONDOKIT',290,62);
    if(isBerprestasi){ ctx.fillStyle='#000'; ctx.fillRect(W-340,36,300,44); ctx.fillStyle='#FFD600'; ctx.font='900 22px sans-serif'; ctx.fillText('★ BERPRESTASI',W-320,66);} else if(isTop3){ ctx.fillStyle='#FF3B30'; ctx.fillRect(W-260,36,220,44); ctx.fillStyle='#FFF'; ctx.font='900 22px sans-serif'; ctx.fillText(`TOP #${c.rank}`,W-230,66);}
    ctx.fillStyle='#000'; ctx.font='900 54px sans-serif'; ctx.fillText('PRESTASIKU',40,150); ctx.font='700 22px sans-serif'; ctx.fillText('Sertifikat Kebanggaan Hafalan',40,185);
    ctx.fillStyle='#FFF'; ctx.strokeStyle='#000'; ctx.lineWidth=5; ctx.fillRect(40,300,W-80,170); ctx.strokeRect(40,300,W-80,170);
    ctx.fillStyle='#000'; ctx.font='900 48px sans-serif'; ctx.fillText((c.santri.nama.slice(0,22).toUpperCase()),70,360);
    ctx.font='700 18px sans-serif'; ctx.fillStyle='#000000AA'; ctx.fillText(`${c.santri.nis ?? '-'} • ${c.halaqahs[0]?.nama ?? '-'}`,70,392);
    if(c.rank) { ctx.font='900 18px sans-serif'; ctx.fillStyle='#000'; ctx.fillText(`Peringkat #${c.rank} dari ${c.totalSantri}`,70,430); }
    const py=500; ctx.fillStyle='#000'; ctx.fillRect(40,py,W-80,150); ctx.fillStyle='#FFF'; ctx.fillRect(46,py+6,W-92,138);
    if(c.progress){ ctx.fillStyle='#000'; ctx.font='900 20px sans-serif'; ctx.fillText(`${c.progress.periode ?? '-'}`,70,py+42); ctx.font='900 32px sans-serif'; ctx.textAlign='right'; ctx.fillText(`${c.progress.percent}%`,W-70,py+48); ctx.textAlign='left'; const barW=W-140; ctx.fillStyle='#FFF'; ctx.strokeStyle='#000'; ctx.lineWidth=4; ctx.fillRect(70,py+60,barW,28); ctx.strokeRect(70,py+60,barW,28); ctx.fillStyle='#000'; ctx.fillRect(74,py+64,barW-8*(Math.min(100,c.progress.percent)/100),20); ctx.font='700 14px sans-serif'; ctx.fillText(`${(c.progress.progress/20).toFixed(1)}/${c.progress.target} Juz • ${c.progress.progress}/${c.progress.target*20} hal`,70,py+118); } else { ctx.fillStyle='#888'; ctx.font='700 18px sans-serif'; ctx.fillText('Belum ada target',70,py+80); }
    const by=690; ctx.fillStyle='#FFFEF2'; ctx.strokeStyle='#000'; ctx.lineWidth=4; ctx.fillRect(40,by,W-80,280); ctx.strokeRect(40,by,W-80,280);
    if(c.recentBulanan){ ctx.fillStyle='#000'; ctx.font='900 18px sans-serif'; ctx.fillText(`${bulanFull[c.recentBulanan.bulan]} ${c.recentBulanan.tahun} • ${c.recentBulanan.kategori ?? '-'}`,70,by+38); const bw=(W-120)/3; const boxes=[{label:'TAMBAH',val:`${c.recentBulanan.tambah_juz} JUZ`},{label:'TOTAL',val:`${c.recentBulanan.total_juz} JUZ`},{label:c.recentBulanan.keterangan.slice(0,12),val:isBerprestasi?'★':''}]; boxes.forEach((b,i)=>{const x=60+i*(bw+10); ctx.fillStyle=(i===2&&isBerprestasi)?'#10B981':i===1?'#000':'#FFF'; ctx.strokeStyle='#000'; ctx.lineWidth=3; ctx.fillRect(x,by+55,bw,90); ctx.strokeRect(x,by+55,bw,90); ctx.fillStyle=i===1?'#FFF':'#000'; ctx.font='900 13px sans-serif'; ctx.fillText(b.label,x+12,by+76); ctx.font='900 20px sans-serif'; ctx.fillText(b.val,x+12,by+106);}); ctx.font='700 14px sans-serif'; ctx.fillStyle='#000'; ctx.fillText(`Tasmi ${c.recentBulanan.rata_tasmi ?? '-'} • Ujian ${c.recentBulanan.rata_ujian ?? '-'}`,70,by+180); c.historyBulanan.slice(0,6).forEach((h,i)=>{const x=70+i*155; ctx.fillStyle='#FFF'; ctx.strokeStyle='#000'; ctx.lineWidth=2; ctx.fillRect(x,by+228,140,36); ctx.strokeRect(x,by+228,140,36); ctx.fillStyle='#000'; ctx.font='900 11px sans-serif'; ctx.fillText(`${bulanNama[h.bulan]} ${String(h.tahun).slice(2)}`,x+10,by+242); ctx.font='700 11px sans-serif'; ctx.fillText(`${h.halaman_kumulatif ?? '-'} hal`,x+10,by+258);}); } else { ctx.fillStyle='#888'; ctx.font='700 16px sans-serif'; ctx.fillText('Belum ada rekap bulanan',70,by+80); }
    ctx.fillStyle='#000'; ctx.font='900 16px sans-serif'; ctx.textAlign='center'; ctx.fillText('SIMAHAL • PondokIT • #BanggaHafalan',W/2,H-60); ctx.textAlign='left'; return canvas;
}

export default function SantriPrestasi(props:Props){
    const [busy,setBusy]=useState(false);
    const handle=(mode:'share'|'download')=>async()=>{
        setBusy(true);
        try{
            const canvas=buildCanvas(props);
            const blob:Blob = await new Promise(r=>canvas.toBlob(b=>r(b!),'image/png',1)!);
            const file=new File([blob], `prestasi-${props.santri.nama.replace(/\s+/g,'-')}.png`,{type:'image/png'});
            if(mode==='share' && (navigator as any).canShare?.({files:[file]})){ await (navigator as any).share({files:[file], title:`Prestasi ${props.santri.nama}`}); }
            else { const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=file.name; a.click(); URL.revokeObjectURL(url); if(mode==='share'){ await navigator.clipboard.writeText(`Prestasi ${props.santri.nama} — ${props.progress ? props.progress.percent+'%' : ''}`); }}
        } finally{ setBusy(false); }
    };
    const isBerprestasi=props.recentBulanan?.keterangan==='Berprestasi (Hadiah)';
    const isTop3=props.rank!==null && props.rank<=3;
    return (
        <div className="space-y-6 p-4 sm:p-6">
            <Head title="Prestasiku"/>
            <div className="flex items-center justify-between">
                <div><h1 className="font-head text-2xl font-black uppercase">Prestasiku</h1><p className="text-sm font-bold opacity-60">Bagikan sertifikat kebanggaanmu</p></div>
                <Trophy className="h-8 w-8"/>
            </div>
            <Card className="overflow-hidden border-[3px] border-black dark:border-[#FFF7E8] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
                <div className={`border-b-[3px] border-black dark:border-[#FFF7E8] p-5 ${isTop3?'bg-[#FFD600]':isBerprestasi?'bg-[#FF90E8]':'bg-[#5CE1E6]'}`}>
                    <div className="flex items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center border-[3px] border-black dark:border-[#FFF7E8] bg-black text-xl font-black text-white">{props.santri.nama[0]}</div>
                        <div><p className="font-head font-black uppercase">{props.santri.nama}</p><p className="text-xs font-bold opacity-60">{props.santri.nis} • {props.halaqahs[0]?.nama ?? '-'} {props.rank && `• #${props.rank}/${props.totalSantri}`}</p></div>
                        {isTop3 && <Badge className="ml-auto border-2 border-black dark:border-[#FFF7E8] bg-[#FF3B30] text-white"><Crown className="h-3 w-3"/> TOP {props.rank}</Badge>}
                        {isBerprestasi && !isTop3 && <Badge className="ml-auto border-2 border-black dark:border-[#FFF7E8] bg-black text-[#FFD600]">★ Berprestasi</Badge>}
                    </div>
                </div>
                <CardContent className="space-y-4 bg-[#FFFEF2] dark:bg-zinc-900 p-5">
                    {props.progress ? (
                        <div className="border-[3px] border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 p-4">
                            <div className="flex justify-between text-xs font-black uppercase"><span>{props.progress.periode}</span><span className="bg-black px-2 py-0.5 text-white">{props.progress.percent}%</span></div>
                            <div className="mt-2 h-3 border-[3px] border-black dark:border-[#FFF7E8] bg-[#FFF7E8] dark:bg-zinc-900 p-1"><div className="h-full bg-black" style={{width:`${props.progress.percent}%`}}/></div>
                            <p className="mt-2 text-xs font-black">{(props.progress.progress/20).toFixed(1)}/{props.progress.target} Juz · {props.progress.progress}/{props.progress.target*20} hal · {props.progress.label}</p>
                        </div>
                    ): <p className="border-2 border-dashed border-black dark:border-[#FFF7E8] p-4 text-center font-bold">Belum ada target — buat di menu Target Hafalan</p>}
                    {props.recentBulanan ? (
                        <div className="border-[3px] border-black dark:border-[#FFF7E8] bg-[#FFF7E8] dark:bg-zinc-900 p-4">
                            <p className="flex items-center gap-1 text-xs font-black uppercase"><Award className="h-3 w-3"/>{bulanNama[props.recentBulanan.bulan]} {props.recentBulanan.tahun} • {props.recentBulanan.kategori}</p>
                            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                                <div className="border-2 border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 py-2"><p className="text-xs font-black">TAMBAH</p><p className="font-head font-black">{props.recentBulanan.tambah_juz}</p></div>
                                <div className="border-2 border-black dark:border-[#FFF7E8] bg-black py-2 text-white"><p className="text-xs font-black">TOTAL</p><p className="font-head font-black">{props.recentBulanan.total_juz}</p></div>
                                <div className={`border-2 border-black dark:border-[#FFF7E8] py-2 ${isBerprestasi?'bg-emerald-400':'bg-[#FFD600]'}`}><p className="text-xs font-black">{props.recentBulanan.keterangan}</p></div>
                            </div>
                        </div>
                   ): <p className="border-2 border-dashed border-black dark:border-[#FFF7E8] p-4 text-center text-xs font-bold">Belum ada rekap bulanan</p>}
                    <div className="grid grid-cols-6 gap-1">
                        {props.historyBulanan.slice(0,6).map(h=>(
                            <div key={h.id} className="border-2 border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 py-1 text-center text-[10px] font-black">{bulanNama[h.bulan]}<br/>{h.halaman_kumulatif ?? '-'}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Button onClick={handle('share')} disabled={busy} className="cursor-pointer border-[3px] border-black dark:border-[#FFF7E8] bg-black font-black text-white"><Share2 className="h-4 w-4"/> Bagikan Gambar</Button>
                        <Button variant="outline" onClick={handle('download')} disabled={busy} className="cursor-pointer border-[3px] border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 font-black"><Download className="h-4 w-4"/> Unduh</Button>
                    </div>
                    {isBerprestasi && <p className="text-center text-xs font-black flex justify-center gap-1"><Star className="h-3 w-3"/> Layak Hadiah — MasyaAllah!</p>}
                </CardContent>
            </Card>
        </div>
    );
}
