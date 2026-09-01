import { Form } from '@inertiajs/react';
import { useState } from 'react';
import TargetHafalanController from '@/actions/App/Http/Controllers/Muhafidz/TargetHafalanController';
import TargetForm from '@/components/forms/TargetForm';
import type { TargetRow } from '@/components/forms/TargetForm';
import Heading from '@/components/heading';
import PageContainer from '@/components/page-container';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { index } from '@/routes/muhafidz/targets';

type Target = {
    id: number;
    periode: string;
    target: number;
    progress: number;
    progress_percent: number;
    status: string;
    status_label: string;
};

type SantriWithTargets = {
    id: number;
    nama: string;
    targets: Target[];
};

type Option = { value: string; label: string };

type PageProps = {
    santris: SantriWithTargets[];
    statuses: Option[];
};

export default function MuhafidzTargetsIndex({ santris, statuses }: PageProps) {
    const [showCreate, setShowCreate] = useState(false);
    const [editing, setEditing] = useState<TargetRow | null>(null);

    return (
        <PageContainer>
            <Heading title="Target Hafalan" description="Pantau dan kelola target hafalan santri halaqah Anda." />

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Progres Santri</CardTitle>
                    <Dialog open={showCreate} onOpenChange={setShowCreate}>
                        <DialogTrigger asChild>
                            <Button>Tambah Target</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Tambah Target</DialogTitle>
                                <DialogDescription>
                                    Tambahkan target hafalan baru untuk santri halaqah Anda.
                                </DialogDescription>
                            </DialogHeader>
                            <TargetForm
                                santris={santris}
                                statuses={statuses}
                                onSuccess={() => setShowCreate(false)}
                            />
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    {santris.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Belum ada santri di halaqah Anda.</p>
                    ) : (
                        <ul className="divide-y rounded-lg border">
                            {santris.map((santri) => (
                                <li key={santri.id} className="p-4">
                                    <p className="font-medium">{santri.nama}</p>
                                    {santri.targets.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">Belum ada target.</p>
                                    ) : (
                                        <ul className="mt-2 space-y-2">
                                            {santri.targets.map((target) => (
                                                <li key={target.id} className="rounded-lg border p-3">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <p className="text-sm font-medium">
                                                            Periode {target.periode} · {target.progress}/{target.target} ayat
                                                        </p>
                                                        <span className="text-sm">{target.progress_percent}%</span>
                                                    </div>
                                                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                                                        <div className="h-full bg-primary" style={{ width: `${target.progress_percent}%` }} />
                                                    </div>
                                                    <div className="mt-2 flex items-center justify-between gap-2">
                                                        <span className="text-xs text-muted-foreground">{target.status_label}</span>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() =>
                                                                    setEditing({
                                                                        id: target.id,
                                                                        santri_id: santri.id,
                                                                        periode: target.periode,
                                                                        target: target.target,
                                                                        status: target.status,
                                                                    })
                                                                }
                                                            >
                                                                Edit
                                                            </Button>
                                                            <Form {...TargetHafalanController.destroy.form({ targetHafalan: target.id })}>
                                                                <Button type="submit" size="sm" variant="ghost" className="text-destructive">Hapus</Button>
                                                            </Form>
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>

            <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
                <DialogContent key={editing?.id}>
                    <DialogHeader>
                        <DialogTitle>Edit Target</DialogTitle>
                        <DialogDescription>
                            Perbarui target hafalan santri.
                        </DialogDescription>
                    </DialogHeader>
                    {editing && (
                        <TargetForm
                            nilaiAwal={editing}
                            santris={santris}
                            statuses={statuses}
                            onSuccess={() => setEditing(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </PageContainer>
    );
}

MuhafidzTargetsIndex.layout = {
    breadcrumbs: [{
        title: 'Target Hafalan',
        href: index(),
    }],
};
