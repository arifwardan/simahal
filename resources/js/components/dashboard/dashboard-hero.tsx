import { usePage } from '@inertiajs/react';

export default function DashboardHero({ subtitle }: { subtitle: string }) {
    const { auth } = usePage().props;

    const dateLabel = new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date());

    return (
        <div className="relative overflow-hidden border-[3px] border-black dark:border-[#FFF7E8] bg-primary p-6 text-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] md:p-8">
            {/* pattern */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.08]"
                style={{
                    backgroundImage:
                        'repeating-linear-gradient(-45deg, #000 0 2px, transparent 2px 12px)',
                }}
            />
            <div className="relative flex flex-col gap-3">
                <div className="inline-flex w-fit items-center gap-2 border-2 border-black dark:border-[#FFF7E8] bg-black px-3 py-1 text-xs font-black uppercase tracking-widest text-[#FFF7E8]">
                    <span className="size-2 animate-pulse rounded-full bg-primary" />
                    {dateLabel}
                </div>
                <h1 className="font-head text-3xl font-black uppercase leading-none tracking-tighter md:text-4xl">
                    Selamat datang,{' '}
                    <span className="bg-black px-2 text-primary">{auth.user.name}</span>
                </h1>
                <p className="max-w-2xl border-l-4 border-black dark:border-[#FFF7E8] pl-3 text-sm font-bold leading-snug md:text-base">
                    {subtitle}
                </p>
            </div>
            {/* corner accent */}
            <div className="absolute -bottom-6 -right-6 size-24 rotate-12 border-[3px] border-black dark:border-[#FFF7E8] bg-secondary" aria-hidden />
            <div className="absolute -bottom-6 -right-6 size-24 rotate-12 border-[3px] border-black dark:border-[#FFF7E8] bg-secondary opacity-0" />
        </div>
    );
}
