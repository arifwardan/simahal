import { Head, Link, usePage } from '@inertiajs/react';
import { BarChart3, Bell, BookOpen, GraduationCap, HeartHandshake, ShieldCheck, Sparkles, Target, User } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { dashboard, login } from '@/routes';
type Feature = { icon: React.ReactNode; title: string; description: string };
const roles = [
  { icon: <ShieldCheck className="size-5" />, name: 'Admin', description: 'Mengelola ekosistem halaqah dan seluruh data akademik.', color: 'bg-[#FFD600]' },
  { icon: <GraduationCap className="size-5" />, name: 'Muhafidz', description: 'Mencatat mutabaah dan membimbing santri langsung.', color: 'bg-[#5CE1E6]' },
  { icon: <User className="size-5" />, name: 'Santri', description: 'Memahami perkembangan hafalan dan target pribadi.', color: 'bg-[#FF90E8]' },
  { icon: <HeartHandshake className="size-5" />, name: 'Orang Tua', description: 'Memantau hafalan anak dengan tenang & aman.', color: 'bg-[#22c55e]' },
];
const journey = [
  { label: 'Target', description: 'Tujuan hafalan' },
  { label: 'Hafalan', description: 'Ziyadah' },
  { label: 'Mutabaah', description: 'Setoran harian' },
  { label: 'Evaluasi', description: 'Nilai & status' },
  { label: 'Progress', description: 'Perkembangan' },
  { label: 'Insight', description: 'Pemahaman' },
];
const features: Feature[] = [
  { icon: <BookOpen className="size-5" />, title: 'Mutabaah Terstruktur', description: 'Catat ziyadah & murajaah cepat konsisten.' },
  { icon: <Target className="size-5" />, title: 'Target Hafalan', description: 'Target harian, mingguan, bulanan hingga juz (max 30).' },
  { icon: <BarChart3 className="size-5" />, title: 'Progress Real-Time', description: 'Hitung otomatis dari data nyata, bukan asumsi.' },
  { icon: <HeartHandshake className="size-5" />, title: 'Portal Orang Tua', description: 'Pantau anak aman & terarah.' },
  { icon: <ShieldCheck className="size-5" />, title: 'Evaluasi Bermakna', description: 'Nilai 1-100 flag A-E + catatan.' },
  { icon: <Bell className="size-5" />, title: 'Notifikasi Cerdas', description: 'Kabar penting tepat waktu.' },
];
export default function Welcome() {
  const { auth } = usePage().props;
  return (
    <>
      <Head title="SIMAHAL — Retro Halaqah" />
      <div className="min-h-screen bg-[#FFF7E8] text-black antialiased selection:bg-black selection:text-[#FFF7E8]">
        <header className="sticky top-0 z-40 border-b-[3px] border-black bg-[#FFF7E8]">
          <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center border-[3px] border-black bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"><AppLogoIcon className="size-5 fill-white" /></span>
              <span className="font-head text-lg font-black uppercase tracking-tight">SIMAHAL</span>
              <span className="hidden rounded-full border-2 border-black bg-[#FFD600] px-2 py-0.5 text-[10px] font-black uppercase sm:inline">Retro</span>
            </Link>
            <div className="hidden items-center gap-1 text-xs font-black uppercase md:flex">
              <a href="#tentang" className="rounded-none border-2 border-transparent px-3 py-1 hover:border-black hover:bg-black hover:text-white">Ekosistem</a>
              <a href="#alur" className="rounded-none border-2 border-transparent px-3 py-1 hover:border-black hover:bg-black hover:text-white">Alur</a>
              <a href="#fitur" className="rounded-none border-2 border-transparent px-3 py-1 hover:border-black hover:bg-black hover:text-white">Fitur</a>
            </div>
            <div className="flex items-center gap-2">
              {auth.user ? <Link href={dashboard()} className="inline-flex h-9 cursor-pointer items-center border-[3px] border-black bg-black px-4 text-xs font-black uppercase text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Dashboard</Link> : <Link href={login()} className="inline-flex h-9 cursor-pointer items-center border-[3px] border-black bg-[#FF3B30] px-4 text-xs font-black uppercase text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]">Masuk</Link>}
            </div>
          </nav>
        </header>

        <section className="relative overflow-hidden border-b-[3px] border-black">
          <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_12px,rgba(0,0,0,0.03)_12px,rgba(0,0,0,0.03)_13px)]" />
          <div className="relative mx-auto max-w-6xl px-4 py-12 md:py-16">
            <div className="grid items-center gap-8 lg:grid-cols-2">
              <div>
                <div className="inline-flex items-center gap-2 border-[3px] border-black bg-black px-3 py-1 text-xs font-black uppercase text-[#FFF7E8] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"><span className="h-2 w-2 rounded-full bg-[#FFD600] animate-pulse" /> PondokIT · Retro Halaqah</div>
                <h1 className="mt-4 font-head text-4xl font-black uppercase leading-[0.9] tracking-tight md:text-5xl">Menjaga hafalan, <span className="inline-block rotate-1 border-[3px] border-black bg-[#FFD600] px-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">terstruktur</span> & <span className="inline-block -rotate-1 border-[3px] border-black bg-[#5CE1E6] px-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">bermakna</span>.</h1>
                <p className="mt-4 max-w-lg border-l-[4px] border-black bg-white p-3 text-sm font-bold leading-relaxed">SIMAHAL menghubungkan Admin, Muhafidz, Santri, Orang Tua — mutabaah, target juz (1-30), nilai 1-100 flag A-E dalam tema brutal warm.</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  {auth.user ? <Link href={dashboard()} className="inline-flex h-11 cursor-pointer items-center border-[3px] border-black bg-black px-6 text-sm font-black uppercase text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">Buka Dashboard →</Link> : <Link href={login()} className="inline-flex h-11 cursor-pointer items-center border-[3px] border-black bg-[#FF3B30] px-6 text-sm font-black uppercase text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">Masuk →</Link>}
                </div>
                <div className="mt-6 flex items-center gap-2 text-xs font-black uppercase"><span className="border-2 border-black bg-white px-2 py-1">1-30 Juz</span><span className="border-2 border-black bg-[#FFD600] px-2 py-1">1-100 Nilai</span><span className="border-2 border-black bg-[#5CE1E6] px-2 py-1">A-E Flag</span></div>
              </div>
              <div className="relative mx-auto w-full max-w-md">
                <div className="rotate-1 border-[3px] border-black bg-white p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center justify-between border-b-[3px] border-black pb-3"><p className="font-head text-xs font-black uppercase">Mutabaah Terbaru</p><span className="border-2 border-black bg-[#22c55e] px-2 py-0.5 text-xs font-black text-white">Hari Ini</span></div>
                  <div className="mt-4 flex items-center gap-3 border-[3px] border-black bg-[#FFF7E8] p-3"><div className="flex size-10 items-center justify-center border-2 border-black bg-black text-white"><BookOpen className="size-5" /></div><div><p className="text-sm font-black">Ahmad Fauzan</p><p className="text-xs font-bold text-black/60">Al-Baqarah · 1–10 · Ziyadah</p></div><span className="ml-auto border-2 border-black bg-[#FFD600] px-2 py-1 text-xs font-black">90 A</span></div>
                  <div className="mt-3 grid grid-cols-2 gap-2"><div className="border-2 border-black bg-[#5CE1E6] p-2 text-center"><p className="text-xs font-black uppercase">Hafalan</p><p className="font-head text-lg font-black">16 Juz</p></div><div className="border-2 border-black bg-[#FF90E8] p-2 text-center"><p className="text-xs font-black uppercase">Target</p><p className="font-head text-lg font-black">20 Juz</p></div></div>
                  <div className="mt-3 h-3 border-[3px] border-black bg-white p-0.5"><div className="h-full bg-black" style={{ width: '80%' }} /></div>
                </div>
                <div className="absolute -right-2 -bottom-4 hidden rotate-2 border-[3px] border-black bg-[#FFD600] p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:block"><p className="text-xs font-black uppercase">Juz 16</p><p className="font-head text-xl font-black">Al-Kahfi</p></div>
              </div>
            </div>
          </div>
        </section>

        <section id="tentang" className="mx-auto max-w-6xl px-4 py-12">
          <div className="inline-flex items-center gap-2 border-[3px] border-black bg-black px-3 py-1 text-xs font-black uppercase text-white"><Sparkles className="h-4 w-4 text-[#FFD600]" /> Satu Ekosistem</div>
          <h2 className="mt-3 font-head text-3xl font-black uppercase">Terhubung untuk pembinaan</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {roles.map((r) => (
              <div key={r.name} className={`border-[3px] border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${r.color}`}>
                <div className="flex size-10 items-center justify-center border-[3px] border-black bg-black text-white">{r.icon}</div>
                <h3 className="mt-3 font-head font-black uppercase">{r.name}</h3><p className="mt-1 text-xs font-bold leading-relaxed">{r.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="alur" className="border-y-[3px] border-black bg-black py-12">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="font-head text-2xl font-black uppercase text-[#FFF7E8]">Dari target menuju insight</h2>
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
              {journey.map((s, i) => (
                <div key={s.label} className="border-[3px] border-white bg-[#FFF7E8] p-3 text-center shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
                  <p className="text-xs font-black">0{i + 1}</p><p className="font-head font-black uppercase">{s.label}</p><p className="text-xs font-bold text-black/60">{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="fitur" className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="font-head text-3xl font-black uppercase">Sederhana namun bermakna</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="border-[3px] border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#FFF7E8]">
                <div className="flex size-10 items-center justify-center border-[3px] border-black bg-black text-white">{f.icon}</div>
                <h3 className="mt-3 font-black uppercase">{f.title}</h3><p className="mt-1 text-xs font-bold text-black/60">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="border-[3px] border-black bg-black p-6 text-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="font-head text-2xl font-black uppercase text-[#FFF7E8] md:text-3xl">Jadikan hafalan lebih terstruktur</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm font-bold text-white/70">Kelola halaqah, catat mutabaah, pantau progres — retro, cepat, bermakna.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">{auth.user ? <Link href={dashboard()} className="inline-flex h-11 cursor-pointer items-center border-[3px] border-white bg-[#FFF7E8] px-6 text-sm font-black uppercase text-black">Buka Dashboard</Link> : <Link href={login()} className="inline-flex h-11 cursor-pointer items-center border-[3px] border-black bg-[#FFD600] px-6 text-sm font-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">Masuk</Link>}</div>
          </div>
        </section>

        <footer className="border-t-[3px] border-black bg-[#FFF7E8]"><div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-6 md:flex-row"><div className="flex items-center gap-2"><span className="flex size-8 items-center justify-center border-[3px] border-black bg-black"><AppLogoIcon className="size-4 fill-white" /></span><span className="font-head font-black uppercase">SIMAHAL</span></div><p className="text-xs font-bold">© {new Date().getFullYear()} PondokIT · Retro Halaqah</p></div></footer>
      </div>
    </>
  );
}
