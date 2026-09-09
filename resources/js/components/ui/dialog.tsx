import * as DialogPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
    return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
    return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
    return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
    return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
    return (
        <DialogPrimitive.Overlay
            data-slot="dialog-overlay"
            className={cn(
                'fixed inset-0 z-50 bg-black/55 duration-150',
                'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                className,
            )}
            {...props}
        />
    );
}

function DialogContent({ className, children, ...props }: React.ComponentProps<typeof DialogPrimitive.Content>) {
    return (
        <DialogPortal data-slot="dialog-portal">
            <DialogOverlay />
            {/* true centering wrapper - flex centers perfectly even with rotation */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
                <DialogPrimitive.Content
                    data-slot="dialog-content"
                    className={cn(
                        'pointer-events-auto relative flex w-full max-w-[calc(100%-1rem)] sm:max-w-lg max-h-[calc(100dvh-2rem)] flex-col',
                        'bg-[#FFFEF2] border-[3px] border-black',
                        'shadow-[6px_6px_0px_0px_rgba(0,0,0,1),12px_12px_24px_rgba(0,0,0,0.15)]',
                        'duration-150',
                        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-[0.985] data-[state=open]:zoom-in-[0.985]',
                        className,
                    )}
                    {...props}
                >
                    {/* light paper tint */}
                    <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#FFFEF2] to-[#FFF6D6] opacity-60" />
                    {/* single tape accent - no blur/filter */}
                    <div
                        aria-hidden
                        className="absolute -top-3 left-1/2 h-4 w-24 -translate-x-1/2 -rotate-1 border border-black/10 bg-[#FFF2A8]/80"
                    />

                    {/* content */}
                    <div className="relative flex flex-1 flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 [scrollbar-width:thin]">
                            {children}
                        </div>
                    </div>

                    <DialogPrimitive.Close className="absolute top-2.5 right-2.5 inline-flex h-7 w-7 items-center justify-center border-[2.5px] border-black bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer [&_svg]:size-4">
                        <XIcon />
                        <span className="sr-only">Close</span>
                    </DialogPrimitive.Close>
                </DialogPrimitive.Content>
            </div>
        </DialogPortal>
    );
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="dialog-header"
            className={cn('flex flex-col gap-1.5 text-left border-b-[3px] border-black pb-3 mb-3 relative', className)}
            {...props}
        />
    );
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="dialog-footer"
            className={cn(
                'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-4 mt-2 border-t-[2px] border-dashed border-black/20',
                className,
            )}
            {...props}
        />
    );
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
    return (
        <DialogPrimitive.Title
            data-slot="dialog-title"
            className={cn(
                'font-serif text-[1.35rem] font-black leading-none tracking-[-0.02em] uppercase text-black [text-wrap:balance]',
                className,
            )}
            style={{ fontFamily: 'Newsreader, Georgia, serif' }}
            {...props}
        />
    );
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
    return (
        <DialogPrimitive.Description
            data-slot="dialog-description"
            className={cn('text-[13px] leading-[1.45] font-medium text-black/65 border-l-[3px] border-black/15 pl-2.5 italic', className)}
            style={{ fontFamily: 'Roboto, system-ui, sans-serif' }}
            {...props}
        />
    );
}

export { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger };
