import DistributionDonut from '@/components/dashboard/charts/distribution-donut';
import type {ChartSlice} from '@/components/dashboard/charts/distribution-donut';
import type { ChartConfig } from '@/components/ui/chart';

const config = {
    lulus: { label: 'Lulus', color: '#22c55e' },
    perlu_murajaah: { label: 'Perlu Murajaah', color: '#FF90E8' },
    mengulang: { label: 'Mengulang', color: '#FFD600' },
    lulus_2: { label: 'Lulus', color: '#5CE1E6' },
    belum: { label: 'Belum', color: '#a3a3a3' },
} satisfies ChartConfig;

const headerBg = 'bg-[#22c55e]';

export default function MutabaahStatusDonut({ data }: { data: ChartSlice[] }) {
    return (
        <DistributionDonut
            title="Status Mutabaah"
            description="Distribusi status setoran mutabaah"
            data={data}
            config={config}
            headerClass="bg-[#22c55e]"
        />
    );
}
