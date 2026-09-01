import DistributionDonut from '@/components/dashboard/charts/distribution-donut';
import type {ChartSlice} from '@/components/dashboard/charts/distribution-donut';
import type { ChartConfig } from '@/components/ui/chart';

const config = {
    ikhwan: { label: 'Ikhwan', color: '#5CE1E6' },
    akhwat: { label: 'Akhwat', color: '#FF90E8' },
} satisfies ChartConfig;

const headerBg = 'bg-[#FF90E8]';
export default function SantriJenisDonut({ data }: { data: ChartSlice[] }) {
    return (
        <DistributionDonut
            title="Jenis Santri"
            description="Perbandingan santri ikhwan dan akhwat"
            data={data}
            config={config}
            headerClass={headerBg}
        />
    );
}
