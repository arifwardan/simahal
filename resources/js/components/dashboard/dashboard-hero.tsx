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
        <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
                Selamat datang, {auth.user.name}
            </h1>
            <p className="text-sm text-muted-foreground">{dateLabel}</p>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
    );
}
