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
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && (
                    <CardDescription>{description}</CardDescription>
                )}
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Belum ada data
                    </p>
                ) : (
                    <ChartContainer
                        config={config}
                        className="mx-auto aspect-square max-h-[250px]"
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
                                innerRadius={60}
                                strokeWidth={5}
                            >
                                {data.map((entry) => (
                                    <Cell
                                        key={entry.key}
                                        fill={`var(--color-${entry.key})`}
                                    />
                                ))}
                            </Pie>
                        </PieChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    );
}
