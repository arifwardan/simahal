import { Cell, Pie, PieChart } from 'recharts';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { ChartConfig } from '@/components/ui/chart';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';

export type ChartSlice = {
    key: string;
    label: string;
    count: number;
};

type Props = {
    title: string;
    description?: string;
    data: ChartSlice[];
    config: ChartConfig;
};

export default function DistributionDonut({
    title,
    description,
    data,
    config,
}: Props) {
    return (
        <Card className="flex h-full flex-col">
            <CardHeader className="bg-primary">
                <CardTitle className="font-head font-black uppercase">{title}</CardTitle>
                {description && <CardDescription className="font-bold text-black">{description}</CardDescription>}
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-center">
                {data.length === 0 ? (
                    <p className="p-6 text-sm font-bold">Belum ada data</p>
                ) : (
                    <>
                        <ChartContainer
                            config={config}
                            className="mx-auto aspect-square max-h-[220px] w-full"
                        >
                            <PieChart>
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent hideLabel />}
                                />
                                <Pie
                                    data={data}
                                    dataKey="count"
                                    nameKey="label"
                                    innerRadius={62}
                                    outerRadius={88}
                                    stroke="black"
                                    strokeWidth={3}
                                >
                                    {data.map((entry) => (
                                        <Cell
                                            key={entry.key}
                                            fill={`var(--color-${entry.key})`}
                                            stroke="black"
                                            strokeWidth={3}
                                        />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ChartContainer>
                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                            {data.map((entry) => (
                                <span
                                    key={entry.key}
                                    className="inline-flex items-center gap-1.5 border-2 border-black px-2 py-1 text-xs font-black uppercase"
                                    style={{ backgroundColor: `var(--color-${entry.key})` }}
                                >
                                    <span className="size-3 border-2 border-black bg-white" style={{ backgroundColor: `var(--color-${entry.key})` }} />
                                    {entry.label}: {entry.count}
                                </span>
                            ))}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
