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
                'fixed inset-0 z-50 bg-[#0f0f0f]/75 backdrop-blur-[1.5px] duration-200',
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
                        // realistic layered shadow = paper lifted off table
                        'shadow-[6px_6px_0px_0px_rgba(0,0,0,1),14px_14px_30px_rgba(0,0,0,0.28),0_0_0_1px_rgba(0,0,0,0.04)_inset]',
                        'duration-200 will-change-transform',
                        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-[0.97] data-[state=open]:zoom-in-[0.97]',
                        className,
                    )}
                    style={
                        {
                            // keep it perfectly centered - flex parent handles centering, small rotation for popout but origin center
                            transformOrigin: 'center center',
                        } as React.CSSProperties
                    }
                    {...props}
                >
                    {/* === PAPER TEXTURE STACK (more realistic) === */}
                    {/* base paper gradient - slight yellowing like aged newsprint */}
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0"
                        style={{
                            background:
                                'linear-gradient(180deg, #FFFEF2 0%, #FFF9E6 48%, #F5ECD2 100%), radial-gradient(ellipse at 20% 15%, rgba(255,255,255,0.9), transparent 60%), radial-gradient(ellipse at 80% 85%, rgba(0,0,0,0.04), transparent 55%)',
                        }}
                    />
                    {/* fiber grain - higher opacity */}
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 opacity-[0.11] mix-blend-multiply"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='5' seed='5' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.42'/%3E%3C/svg%3E")`,
                            backgroundSize: '220px 220px',
                        }}
                    />
                    {/* second grain layer - fine */}
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 opacity-[0.06]"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='m'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.95' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23m)' opacity='0.5'/%3E%3C/svg%3E")`,
                        }}
                    />
                    {/* crumple wrinkles - multiple diagonal creases with blur */}
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 opacity-[0.09]"
                        style={{
                            backgroundImage: `linear-gradient(115deg, transparent 30%, rgba(0,0,0,0.55) 31.2%, transparent 31.8%, transparent 62%, rgba(0,0,0,0.35) 63%, transparent 63.6%), linear-gradient(28deg, transparent 44%, rgba(0,0,0,0.4) 45.2%, transparent 45.9%), linear-gradient(172deg, transparent 68%, rgba(0,0,0,0.3) 69%, transparent 69.7%)`,
                            filter: 'blur(0.3px)',
                        }}
                    />
                    {/* soft shadow folds - blobby darkening like pressed paper */}
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 opacity-[0.10]"
                        style={{
                            backgroundImage:
                                'radial-gradient(ellipse 420px 180px at 18% 22%, rgba(0,0,0,0.18), transparent 62%), radial-gradient(ellipse 360px 200px at 88% 38%, rgba(0,0,0,0.12), transparent 60%), radial-gradient(ellipse 500px 140px at 45% 92%, rgba(0,0,0,0.10), transparent 65%), radial-gradient(ellipse 160px 160px at 72% 18%, rgba(0,0,0,0.07), transparent 70%)',
                        }}
                    />
                    {/* highlight ridge along center fold */}
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 opacity-[0.07]"
                        style={{
                            backgroundImage:
                                'linear-gradient(102deg, transparent 49.6%, rgba(255,255,255,0.9) 50%, transparent 50.4%)',
                        }}
                    />
                    {/* inner edge darkening like paper thickness */}
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 shadow-[inset_0_0_18px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)]"
                    />
                    {/* deckle/torn edge - subtle irregular border via mask instead of clipPath so shadow stays */}
                    <div
                        aria-hidden
                        className="pointer-events-none absolute -inset-[1.5px] border-[1.5px] border-black/8"
                        style={{
                            clipPath:
                                'polygon(0.7% 0.6%, 2.4% 0.2%, 6% 0.9%, 10% 0.15%, 15% 0.7%, 21% 0.2%, 28% 0.8%, 36% 0.25%, 44% 0.7%, 52% 0.15%, 60% 0.65%, 69% 0.2%, 77% 0.75%, 84% 0.2%, 90% 0.6%, 95% 0.25%, 99.3% 0.7%, 99.5% 3%, 99.2% 9%, 99.6% 16%, 99.2% 24%, 99.5% 36%, 99.2% 48%, 99.6% 60%, 99.2% 73%, 99.6% 84%, 99.3% 92%, 99.5% 97.5%, 97.6% 99.4%, 92% 99.2%, 84% 99.6%, 75% 99.2%, 64% 99.5%, 52% 99.3%, 40% 99.6%, 28% 99.2%, 16% 99.5%, 7% 99.3%, 1.8% 99.4%, 0.4% 97%, 0.6% 90%, 0.2% 81%, 0.7% 70%, 0.2% 58%, 0.6% 45%, 0.2% 32%, 0.6% 20%, 0.2% 10%, 0.5% 3%)',
                        }}
                    />

                    {/* tape - more realistic scotch tape with highlight */}
                    <div
                        aria-hidden
                        className="absolute -top-[13px] left-1/2 h-[20px] w-[112px] -translate-x-1/2 -rotate-[1.4deg] border border-black/10 bg-[#FFF2A8]/78 shadow-[0_1px_4px_rgba(0,0,0,0.18),0_1px_0_rgba(255,255,255,0.65)_inset] backdrop-blur-[0.5px]"
                        style={{
                            clipPath: 'polygon(1.5% 12%, 98.5% 6%, 99% 88%, 1% 94%)',
                        }}
                    >
                        <div className="absolute inset-0 opacity-[0.18] bg-[repeating-linear-gradient(90deg,transparent,transparent_10px,rgba(0,0,0,0.07)_10px,rgba(0,0,0,0.07)_11px)]" />
                        <div className="absolute inset-x-0 top-[3px] h-[1px] bg-[#FFF7E8]/55" />
                        <div className="absolute inset-x-0 bottom-[2px] h-[5px] bg-black/[0.04] blur-[1px]" />
                    </div>
                    {/* second small tape piece bottom left for extra realism - optional subtle */}
                    <div
                        aria-hidden
                        className="absolute -bottom-[9px] left-[18%] hidden h-[14px] w-[64px] rotate-[-8deg] border border-black/10 bg-[#FFF2A8]/60 shadow-[0_1px_2px_rgba(0,0,0,0.12)] sm:block"
                        style={{ clipPath: 'polygon(3% 10%, 97% 4%, 98% 90%, 2% 96%)' }}
                    />

                    {/* folded dog-ear - more 3D */}
                    <div
                        aria-hidden
                        className="absolute right-0 bottom-0 h-[24px] w-[24px] bg-[#E9DDC0] border-l border-t border-black/25 shadow-[-3px_-3px_8px_rgba(0,0,0,0.14)]"
                        style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)' }}
                    />
                    <div
                        aria-hidden
                        className="absolute right-[5px] bottom-[5px] h-[14px] w-[14px] bg-black/10 blur-[1.5px]"
                        style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)' }}
                    />

                    {/* content */}
                    <div className="relative flex flex-1 flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-[18px] sm:p-6 [scrollbar-width:thin]">
                            {/* subtle masthead line */}
                            <div className="mb-3 hidden h-[2px] bg-black sm:block" />
                            {children}
                        </div>
                    </div>

                    <DialogPrimitive.Close className="absolute top-2.5 right-2.5 inline-flex h-7 w-7 items-center justify-center border-[2.5px] border-black bg-[#FFF7E8] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFEF2] cursor-pointer [&_svg]:size-4">
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
