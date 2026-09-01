import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tone = 'violet' | 'indigo' | 'fuchsia' | 'teal' | 'amber';

type Delta = {
    direction: 'up' | 'down';
    value: string;
};

type StatCardProps = {
    label: string;
    value: string | number;
    icon?: LucideIcon;
    tone?: Tone;
    subtitle?: string;
    delta?: Delta;
    href?: string;
};

const toneMap: Record<Tone, { bg: string; accent: string }> = {
    violet: { bg: 'bg-[#FF90E8]', accent: 'bg-[#FFD600]' },
    indigo: { bg: 'bg-[#5CE1E6]', accent: 'bg-[#FFD600]' },
    fuchsia: { bg: 'bg-[#FF6B6B]', accent: 'bg-white' },
    teal: { bg: 'bg-[#7DF9FF]', accent: 'bg-black text-white' },
    amber: { bg: 'bg-[#FFD600]', accent: 'bg-black text-white' },
};

export default function StatCard({
    label,
    value,
    icon: Icon,
    tone = 'violet',
    subtitle,
    delta,
    href,
}: StatCardProps) {
    const t = toneMap[tone];

    const content = (
        <div
            className={cn(
                'relative flex flex-col gap-3 border-[3px] border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]',
                t.bg,
                href && 'cursor-pointer'
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                    <span className="font-head text-[11px] font-black uppercase tracking-[0.14em] text-black/70">
                        {label}
                    </span>
                    <span className="font-head text-3xl font-black leading-none tracking-tighter text-black">
                        {value}
                    </span>
                </div>
                {Icon && (
                    <span className="flex size-11 shrink-0 items-center justify-center border-[3px] border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                        <Icon className="size-5 stroke-[2.5]" />
                    </span>
                )}
            </div>
            {(subtitle || delta) && (
                <div className="flex flex-col gap-1 border-t-[3px] border-black pt-3">
                    {subtitle && <span className="text-xs font-bold leading-none text-black">{subtitle}</span>}
                    {delta && (
                        <span
                            className={cn(
                                'inline-flex w-fit items-center gap-1 border-2 border-black px-2 py-0.5 text-[11px] font-black uppercase',
                                delta.direction === 'up' ? 'bg-white text-black' : 'bg-black text-white'
                            )}
                        >
                            {delta.direction === 'up' ? '↗' : '↘'} {delta.value}
                        </span>
                    )}
                </div>
            )}
            {/* accent stripe */}
            <div className={cn('absolute left-0 top-0 h-2 w-full border-b-[3px] border-black', t.accent)} />
        </div>
    );

    if (href) {
        return (
            <Link href={href} className="block">
                {content}
            </Link>
        );
    }

    return content;
}
