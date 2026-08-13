import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Tone = 'violet' | 'indigo' | 'fuchsia' | 'teal' | 'amber' | 'emerald' | 'sky' | 'rose';

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

const toneClasses: Record<Tone, string> = {
    violet: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
    indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
    fuchsia:
        'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300',
    teal: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    sky: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    rose: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
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
    const content = (
        <>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {label}
                </CardTitle>
                {Icon && (
                    <span
                        className={cn(
                            'flex size-9 items-center justify-center rounded-lg',
                            toneClasses[tone],
                        )}
                    >
                        <Icon className="size-4.5" />
                    </span>
                )}
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-semibold">{value}</p>
                {subtitle && (
                    <p className="text-xs text-muted-foreground">{subtitle}</p>
                )}
                {delta && (
                    <p
                        className={cn(
                            'text-xs font-medium',
                            delta.direction === 'up'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400',
                        )}
                    >
                        {delta.direction === 'up' ? '↑' : '↓'} {delta.value}
                    </p>
                )}
            </CardContent>
        </>
    );

    if (href) {
        return (
            <Link href={href} className="block">
                <Card className="transition-colors hover:border-foreground/20">
                    {content}
                </Card>
            </Link>
        );
    }

    return <Card>{content}</Card>;
}
