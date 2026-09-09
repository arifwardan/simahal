import { Link, usePage } from '@inertiajs/react';
import { edit as profileEdit } from '@/routes/profile';
import {
    Award,
    BookMarked,
    CalendarCheck,
    CalendarDays,
    FileUp,
    FolderGit2,
    GraduationCap,
    HeartHandshake,
    History,
    LayoutGrid,
    Library,
    Mic,
    Settings,
    Target,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
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
import { index as excelImportIndex } from '@/routes/admin/excel-import';
import { index as halaqahsIndex } from '@/routes/admin/halaqahs';
import { index as mutabaahBulananIndex } from '@/routes/admin/mutabaah-bulanan';
import { edit as mutabaahSettingsEdit } from '@/routes/admin/mutabaah-settings';
import { index as orangTuasIndex } from '@/routes/admin/orang-tuas';
import { index as santrisIndex } from '@/routes/admin/santris';
import { index as usersIndex } from '@/routes/admin/users';
import { index as muhafidzsIndex } from '@/routes/admin/muhafidzs';
import { index as muhafidzHalaqahsIndex } from '@/routes/muhafidz/halaqahs';
import { history as muhafidzMutabaahsHistory } from '@/routes/muhafidz/mutabaahs';
import { index as setoranHarianIndex } from '@/routes/muhafidz/setoran-harian';
import { index as tasmiIndex } from '@/routes/muhafidz/tasmi';
import { index as ujianIndex } from '@/routes/muhafidz/ujian';
import { index as muhafidzTargetsIndex } from '@/routes/muhafidz/targets';
import type { NavItem } from '@/types';

const adminNavItems: NavItem[] = [
    { title: 'Manajemen User', href: usersIndex(), icon: Users },
    { title: 'Manajemen Santri', href: santrisIndex(), icon: GraduationCap },
    { title: 'Manajemen Muhafidz', href: muhafidzsIndex(), icon: BookMarked },
    { title: 'Manajemen Orang Tua', href: orangTuasIndex(), icon: HeartHandshake },
    { title: 'Manajemen Halaqah', href: halaqahsIndex(), icon: FolderGit2 },
    { title: 'Mutabaah Bulanan', href: mutabaahBulananIndex(), icon: CalendarCheck },
    { title: 'Pengaturan Mutabaah', href: mutabaahSettingsEdit(), icon: Settings },
    { title: 'Import Excel', href: excelImportIndex(), icon: FileUp },
];

const muhafidzNavItems: NavItem[] = [
    { title: 'Halaqah Saya', href: muhafidzHalaqahsIndex(), icon: Library },
    { title: 'Setoran Harian', href: setoranHarianIndex(), icon: CalendarDays },
    { title: 'Tasmi Pekanan', href: tasmiIndex(), icon: Mic },
    { title: 'Ujian Bulanan', href: ujianIndex(), icon: Award },
    { title: 'Riwayat Mutabaah', href: muhafidzMutabaahsHistory(), icon: History },
    { title: 'Target Hafalan', href: muhafidzTargetsIndex(), icon: Target },
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
        ...(auth.user?.role === 'muhafidz' ? muhafidzNavItems : []),
    ];

    return (
        <Sidebar collapsible="icon" variant="inset" className="border-r-2 border-black">
            <SidebarHeader className="border-b-2 border-black bg-primary">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="font-head font-black">
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

            <SidebarFooter className="gap-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip={{ children: 'Settings' }}>
                            <Link href={profileEdit()} prefetch>
                                <Settings />
                                <span>Settings</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
