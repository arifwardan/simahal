import DistributionDonut from '@/components/dashboard/charts/distribution-donut';
import type {ChartSlice} from '@/components/dashboard/charts/distribution-donut';
import type { ChartConfig } from '@/components/ui/chart';

const config = {
    ikhwan: { label: 'Ikhwan', color: 'var(--chart-1)' },
    akhwat: { label: 'Akhwat', color: 'var(--chart-2)' },
} satisfies ChartConfig;

export default function SantriJenisDonut({ data }: { data: ChartSlice[] }) {
    return (
        <DistributionDonut
            title="Jenis Santri"
            description="Perbandingan santri ikhwan dan akhwat"
            data={data}
            config={config}
        />
    );
}
