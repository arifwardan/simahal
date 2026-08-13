import DistributionDonut from '@/components/dashboard/charts/distribution-donut';
import type {ChartSlice} from '@/components/dashboard/charts/distribution-donut';
import type { ChartConfig } from '@/components/ui/chart';

const config = {
    lulus: { label: 'Lulus', color: 'var(--chart-1)' },
    perlu_murajaah: { label: 'Perlu Murajaah', color: 'var(--chart-2)' },
    mengulang: { label: 'Mengulang', color: 'var(--chart-3)' },
} satisfies ChartConfig;

export default function MutabaahStatusDonut({ data }: { data: ChartSlice[] }) {
    return (
        <DistributionDonut
            title="Status Mutabaah"
            description="Distribusi status setoran mutabaah"
            data={data}
            config={config}
        />
    );
}
