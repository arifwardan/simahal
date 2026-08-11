import { Form } from '@inertiajs/react';
import TargetHafalanController from '@/actions/App/Http/Controllers/Ustadz/TargetHafalanController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import PageContainer from '@/components/page-container';
import { index } from '@/routes/ustadz/targets';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';

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

export default function UstadzTargetsIndex({ santris, statuses }: PageProps) {
    const [targetSantriId, setTargetSantriId] = useState<string>('');

    return (
        <PageContainer>
            <Heading title="Target Hafalan" description="Pantau dan kelola target hafalan santri halaqah Anda." />

            <Card>
                <CardHeader>
                    <CardTitle>Tambah Target</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...TargetHafalanController.store.form()} onSuccess={() => setTargetSantriId('')} className="space-y-4">
                        {({ errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="santri_id">Santri</Label>
                                    <Select name="santri_id" required value={targetSantriId} onValueChange={setTargetSantriId}>
                                        <SelectTrigger id="santri_id"><SelectValue placeholder="Pilih santri" /></SelectTrigger>
                                        <SelectContent>
                                            {santris.map((s) => (
                                                <SelectItem key={s.id} value={String(s.id)}>{s.nama}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.santri_id} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="periode">Periode</Label>
                                    <Input id="periode" name="periode" required placeholder="2027-2028" />
                                    <InputError message={errors.periode} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="target">Target (ayat)</Label>
                                    <Input id="target" name="target" type="number" min={1} required />
                                    <InputError message={errors.target} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select name="status" required defaultValue="berlangsung">
                                        <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {statuses.map((o) => (
                                                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.status} />
                                </div>
                                <Button type="submit">Simpan Target</Button>
                            </>
                        )}
                    </Form>
                </CardContent>
            </Card>

            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>Progres Santri</CardTitle>
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
                                                        <Form {...TargetHafalanController.destroy.form({ targetHafalan: target.id })}>
                                                            <Button type="submit" size="sm" variant="ghost" className="text-destructive">Hapus</Button>
                                                        </Form>
                                                    </div>
                                                    {target.status !== 'selesai' && (
                                                        <Form {...TargetHafalanController.update.form({ targetHafalan: target.id })} className="mt-3">
                                                            {({ errors }) => (
                                                                <>
                                                                    <input type="hidden" name="periode" defaultValue={target.periode} />
                                                                    <input type="hidden" name="target" defaultValue={target.target} />
                                                                    <input type="hidden" name="status" value="selesai" />
                                                                    <Button type="submit" size="sm">Tandai Selesai</Button>
                                                                    <InputError message={errors.periode ?? errors.target ?? errors.status} />
                                                                </>
                                                            )}
                                                        </Form>
                                                    )}
                                                    <Form {...TargetHafalanController.update.form({ targetHafalan: target.id })} className="mt-3 space-y-3">
                                                        {({ errors }) => (
                                                            <>
                                                                <div className="grid gap-3 sm:grid-cols-3">
                                                                    <div className="grid gap-1">
                                                                        <Label htmlFor={`periode-${target.id}`}>Periode</Label>
                                                                        <Input id={`periode-${target.id}`} name="periode" maxLength={50} defaultValue={target.periode} />
                                                                        <InputError message={errors.periode} />
                                                                    </div>
                                                                    <div className="grid gap-1">
                                                                        <Label htmlFor={`target-${target.id}`}>Target (ayat)</Label>
                                                                        <Input id={`target-${target.id}`} name="target" type="number" min={1} defaultValue={target.target} />
                                                                        <InputError message={errors.target} />
                                                                    </div>
                                                                    <div className="grid gap-1">
                                                                        <Label htmlFor={`status-${target.id}`}>Status</Label>
                                                                        <Select name="status" defaultValue={target.status}>
                                                                            <SelectTrigger id={`status-${target.id}`}><SelectValue /></SelectTrigger>
                                                                            <SelectContent>
                                                                                {statuses.map((o) => (
                                                                                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                                                                ))}
                                                                            </SelectContent>
                                                                        </Select>
                                                                        <InputError message={errors.status} />
                                                                    </div>
                                                                </div>
                                                                <Button type="submit" size="sm">Update</Button>
                                                            </>
                                                        )}
                                                    </Form>
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
        </PageContainer>
    );
}

UstadzTargetsIndex.layout = {
    breadcrumbs: [{
        title: 'Target Hafalan',
        href: index(),
    }],
};