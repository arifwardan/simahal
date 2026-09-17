import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const STORAGE_KEY = 'onboarding_done';

export type OnboardingStep = {
    id: string;
    title: string;
    description: string;
    done: boolean;
};

export function isOnboardingDone(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) === '1';
}

export function markOnboardingDone(): void {
    localStorage.setItem(STORAGE_KEY, '1');
}

export function clearOnboardingDone(): void {
    localStorage.removeItem(STORAGE_KEY);
}

export default function OnboardingTour({
    steps,
    onDismiss,
}: {
    steps: OnboardingStep[];
    onDismiss?: () => void;
}) {
    const [dismissed, setDismissed] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (localStorage.getItem(STORAGE_KEY) !== '1') {
            setVisible(true);
        }
    }, []);

    const handleDismiss = () => {
        localStorage.setItem(STORAGE_KEY, '1');
        setDismissed(true);
        setVisible(false);
        onDismiss?.();
    };

    if (dismissed || !visible) return null;

    const completed = steps.filter((s) => s.done).length;
    const total = steps.length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    return (
        <Card
            data-testid="onboarding-tour"
            className="border-[3px] border-black dark:border-[#FFF7E8] bg-[#FFD600] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
        >
            <CardHeader className="flex flex-row items-center justify-between bg-[#FFD600] py-3">
                <CardTitle className="font-head text-sm font-black uppercase text-black">Onboarding — 4 Langkah Awal</CardTitle>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDismiss}
                    aria-label="Tutup onboarding"
                    data-testid="onboarding-dismiss"
                    className="h-7 w-7 border-2 border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 hover:bg-black hover:text-white"
                >
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="space-y-3 bg-[#FFF7E8] dark:bg-zinc-900 pt-4">
                {/* checklist bar */}
                <div className="space-y-1">
                    <div className="flex justify-between text-xs font-black uppercase">
                        <span>
                            {completed}/{total} selesai
                        </span>
                        <span>{percent}%</span>
                    </div>
                    <div
                        data-testid="onboarding-checklist-bar"
                        className="h-3 w-full border-[3px] border-black dark:border-[#FFF7E8] bg-white dark:bg-zinc-900 p-1"
                    >
                        <div className="h-full bg-black transition-all" style={{ width: `${percent}%` }} />
                    </div>
                </div>

                <ol className="space-y-2">
                    {steps.map((step, idx) => (
                        <li
                            key={step.id}
                            data-testid={`onboarding-step-${step.id}`}
                            className={`flex gap-3 border-2 border-black dark:border-[#FFF7E8] p-3 ${step.done ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-white dark:bg-zinc-900'}`}
                        >
                            <span
                                className={`flex h-7 w-7 shrink-0 items-center justify-center border-2 border-black dark:border-[#FFF7E8] text-xs font-black ${step.done ? 'bg-emerald-400 text-black' : 'bg-[#FFF7E8] dark:bg-zinc-900'}`}
                            >
                                {step.done ? <Check className="h-4 w-4" /> : idx + 1}
                            </span>
                            <div className="min-w-0">
                                <p className="text-sm font-black uppercase leading-tight">{step.title}</p>
                                <p className="text-xs font-bold leading-snug">{step.description}</p>
                            </div>
                        </li>
                    ))}
                </ol>

                <div className="flex gap-2">
                    <Button
                        onClick={handleDismiss}
                        data-testid="onboarding-done"
                        className="border-[3px] border-black dark:border-[#FFF7E8] bg-black font-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
                    >
                        Selesai — Jangan tampilkan lagi
                    </Button>
                </div>
                <p className="text-[11px] font-bold text-muted-foreground">
                    Menyimpan <code>localStorage onboarding_done=1</code> agar tur tidak muncul lagi.
                </p>
            </CardContent>
        </Card>
    );
}

export const DEFAULT_SANTRI_STEPS = (
    opts: { hasHalaqah: boolean; hasTarget: boolean; hasSetoran: boolean; hasPrestasi?: boolean },
): OnboardingStep[] => [
    {
        id: 'profile-halaqah',
        title: '1. Profil & Halaqah',
        description: 'Lengkapi profil dan pastikan terdaftar di halaqah.',
        done: opts.hasHalaqah,
    },
    {
        id: 'target',
        title: '2. Target 1–30 Juz',
        description: 'Atur target hafalan antara 1 sampai 30 Juz.',
        done: opts.hasTarget,
    },
    {
        id: 'setoran',
        title: '3. Setoran pertama — pekan Senin',
        description: 'Input setoran pertama; pekan dihitung dari hari Senin.',
        done: opts.hasSetoran,
    },
    {
        id: 'prestasi',
        title: '4. Prestasi & Share',
        description: 'Lihat prestasi dan bagikan tautan jika ada.',
        done: !!opts.hasPrestasi,
    },
];

export const DEFAULT_MUHAFIDZ_STEPS = (
    opts: { hasHalaqah: boolean; hasTarget: boolean; hasSetoran: boolean; hasPrestasi?: boolean },
): OnboardingStep[] => [
    {
        id: 'profile-halaqah',
        title: '1. Profil & Halaqah',
        description: 'Pastikan halaqah sudah dibuat dan santri terdaftar.',
        done: opts.hasHalaqah,
    },
    {
        id: 'target',
        title: '2. Target 1–30 Juz',
        description: 'Bantu santri atur target 1–30 Juz.',
        done: opts.hasTarget,
    },
    {
        id: 'setoran',
        title: '3. Setoran pertama — pekan Senin',
        description: 'Input setoran pekan Senin untuk santri.',
        done: opts.hasSetoran,
    },
    {
        id: 'prestasi',
        title: '4. Prestasi & Share',
        description: 'Pantau prestasi santri dan bagikan.',
        done: !!opts.hasPrestasi,
    },
];
