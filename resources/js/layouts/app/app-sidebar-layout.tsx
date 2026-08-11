import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent
                variant="sidebar"
                className="relative overflow-hidden bg-gradient-to-br from-background via-background to-emerald-500/5 dark:to-emerald-500/10"
            >
                <div aria-hidden className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-24 right-10 size-72 rounded-full bg-emerald-400/10 blur-3xl" />
                    <div className="absolute bottom-0 left-10 size-64 rounded-full bg-sky-400/10 blur-3xl" />
                </div>
                <div className="relative z-10">
                    <AppSidebarHeader breadcrumbs={breadcrumbs} />
                    {children}
                </div>
            </AppContent>
        </AppShell>
    );
}
