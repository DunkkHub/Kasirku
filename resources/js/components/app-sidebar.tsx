import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { ChartBarStacked, LayoutDashboard, ShoppingBag, UtensilsCrossed } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Vue d’ensemble',
        href: '/admin/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Commandes',
        href: '/admin/orders',
        icon: ShoppingBag,
    },
    {
        title: 'Carte & produits',
        href: '/admin/products',
        icon: UtensilsCrossed,
    },
    {
        title: 'Catégories',
        href: '/admin/categories',
        icon: ChartBarStacked,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset" className="border-none">
            <SidebarHeader className="p-3 pb-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            asChild
                            className="min-h-14 rounded-2xl border border-white/8 bg-white/[0.04] px-2.5 hover:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-[#f09363]"
                        >
                            <Link href="/admin/dashboard" aria-label="Accueil administration Teisseire Pizza" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="px-1 pt-4">
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter className="border-t border-white/8 p-3">
                <div className="mb-1 rounded-xl border border-[#d8562a]/20 bg-[#d8562a]/10 px-3 py-2.5 group-data-[collapsible=icon]:hidden">
                    <p className="text-[0.65rem] font-bold tracking-[0.18em] text-[#f09363] uppercase">Teisseire Pizza</p>
                    <p className="mt-1 text-xs leading-relaxed text-[#d8c7b4]">Espace de gestion du restaurant</p>
                </div>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
