import type { ChartConfig } from '@/components/ui/chart';
import DistributionDonut, {
    type ChartSlice,
} from '@/components/dashboard/charts/distribution-donut';

const config = {
    berlangsung: { label: 'Berlangsung', color: 'var(--chart-1)' },
    selesai: { label: 'Selesai', color: 'var(--chart-2)' },
} satisfies ChartConfig;

export default function ChildrenProgressDonut({
    data,
}: {
    data: ChartSlice[];
}) {
    return (
        <DistributionDonut
            title="Progress Anak"
            description="Status target hafalan anak Anda"
            data={data}
            config={config}
        />
    );
}
