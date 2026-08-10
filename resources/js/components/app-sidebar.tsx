import { Link, usePage } from '@inertiajs/react';
import {
    BookMarked,
    BookOpen,
    FolderGit2,
    GraduationCap,
    HeartHandshake,
    LayoutGrid,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { index as halaqahsIndex } from '@/routes/admin/halaqahs';
import { index as orangTuasIndex } from '@/routes/admin/orang-tuas';
import { index as santrisIndex } from '@/routes/admin/santris';
import { index as ustadzsIndex } from '@/routes/admin/ustadzs';
import { index as usersIndex } from '@/routes/admin/users';
import type { NavItem } from '@/types';

const adminNavItems: NavItem[] = [
    { title: 'Manajemen User', href: usersIndex(), icon: Users },
    { title: 'Manajemen Santri', href: santrisIndex(), icon: GraduationCap },
    { title: 'Manajemen Ustadz', href: ustadzsIndex(), icon: BookMarked },
    { title: 'Manajemen Orang Tua', href: orangTuasIndex(), icon: HeartHandshake },
    { title: 'Manajemen Halaqah', href: halaqahsIndex(), icon: FolderGit2 },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: FolderGit2,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    const { auth } = usePage().props;

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
        },
        ...(auth.user?.role === 'admin' ? adminNavItems : []),
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
