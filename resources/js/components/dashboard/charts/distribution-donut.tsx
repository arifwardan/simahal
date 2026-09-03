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
    headerClass?: string;
};

export default function DistributionDonut({
    title,
    description,
    data,
    config,
    headerClass = 'bg-primary',
}: Props) {
    return (
        <Card className="flex h-full min-h-[380px] w-full flex-col overflow-hidden">
            <CardHeader className={`min-h-[76px] border-b-[3px] border-black py-4 ${headerClass}`}>
                <CardTitle className="font-head text-[15px] font-black uppercase leading-none">{title}</CardTitle>
                {description && (
                    <CardDescription className="line-clamp-1 font-bold text-black">{description}</CardDescription>
                )}
            </CardHeader>
            <CardContent className="flex w-full flex-1 flex-col justify-center gap-4 p-6">
                {data.length === 0 ? (
                    <p className="flex flex-1 items-center justify-center border-2 border-dashed border-black bg-accent p-6 text-sm font-black uppercase">
                        Belum ada data
                    </p>
                ) : (
                    <>
                        <ChartContainer
                            config={config}
                            className="mx-auto aspect-square h-[220px] w-full shrink-0"
                        >
                            <PieChart>
                                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
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
                        <div className="flex min-h-[48px] flex-wrap items-center justify-center gap-2 border-t-[3px] border-black bg-muted/20 -mx-6 -mb-6 px-4 py-3">
                            {data.map((entry) => (
                                <span
                                    key={entry.key}
                                    className="inline-flex items-center gap-1.5 border-[2.5px] border-black bg-[#FFF7E8] px-2.5 py-1 text-[11px] font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                    style={{ backgroundColor: `var(--color-${entry.key})` }}
                                >
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
