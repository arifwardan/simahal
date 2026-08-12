import { useForm } from '@inertiajs/react';
import ExcelImportController from '@/actions/App/Http/Controllers/Admin/ExcelImportController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import PageContainer from '@/components/page-container';
import { index as excelImportIndex } from '@/routes/admin/excel-import';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from '@inertiajs/react';
import { FileUp, CheckCircle2 } from 'lucide-react';

type PlanItem = {
    type: 'ustadz' | 'halaqah' | 'santri';
    action: 'create' | 'update' | 'placeholder' | 'error';
    action_label: string;
    nama: string;
    email?: string | null;
    nis?: string | null;
    jenis?: string | null;
    kelompok?: string | null;
    reason?: string | null;
};

type Plan = {
    summary: {
        ustadz: Record<string, number>;
        halaqah: Record<string, number>;
        santri: Record<string, number>;
    };
    items: PlanItem[];
};

type Result = {
    santri_created: number;
    santri_updated: number;
    ustadz_created: number;
    ustadz_updated: number;
    halaqah_created: number;
    halaqah_updated: number;
    emails_created: string[];
    errors: Array<{ nama: string; reason: string }>;
};

type Props = {
    plan?: Plan | null;
    result?: Result | null;
};

const actionBadge: Record<PlanItem['action'], string> = {
    create: 'bg-emerald-100 text-emerald-800',
    update: 'bg-sky-100 text-sky-800',
    placeholder: 'bg-zinc-100 text-zinc-600',
    error: 'bg-red-100 text-red-700',
};

export default function AdminExcelImport({ plan, result }: Props) {
    const form = useForm<{ file: File | null }>({ file: null });

    const hasPlan = Boolean(plan);

    return (
        <PageContainer>
            <Heading
                title="Import Excel"
                description="Impor data master santri, ustadz, dan halaqah dari file Excel (sheet Data Kelompok)."
            />

            {result ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle2 className="size-5 text-emerald-600" />
                            Import Selesai
                        </CardTitle>
                        <CardDescription>
                            Santri baru: {result.santri_created} · Santri diperbarui: {result.santri_updated}
                            {' · '}Ustadz baru: {result.ustadz_created} · Halaqah baru: {result.halaqah_created}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {result.emails_created.length > 0 && (
                            <div className="grid gap-1">
                                <p className="text-sm font-medium">Email akun yang dibuat:</p>
                                <ul className="max-h-40 list-inside list-disc overflow-auto rounded-md bg-muted p-3 text-sm">
                                    {result.emails_created.map((email) => (
                                        <li key={email}>{email}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <div className="flex gap-2">
                            <Button asChild variant="outline">
                                <Link href={excelImportIndex()}>Import Lagi</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileUp className="size-5 text-emerald-600" />
                                {hasPlan ? 'Pratinjau Rencana' : 'Unggah File Excel'}
                            </CardTitle>
                            <CardDescription>
                                {hasPlan
                                    ? 'Periksa rencana di bawah sebelum dieksekusi.'
                                    : 'Format mengikuti sheet "Data Kelompok" pada Mutabaah_Hafalan_Santri.xlsx.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="file">File Excel</Label>
                                <Input
                                    id="file"
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={(e) => form.setData('file', e.target.files?.[0] ?? null)}
                                />
                                <InputError message={form.errors.file} />
                            </div>
                            <div className="flex justify-end gap-2">
                                {hasPlan && (
                                    <Button type="button" variant="outline" onClick={() => window.location.reload()}>
                                        Batalkan
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    disabled={form.processing || !form.data.file}
                                    onClick={() =>
                                        hasPlan
                                            ? form.post(ExcelImportController.execute.url())
                                            : form.post(ExcelImportController.preview.url())
                                    }
                                >
                                    {hasPlan ? 'Konfirmasi Import' : 'Lihat Pratinjau'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {hasPlan && plan && <PlanTable plan={plan} />}
                </>
            )}
        </PageContainer>
    );
}

function PlanTable({ plan }: { plan: Plan }) {
    const counts = (type: keyof Plan['summary']) => {
        const s = plan.summary[type];
        const total = Object.values(s).reduce((a, b) => a + b, 0);

        return `${total} ${type}`;
    };

    return (
        <Card className="mt-4">
            <CardHeader>
                <CardTitle>Ringkasan Rencana</CardTitle>
                <CardDescription>{counts('ustadz')} · {counts('halaqah')} · {counts('santri')}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto rounded-md border">
                    <table className="text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                {['Entitas', 'Nama', 'Tindakan', 'Detail'].map((h) => (
                                    <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {plan.items.map((item, i) => (
                                <tr key={`${item.type}-${i}`} className="border-b last:border-0">
                                    <td className="px-3 py-2 capitalize">{item.type}</td>
                                    <td className="px-3 py-2">{item.nama}</td>
                                    <td className="px-3 py-2">
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${actionBadge[item.action]}`}>
                                            {item.action_label}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 text-muted-foreground">
                                        {[item.nis, item.email, item.reason].filter(Boolean).join(', ') || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}

AdminExcelImport.layout = {
    breadcrumbs: [
        {
            title: 'Import Excel',
            href: excelImportIndex(),
        },
    ],
};
