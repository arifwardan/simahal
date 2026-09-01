import type * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

type Props = React.ComponentProps<typeof Card> & {
    title: string;
    description?: string;
    icon: LucideIcon;
};

export default function DashboardCard({
    title,
    description,
    icon: Icon,
    className,
    children,
    ...props
}: Props) {
    return (
        <Card className={cn('h-full', className)} {...props}>
            <CardHeader>
                <div className="flex items-start gap-4">
                    <div className="inline-flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="size-6 text-primary" />
                    </div>
                    <div>
                        <p className="font-semibold">{title}</p>
                        {description && (
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}
