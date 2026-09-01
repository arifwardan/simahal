import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import PageContainer from '@/components/page-container';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { history } from '@/routes/muhafidz/mutabaahs';

type MutabaahRow = {
    id: number;
    tanggal: string;
    jenis: string;
    surah: string;
    ayat_mulai: number;
    ayat_selesai: number;
    nilai: number | null;
    status: string;
    catatan: string | null;
    santri: { nama: string };
};

type PageProps = {
    mutabaahs: {
        data: MutabaahRow[];
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
    };
    santriOptions: { id: number; nama: string }[];
    filters?: { santri?: number };
};

export default function MuhafidzMutabaahHistory({ mutabaahs, santriOptions, filters }: PageProps) {
    const [santri, setSantri] = useState<string>(filters?.santri ? String(filters.santri) : '');

    return (
        <PageContainer>
            <Heading title="Riwayat Mutabaah" description="Riwayat pencatatan mutabaah yang Anda lakukan." />

            <Card>
                <CardHeader>
                    <CardTitle>Riwayat ({mutabaahs.total})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Select
                        value={santri}
                        onValueChange={(value) => {
                            setSantri(value);
                            router.get(history(), value ? { santri: value } : {}, { preserveState: true, replace: true });
                        }}
                    >
                        <SelectTrigger className="w-[240px]"><SelectValue placeholder="Semua santri" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Semua santri</SelectItem>
                            {santriOptions.map((s) => (
                                <SelectItem key={s.id} value={String(s.id)}>{s.nama}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <ul className="divide-y-[3px] divide-black border-[3px] border-black">
                        {mutabaahs.data.map((m) => (
                            <li key={m.id} className="space-y-1 bg-[#FFF7E8] p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <p className="font-head font-black uppercase">{m.santri.nama}</p>
                                    <Badge>{m.status}</Badge>
                                </div>
                                <p className="text-sm font-bold">
                                    {m.tanggal} · {m.jenis} · {m.surah} {m.ayat_mulai}-{m.ayat_selesai}
                                    {m.nilai !== null ? ` · Nilai ${m.nilai}` : ''}
                                </p>
                                {m.catatan && <p className="text-sm border-l-4 border-black pl-2">{m.catatan}</p>}
                            </li>
                        ))}
                    </ul>

                    {mutabaahs.last_page > 1 && (
                        <div className="flex flex-wrap items-center justify-between gap-2 border-[3px] border-black bg-[#FFF7E8] p-2">
                            <span className="px-2 text-xs font-black uppercase">
                                Hal {mutabaahs.current_page} dari {mutabaahs.last_page} · {mutabaahs.total} data
                            </span>
                            <div className="flex gap-1">
                                {mutabaahs.links.map((link, i) => {
                                    if (!link.url) {
                                        return (
                                            <span
                                                key={i}
                                                className="border-2 border-black bg-[#FFF7E8] px-3 py-1 text-xs font-black opacity-40"
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        );
                                    }
                                    return (
                                        <Link
                                            key={i}
                                            href={link.url}
                                            preserveState
                                            preserveScroll
                                            className={`border-[3px] border-black px-3 py-1 text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${link.active ? 'bg-primary text-black' : 'bg-[#FFF7E8] text-black hover:bg-accent'}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </PageContainer>
    );
}

MuhafidzMutabaahHistory.layout = {
    breadcrumbs: [{
        title: 'Riwayat Mutabaah',
        href: history(),
    }],
};