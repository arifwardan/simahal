import type * as React from 'react';
import { cn } from '@/lib/utils';

type Props = React.ComponentProps<'div'>;

export default function PageContainer({ className, children, ...props }: Props) {
    return (
        <div className={cn('px-4 pb-8 pt-4 md:px-6', className)} {...props}>
            {children}
        </div>
    );
}
