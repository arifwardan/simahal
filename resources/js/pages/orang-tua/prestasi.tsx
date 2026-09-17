import { Head } from '@inertiajs/react';
import { Award, Crown, Download, Share2, Sparkles, Star } from 'lucide-react';
import { useRef, useState } from 'react';
import Heading from '@/components/heading';
import PageContainer from '@/components/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type Child = {
    id:number; nama:string; nis:string|null;
    progress:{ target:number; progress:number; percent:number; status:string; label:string; periode:string|null }|null;
    halaqahs:{ id:number; nama:string }[];
    recentBulanan:{ tahun:number; bulan:number; halaman_kumulatif:number|null; tambah_halaman:number; tambah_juz:number; total_juz:number; kategori:string|null; keterangan:string; rata_tasmi:number|null; rata_ujian:number|null }|null;
    historyBulanan:{ id:number; tahun:number; bulan:number; halaman_kumulatif:number|null }[];
    rank:number|null; totalSantri:number;
};
type Props = { children: Child[]; setting:{konversi_juz_halaman:number;ambang_hadiah_juz:number;tahun_aktif:number} };
const bulanNama=['','Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const bulanFull=['','Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

function buildCanvas(c: Child): HTMLCanvasElement {
    const W=1080, H=1350;
    const canvas=document.createElement('canvas');
    canvas.width=W; canvas.height=H;
    const ctx=canvas.getContext('2d')!;
    // bg
    ctx.fillStyle='#FFFEF2'; ctx.fillRect(0,0,W,H);
    // outer brutal border
    ctx.strokeStyle='#000'; ctx.lineWidth=10; ctx.strokeRect(6,6,W-12,H-12);
    ctx.fillStyle='#000'; ctx.fillRect(18, H-28, W-36, 10); // shadow bottom
    // header band
    const isBerprestasi=c.recentBulanan?.keterangan==='Berprestasi (Hadiah)';
    const isTop3=c.rank!==null && c.rank<=3;
    const headerColor=isTop3 ? '#FFD600' : isBerprestasi ? '#FF90E8' : '#5CE1E6';
    ctx.fillStyle=headerColor; ctx.fillRect(10,10,W-20,260);
    ctx.fillStyle='#000'; ctx.fillRect(10,265,W-20,6);
    // SIMAHAL pill top
    ctx.fillStyle='#000'; ctx.fillRect(40,36,220,42);
    ctx.fillStyle='#FFF7E8'; ctx.font='900 26px Inter, sans-serif'; ctx.fillText('SIMAHAL', 60, 65);
    ctx.fillStyle='#000'; ctx.font='900 18px Inter, sans-serif'; ctx.fillText('PONDOKIT', 290, 62);
    // badge top right
    if(isBerprestasi){
        ctx.fillStyle='#000'; ctx.fillRect(W-340,36,300,44);
        ctx.fillStyle='#FFD600'; ctx.font='900 22px Inter, sans-serif'; ctx.fillText('★ BERPRESTASI', W-320, 66);
    } else if(isTop3){
        ctx.fillStyle='#FF3B30'; ctx.fillRect(W-260,36,220,44);
        ctx.fillStyle='#FFF'; ctx.font='900 22px Inter, sans-serif'; ctx.fillText(`TOP #${c.rank}`, W-230, 66);
    }
    // title
    ctx.fillStyle='#000'; ctx.font='900 54px Inter, sans-serif'; ctx.fillText('PRESTASI ANANDA', 40, 150);
    ctx.font='700 22px Inter, sans-serif'; ctx.fillText('Sertifikat Kebanggaan Hafalan Qur\'an', 40, 185);
    // name card
    ctx.fillStyle='#FFF'; ctx.strokeStyle='#000'; ctx.lineWidth=5;
    // rounded-ish rect for name
    ctx.fillRect(40, 300, W-80, 170); ctx.strokeRect(40,300,W-80,170);
    ctx.fillStyle='#000'; ctx.font='900 56px Inter, sans-serif';
    // truncate name if long
    const nama = c.nama.length>22 ? c.nama.slice(0,22)+'…' : c.nama;
    ctx.fillText(nama.toUpperCase(), 70, 360);
    ctx.font='700 20px Inter, sans-serif'; ctx.fillStyle='#000000AA';
    ctx.fillText(`${c.nis ?? '-'}  •  ${c.halaqahs[0]?.nama ?? '—'}`, 70, 392);
    if(c.rank){ ctx.font='900 20px Inter, sans-serif'; ctx.fillStyle='#000'; ctx.fillText(`Peringkat #${c.rank} dari ${c.totalSantri} santri`, 70, 430); }
    // progress block
    const py=500;
    ctx.fillStyle='#000'; ctx.fillRect(40,py,W-80,150);
    ctx.fillStyle='#FFF'; ctx.fillRect(46,py+6,W-92,138);
    if(c.progress){
        ctx.fillStyle='#000'; ctx.font='900 22px Inter, sans-serif'; ctx.fillText(`${c.progress.periode ?? '-'}`, 70, py+42);
        ctx.fillStyle='#000'; ctx.font='900 36px Inter, sans-serif'; ctx.textAlign='right'; ctx.fillText(`${c.progress.percent}%`, W-70, py+48); ctx.textAlign='left';
        // bar
        ctx.fillStyle='#FFF'; ctx.strokeStyle='#000'; ctx.lineWidth=4; ctx.fillRect(70,py+60,W-140,28); ctx.strokeRect(70,py+60,W-140,28);
        ctx.fillStyle='#000'; ctx.fillRect(74,py+64,(W-148)*(Math.min(100,c.progress.percent)/100),20);
        ctx.font='700 16px Inter, sans-serif'; ctx.fillText(`${c.progress.progress}/${c.progress.target} juz  •  ${c.progress.label}`, 70, py+118);
    } else {
        ctx.fillStyle='#888'; ctx.font='700 20px Inter, sans-serif'; ctx.fillText('Belum ada target', 70, py+80);
    }
    // bulanan block
    const by=690;
    ctx.fillStyle='#FFFEF2'; ctx.strokeStyle='#000'; ctx.lineWidth=4; ctx.fillRect(40,by,W-80,280); ctx.strokeRect(40,by,W-80,280);
    if(c.recentBulanan){
        ctx.fillStyle='#000'; ctx.font='900 20px Inter, sans-serif'; ctx.fillText(`${bulanFull[c.recentBulanan.bulan]} ${c.recentBulanan.tahun}  •  ${c.recentBulanan.kategori ?? '-'}`, 70, by+38);
        // 3 boxes
        const bw=(W-120)/3;
        const boxes=[
            {label:'TAMBAH', val:`${c.recentBulanan.tambah_juz} JUZ`, sub:`${c.recentBulanan.tambah_halaman} hal`},
            {label:'TOTAL', val:`${c.recentBulanan.total_juz} JUZ`, sub:`${(c.recentBulanan.halaman_kumulatif ?? '-')} hal`},
            {label:c.recentBulanan.keterangan.slice(0,12), val: isBerprestasi ? '★' : '', sub:''},
        ];
        boxes.forEach((b,i)=>{
            const x=60+i*(bw+10);
            ctx.fillStyle=(i===2 && isBerprestasi) ? '#10B981' : i===1 ? '#000' : '#FFF';
            ctx.strokeStyle='#000'; ctx.lineWidth=3; ctx.fillRect(x,by+55,bw,90); ctx.strokeRect(x,by+55,bw,90);
            ctx.fillStyle=i===1 ? '#FFF' : '#000'; ctx.font='900 13px Inter, sans-serif'; ctx.fillText(b.label, x+12, by+76);
            ctx.font='900 22px Inter, sans-serif'; ctx.fillText(b.val, x+12, by+106);
            if(b.sub){ ctx.font='700 13px Inter, sans-serif'; ctx.fillText(b.sub, x+12, by+126); }
        });
        ctx.font='700 16px Inter, sans-serif'; ctx.fillStyle='#000';
        ctx.fillText(`Tasmi ${c.recentBulanan.rata_tasmi ?? '-'}   •   Ujian ${c.recentBulanan.rata_ujian ?? '-'}`, 70, by+180);
        // history dots
        ctx.font='900 12px Inter, sans-serif'; ctx.fillText('6 BULAN TERAKHIR', 70, by+215);
        c.historyBulanan.slice(0,6).forEach((h,i)=>{
            const x=70+i*155;
            ctx.fillStyle='#FFF'; ctx.strokeStyle='#000'; ctx.lineWidth=2; ctx.fillRect(x,by+228,140,36); ctx.strokeRect(x,by+228,140,36);
            ctx.fillStyle='#000'; ctx.font='900 12px Inter, sans-serif'; ctx.fillText(`${bulanNama[h.bulan]} ${String(h.tahun).slice(2)}`, x+10, by+242);
            ctx.font='700 12px Inter, sans-serif'; ctx.fillText(`${h.halaman_kumulatif ?? '-'} hal`, x+10, by+258);
        });
    } else {
        ctx.fillStyle='#888'; ctx.font='700 18px Inter, sans-serif'; ctx.fillText('Belum ada rekap bulanan', 70, by+80);
    }
    // footer
    ctx.fillStyle='#000'; ctx.font='900 18px Inter, sans-serif'; ctx.textAlign='center';
    ctx.fillText('SIMAHAL  •  PondokIT  •  #BanggaHafalan', W/2, H-60);
    ctx.font='700 14px Inter, sans-serif'; ctx.fillStyle='#00000088';
    ctx.fillText('Bagikan kebanggaan ananda — semoga menginspirasi', W/2, H-38);
    ctx.textAlign='left';
    return canvas;
}

export default function PrestasiAnanda({ children }: Props) {
    const [busy, setBusy] = useState<number|null>(null);
    const [done, setDone] = useState<number|null>(null);
    const handleShareImage = async (c: Child, mode:'share'|'download')=>{
        setBusy(c.id);
        try{
            const canvas=buildCanvas(c);
            const blob:Blob = await new Promise(res=> canvas.toBlob(b=>res(b!), 'image/png', 1)!);
            const file=new File([blob], `prestasi-${c.nama.replace(/\s+/g,'-')}.png`, {type:'image/png'});
            if(mode==='share' && navigator.canShare && navigator.canShare({files:[file]})){
                await navigator.share({files:[file], title:`Prestasi ${c.nama}`, text:`Alhamdulillah prestasi ${c.nama} — ${c.recentBulanan?.keterangan ?? ''}`});
            } else if(mode==='share' && (navigator as any).share){
                // fallback web share without files -> download + prompt
                const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=file.name; a.click(); URL.revokeObjectURL(url);
            } else {
                const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=file.name; a.click(); URL.revokeObjectURL(url);
            }
            setDone(c.id); setTimeout(()=>setDone(null),2000);
        } finally { setBusy(null); }
    };

    if(children.length===0) return <PageContainer><Heading title="Prestasi Ananda" description="Belum ada ananda terhubung"/><Card className="border-[3px] border-dashed border-black dark:border-[#FFF7E8] p-10 text-center"><p className="font-black uppercase">Hubungi admin</p></Card></PageContainer>;

    return (
        <PageContainer className="space-y-6">
            <Heading title="Prestasi Ananda" description="Sertifikat kebanggaan — bagikan sebagai gambar ke WA / IG."/>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
                {children.map((c,idx)=>{
                    const isBerprestasi=c.recentBulanan?.keterangan==='Berprestasi (Hadiah)';
                    const isTop3=c.rank!==null && c.rank<=3;
                    return (
                        <Card key={c.id} className="relative overflow-hidden border-[3px] border-black dark:border-[#FFF7E8] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
                            {/* header */}
                            <div className={`relative border-b-[3px] border-black dark:border-[#FFF7E8] p-5 ${isTop3?'bg-[#FFD600]':isBerprestasi?'bg-[#FF90E8]':'bg-[#5CE1E6]'}`}>
                                {isBerprestasi && <span className="absolute right-3 top-3 flex items-center gap-1 border-2 border-black dark:border-[#FFF7E8] bg-black px-2 py-1 text-xs font-black text-[#FFD600]"><Sparkles className="h-3 w-3"/> BERPRESTASI</span>}
                                {isTop3 && <span className="absolute left-3 top-3 flex items-center gap-1 border-2 border-black dark:border-[#FFF7E8] bg-[#FF3B30] px-2 py-1 text-xs font-black text-white"><Crown className="h-3 w-3"/> TOP #{c.rank}</span>}
                                <div className="mt-6 flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center border-[3px] border-black dark:border-[#FFF7E8] bg-black text-lg font-black text-white">{c.nama[0]}</div>
                                    <div className="min-w-0">
                                        <p className="font-head text-lg font-black uppercase leading-none">{c.nama}</p>
                                        <p className="text-xs font-bold opacity-60">{c.nis ?? '-'} • {c.halaqahs[0]?.nama ?? '—'} {c.rank ? `• #${c.rank}/${c.totalSantri}` : ''}</p>
                                    </div>
                                </div>
                            </div>
                            {/* body - certificate preview */}
                            <CardContent className="space-y-4 bg-[#FFFEF2] dark:bg-zinc-900 p-5">
                                {/* progress */}
                                {c.progress ? (
                                    <div className="border-[3px] border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 p-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black uppercase">{c.progress.periode ?? '-'}</span>
                                            <Badge className="border-2 border-black dark:border-[#FFF7E8] bg-black text-white">{c.progress.percent}%</Badge>
                                        </div>
                                        <div className="mt-2 h-3 w-full border-[3px] border-black dark:border-[#FFF7E8] bg-[#FFF7E8] dark:bg-zinc-900 p-1"><div className="h-full bg-black" style={{width:`${Math.min(100,c.progress.percent)}%`}}/></div>
                                        <p className="mt-2 flex justify-between text-xs font-black"><span>{c.progress.progress}/{c.progress.target} juz</span><span>{c.progress.label}</span></p>
                                    </div>
                                ) : <p className="border-2 border-dashed border-black dark:border-[#FFF7E8] p-4 text-center text-xs font-bold">Belum ada target</p>}

                                {/* bulanan */}
                                {c.recentBulanan ? (
                                    <div className="border-[3px] border-black dark:border-[#FFF7E8] bg-[#FFF7E8] dark:bg-zinc-900 p-4">
                                        <p className="flex items-center gap-1 text-xs font-black uppercase"><Award className="h-3 w-3"/>{bulanNama[c.recentBulanan.bulan]} {c.recentBulanan.tahun} • {c.recentBulanan.kategori ?? '-'}</p>
                                        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                                            <div className="border-2 border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 py-2"><p className="text-xs font-black">TAMBAH</p><p className="font-head text-lg font-black">{c.recentBulanan.tambah_juz}</p><p className="text-[10px] font-bold">juz • {c.recentBulanan.tambah_halaman} hal</p></div>
                                            <div className="border-2 border-black dark:border-[#FFF7E8] bg-black py-2 text-white"><p className="text-xs font-black">TOTAL</p><p className="font-head text-lg font-black">{c.recentBulanan.total_juz}</p><p className="text-[10px]">juz</p></div>
                                            <div className={`border-2 border-black dark:border-[#FFF7E8] py-2 ${isBerprestasi?'bg-emerald-400':'bg-[#FFD600]'}`}><p className="text-xs font-black leading-tight">{c.recentBulanan.keterangan}</p><p className="mt-1 text-[10px] font-bold">{isBerprestasi ? '★ Layak Hadiah' : ''}</p></div>
                                        </div>
                                        <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs font-bold">
                                            <span className="border-2 border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 py-1">Tasmi {c.recentBulanan.rata_tasmi ?? '-'}</span>
                                            <span className="border-2 border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 py-1">Ujian {c.recentBulanan.rata_ujian ?? '-'}</span>
                                        </div>
                                    </div>
                                ) : <p className="border-2 border-dashed border-black dark:border-[#FFF7E8] p-4 text-center text-xs font-bold">Belum ada rekap bulanan</p>}

                                <div className="grid grid-cols-6 gap-1">
                                    {c.historyBulanan.slice(0,6).map(h=>(
                                        <div key={h.id} className="border-2 border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 py-1 text-center text-[10px] font-black leading-tight">
                                            {bulanNama[h.bulan]}<br/>{h.halaman_kumulatif ?? '-'}
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <Button onClick={()=>handleShareImage(c,'share')} disabled={busy===c.id} className="cursor-pointer border-[3px] border-black dark:border-[#FFF7E8] bg-black font-black text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:bg-zinc-800">
                                        <Share2 className="h-4 w-4"/>{busy===c.id?'Membuat…': done===c.id ? 'Terkirim!' : 'Bagikan Gambar'}
                                    </Button>
                                    <Button variant="outline" onClick={()=>handleShareImage(c,'download')} disabled={busy===c.id} className="cursor-pointer border-[3px] border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
                                        <Download className="h-4 w-4"/> Unduh
                                    </Button>
                                </div>
                                {isTop3 && <p className="flex items-center justify-center gap-1 text-xs font-black text-[#FF3B30]"><Star className="h-3 w-3"/> Top {c.rank} Se-Pondok — MasyaAllah!</p>}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </PageContainer>
    );
}
