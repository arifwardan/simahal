import { Head, Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    Bell,
    BookOpen,
    GraduationCap,
    HeartHandshake,
    ShieldCheck,
    Target,
    User,
} from 'lucide-react';

import AppLogoIcon from '@/components/app-logo-icon';
import { dashboard, login, register } from '@/routes';

type Feature = {
    icon: React.ReactNode;
    title: string;
    description: string;
};

const roles = [
    {
        icon: <ShieldCheck className="size-5" />,
        name: 'Admin',
        description: 'Mengelola ekosistem halaqah dan seluruh data akademik.',
    },
    {
        icon: <GraduationCap className="size-5" />,
        name: 'Ustadz / Musyrif',
        description: 'Mencatat mutabaah dan membimbing santri secara langsung.',
    },
    {
        icon: <User className="size-5" />,
        name: 'Santri',
        description: 'Memahami perkembangan hafalan dan target pribadi.',
    },
    {
        icon: <HeartHandshake className="size-5" />,
        name: 'Orang Tua',
        description: 'Memantau perkembangan hafalan anak dengan tenang.',
    },
];

const journey = [
    { label: 'Target', description: 'Tujuan hafalan' },
    { label: 'Hafalan', description: 'Perjalanan ziyadah' },
    { label: 'Mutabaah', description: 'Setoran harian' },
    { label: 'Evaluasi', description: 'Nilai & status' },
    { label: 'Progress', description: 'Perkembangan' },
    { label: 'Insight', description: 'Pemahaman' },
];

const features: Feature[] = [
    {
        icon: <BookOpen className="size-5" />,
        title: 'Mutabaah Terstruktur',
        description: 'Catat ziyadah dan murajaah dengan alur yang cepat dan konsisten.',
    },
    {
        icon: <Target className="size-5" />,
        title: 'Target Hafalan',
        description: 'Tetapkan target harian, mingguan, bulanan, hingga periode akademik.',
    },
    {
        icon: <BarChart3 className="size-5" />,
        title: 'Progress Real-Time',
        description: 'Perkembangan dihitung dari data mutabaah yang nyata, bukan asumsi.',
    },
    {
        icon: <HeartHandshake className="size-5" />,
        title: 'Portal Orang Tua',
        description: 'Orang tua memantau perkembangan anak secara aman dan terarah.',
    },
    {
        icon: <ShieldCheck className="size-5" />,
        title: 'Evaluasi Bermakna',
        description: 'Nilai, status, dan catatan ustadz tersimpan dalam satu riwayat.',
    },
    {
        icon: <Bell className="size-5" />,
        title: 'Notifikasi Cerdas',
        description: 'Kabar penting sampai kepada orang tua pada waktu yang tepat.',
    },
];

const statuses = [
    { label: 'PASSED', className: 'text-emerald-deep bg-emerald-soft' },
    { label: 'REVISION', className: 'text-gold bg-[oklch(0.95_0.04_80)]' },
    { label: 'REPEAT', className: 'text-red-700 bg-red-100' },
];

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Sistem Manajemen Halaqah Al-Qur'an" />

            <div className="min-h-screen bg-ivory text-ink antialiased">
                {/* Navigation */}
                <header className="sticky top-0 z-40 border-b border-ink/5 bg-ivory/80 backdrop-blur-md">
                    <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                        <Link href="/" className="flex items-center gap-2.5">
                            <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-deep">
                                <AppLogoIcon className="size-5 fill-white" />
                            </span>
                            <span className="text-lg font-semibold tracking-tight">SIMAHAL</span>
                            
                        </Link>

                        <div className="hidden items-center gap-8 text-sm text-ink/60 md:flex">
                            <a href="#tentang" className="transition hover:text-ink">
                                Ekosistem
                            </a>
                            <a href="#alur" className="transition hover:text-ink">
                                Alur
                            </a>
                            <a href="#fitur" className="transition hover:text-ink">
                                Fitur
                            </a>
                        </div>

                        <div className="flex items-center gap-2">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="inline-flex h-9 items-center rounded-lg bg-emerald-deep px-4 text-sm font-medium text-white transition hover:bg-emerald"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="inline-flex h-9 items-center rounded-lg px-4 text-sm font-medium text-ink/70 transition hover:bg-ink/5 hover:text-ink"
                                    >
                                        Masuk
                                    </Link>
                                    <Link
                                        href={register()}
                                        className="inline-flex h-9 items-center rounded-lg bg-emerald-deep px-4 text-sm font-medium text-white transition hover:bg-emerald"
                                    >
                                        Daftar
                                    </Link>
                                </>
                            )}
                        </div>
                    </nav>
                </header>

                {/* Hero */}
                <section className="relative overflow-hidden">
                    <div className="pointer-events-none absolute inset-0">
                        <div className="absolute -top-40 right-0 size-[36rem] rounded-full bg-emerald-soft blur-3xl" />
                        <div className="absolute top-1/3 -left-40 size-[28rem] rounded-full bg-sand/70 blur-3xl" />
                    </div>

                    <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-28">
                        <div className="grid items-center gap-14 lg:grid-cols-2">
                            <div>
                                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/60 px-3 py-1 text-xs font-medium text-ink/60">
                                    <span className="size-1.5 rounded-full bg-gold" />
                                    PondokIT · Halaqah Al-Qur'an
                                </div>
                                <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
                                    Menjaga perjalanan hafalan,{' '}
                                    <span className="text-emerald-deep">terstruktur</span> dan{' '}
                                    <span className="text-emerald-deep">bermakna</span>.
                                </h1>
                                <p className="mt-6 max-w-lg text-base leading-relaxed text-ink/60">
                                    SIMAHAL menghubungkan Admin, Ustadz, Santri, dan Orang Tua dalam
                                    satu ekosistem digital — dari pencatatan mutabaah hingga
                                    pemantauan perkembangan hafalan.
                                </p>
                                <div className="mt-8 flex flex-wrap items-center gap-3">
                                    {auth.user ? (
                                        <Link
                                            href={dashboard()}
                                            className="inline-flex h-11 items-center rounded-xl bg-emerald-deep px-6 text-sm font-medium text-white shadow-sm transition hover:bg-emerald"
                                        >
                                            Buka Dashboard
                                        </Link>
                                    ) : (
                                        <>
                                            <Link
                                                href={register()}
                                                className="inline-flex h-11 items-center rounded-xl bg-emerald-deep px-6 text-sm font-medium text-white shadow-sm transition hover:bg-emerald"
                                            >
                                                Mulai Sekarang
                                            </Link>
                                            <Link
                                                href={login()}
                                                className="inline-flex h-11 items-center rounded-xl border border-ink/10 bg-white/60 px-6 text-sm font-medium text-ink transition hover:border-ink/20 hover:bg-white"
                                            >
                                                Masuk
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Hero visual */}
                            <div className="relative mx-auto w-full max-w-md">
                                <div className="rounded-2xl border border-ink/5 bg-white p-6 shadow-xl shadow-emerald-deep/5">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-ink/70">
                                            Mutabaah Terbaru
                                        </p>
                                        <span className="rounded-full bg-emerald-soft px-2.5 py-0.5 text-xs font-medium text-emerald-deep">
                                            Hari Ini
                                        </span>
                                    </div>

                                    <div className="mt-6 flex items-center gap-4">
                                        <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-soft text-emerald-deep">
                                            <BookOpen className="size-6" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Ahmad Fauzan</p>
                                            <p className="text-sm text-ink/50">
                                                Al-Baqarah · Ayat 1–10
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-6 grid grid-cols-2 gap-3">
                                        <div className="rounded-xl border border-ink/5 bg-ivory/60 p-3">
                                            <p className="text-xs text-ink/50">Tipe</p>
                                            <p className="mt-1 text-sm font-medium">Ziyadah</p>
                                        </div>
                                        <div className="rounded-xl border border-ink/5 bg-ivory/60 p-3">
                                            <p className="text-xs text-ink/50">Nilai</p>
                                            <p className="mt-1 text-sm font-medium text-emerald-deep">
                                                90
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-soft bg-emerald-soft/50 p-3">
                                        <span className="text-sm font-medium text-emerald-deep">
                                            Status
                                        </span>
                                        <span className="rounded-full bg-emerald-deep px-3 py-1 text-xs font-medium text-white">
                                            PASSED
                                        </span>
                                    </div>

                                    <div className="mt-6">
                                        <div className="flex items-center justify-between text-xs text-ink/50">
                                            <span>Target 20 Juz</span>
                                            <span className="font-medium text-ink/70">16 Juz · 80%</span>
                                        </div>
                                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink/5">
                                            <div className="h-full w-[80%] rounded-full bg-emerald" />
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute -right-4 -bottom-6 hidden rounded-2xl border border-ink/5 bg-white p-4 shadow-lg shadow-emerald-deep/5 sm:block">
                                    <p className="text-xs text-ink/50">Juz 16</p>
                                    <p className="mt-1 text-2xl font-semibold text-emerald-deep">
                                        Al-Kahfi
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Roles */}
                <section id="tentang" className="mx-auto max-w-6xl px-6 py-20">
                    <div className="mx-auto max-w-2xl text-center">
                        <p className="text-sm font-medium tracking-wide text-emerald-deep uppercase">
                            Satu Ekosistem
                        </p>
                        <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                            Terhubung untuk pembinaan hafalan
                        </h2>
                        <p className="mt-4 text-ink/60">
                            Setiap pihak memiliki peran yang jelas dalam perjalanan hafalan santri.
                        </p>
                    </div>

                    <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {roles.map((role) => (
                            <div
                                key={role.name}
                                className="group rounded-2xl border border-ink/5 bg-white p-6 transition hover:border-emerald-soft hover:shadow-lg hover:shadow-emerald-deep/5"
                            >
                                <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-soft text-emerald-deep">
                                    {role.icon}
                                </div>
                                <h3 className="mt-4 font-medium">{role.name}</h3>
                                <p className="mt-1.5 text-sm leading-relaxed text-ink/55">
                                    {role.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Journey */}
                <section id="alur" className="border-y border-ink/5 bg-white/60">
                    <div className="mx-auto max-w-6xl px-6 py-20">
                        <div className="mx-auto max-w-2xl text-center">
                            <p className="text-sm font-medium tracking-wide text-emerald-deep uppercase">
                                Alur Perjalanan
                            </p>
                            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                                Dari target menuju insight
                            </h2>
                            <p className="mt-4 text-ink/60">
                                Data mutabaah menjadi dasar dari setiap keputusan pembinaan.
                            </p>
                        </div>

                        <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
                            {journey.map((step, index) => (
                                <div key={step.label} className="relative">
                                    <div className="rounded-xl border border-ink/5 bg-white p-4 text-center shadow-sm">
                                        <p className="text-xs font-medium tracking-wide text-gold">
                                            0{index + 1}
                                        </p>
                                        <p className="mt-2 font-medium">{step.label}</p>
                                        <p className="mt-1 text-xs text-ink/50">
                                            {step.description}
                                        </p>
                                    </div>
                                    {index < journey.length - 1 && (
                                        <div className="absolute top-1/2 -right-2.5 z-10 hidden text-emerald/60 lg:block">
                                            →
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section id="fitur" className="mx-auto max-w-6xl px-6 py-20">
                    <div className="mx-auto max-w-2xl text-center">
                        <p className="text-sm font-medium tracking-wide text-emerald-deep uppercase">
                            Fitur Inti
                        </p>
                        <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                            Sederhana namun bermakna
                        </h2>
                        <p className="mt-4 text-ink/60">
                            Setiap fitur dirancang dengan satu tujuan: membantu ustadz membimbing
                            santri dengan lebih baik.
                        </p>
                    </div>

                    <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map((feature) => (
                            <div
                                key={feature.title}
                                className="rounded-2xl border border-ink/5 bg-white p-6 transition hover:border-emerald-soft hover:shadow-lg hover:shadow-emerald-deep/5"
                            >
                                <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-soft text-emerald-deep">
                                    {feature.icon}
                                </div>
                                <h3 className="mt-4 font-medium">{feature.title}</h3>
                                <p className="mt-1.5 text-sm leading-relaxed text-ink/55">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Status */}
                <section className="border-y border-ink/5 bg-white/60">
                    <div className="mx-auto max-w-6xl px-6 py-20">
                        <div className="grid items-center gap-12 lg:grid-cols-2">
                            <div>
                                <p className="text-sm font-medium tracking-wide text-emerald-deep uppercase">
                                    Evaluasi yang Jelas
                                </p>
                                <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                                    Status mutabaah yang mudah dibaca
                                </h2>
                                <p className="mt-4 text-ink/60">
                                    Setiap setoran memiliki status yang jelas — tidak hanya
                                    bergantung pada warna, tetapi juga simbol dan makna.
                                </p>
                            </div>

                            <div className="space-y-3">
                                {statuses.map((status) => (
                                    <div
                                        key={status.label}
                                        className="flex items-center justify-between rounded-xl border border-ink/5 bg-white p-4"
                                    >
                                        <span className="text-sm text-ink/55">
                                            {status.label === 'PASSED'
                                                ? 'Lancar dan melewati evaluasi'
                                                : status.label === 'REVISION'
                                                  ? 'Perlu perbaikan kecil'
                                                  : 'Perlu diulang kembali'}
                                        </span>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
                                        >
                                            {status.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="mx-auto max-w-6xl px-6 py-20">
                    <div className="relative overflow-hidden rounded-3xl bg-emerald-deep px-8 py-16 text-center md:py-20">
                        <div className="pointer-events-none absolute inset-0">
                            <div className="absolute -top-20 left-1/4 size-72 rounded-full bg-white/5" />
                            <div className="absolute -bottom-24 right-1/4 size-80 rounded-full bg-white/5" />
                        </div>
                        <div className="relative">
                            <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-white md:text-4xl">
                                Jadikan perjalanan hafalan lebih terstruktur dan bermakna
                            </h2>
                            <p className="mx-auto mt-4 max-w-lg text-white/70">
                                Mulai kelola halaqah, catat mutabaah, dan pantau perkembangan hafalan
                                dalam satu ekosistem digital.
                            </p>
                            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                                {auth.user ? (
                                    <Link
                                        href={dashboard()}
                                        className="inline-flex h-11 items-center rounded-xl bg-white px-6 text-sm font-medium text-emerald-deep transition hover:bg-ivory"
                                    >
                                        Buka Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={register()}
                                            className="inline-flex h-11 items-center rounded-xl bg-white px-6 text-sm font-medium text-emerald-deep transition hover:bg-ivory"
                                        >
                                            Daftar Sekarang
                                        </Link>
                                        <Link
                                            href={login()}
                                            className="inline-flex h-11 items-center rounded-xl border border-white/30 px-6 text-sm font-medium text-white transition hover:border-white/50 hover:bg-white/10"
                                        >
                                            Masuk
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-ink/5">
                    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 md:flex-row">
                        <div className="flex items-center gap-2.5">
                            <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-deep">
                                <AppLogoIcon className="size-4 fill-white" />
                            </span>
                            <span className="text-sm font-semibold">SIMAHAL</span>
                        </div>
                        <p className="text-sm text-ink/50">
                            © {new Date().getFullYear()} PondokIT. Sistem Manajemen Halaqah
                            Al-Qur'an.
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}
