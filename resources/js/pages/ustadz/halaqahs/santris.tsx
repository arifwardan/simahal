import { Link } from '@inertiajs/react';
import Heading from '@/components/heading';
import PageContainer from '@/components/page-container';
import { index as halaqahIndex } from '@/routes/ustadz/halaqahs';
import { create } from '@/routes/ustadz/mutabaahs';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type SantriRow = {
    id: number;
    nama: string;
    nis?: string | null;
};

type Halaqah = { id: number; nama: string };

export default function UstadzHalaqahSantris({ halaqah, santris }: { halaqah: Halaqah; santris: { data: SantriRow[]; total: number } }) {
    return (
        <PageContainer>
            <Heading title={halaqah.nama} description="Daftar santri dalam halaqah ini." />

            <Card>
                <CardHeader>
                    <CardTitle>Santri ({santris.total})</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="divide-y rounded-lg border">
                        {santris.data.map((santri) => (
                            <li key={santri.id} className="flex items-center justify-between gap-4 p-4">
                                <div>
                                    <p className="font-medium">{santri.nama}</p>
                                    {santri.nis && <p className="text-sm text-muted-foreground">{santri.nis}</p>}
                                </div>
                                <Button asChild size="sm">
                                    <Link href={create({ santri: santri.id })}>Catat Mutabaah</Link>
                                </Button>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </PageContainer>
    );
}

UstadzHalaqahSantris.layout = {
    breadcrumbs: [{
        title: 'Halaqah Saya',
        href: halaqahIndex(),
    }],
};