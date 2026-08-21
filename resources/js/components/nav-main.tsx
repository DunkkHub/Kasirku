import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();
    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel className="px-3 text-[0.65rem] font-bold tracking-[0.18em] text-[#a99581] uppercase">Gestion</SidebarGroupLabel>
            <SidebarMenu className="gap-1.5">
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={page.url.startsWith(item.href)}
                            tooltip={{ children: item.title }}
                            className="min-h-11 rounded-xl px-3 text-[#ddcfbd] transition-colors hover:bg-white/[0.07] hover:text-[#fff7e9] focus-visible:ring-2 focus-visible:ring-[#f09363] data-[active=true]:bg-[#d8562a] data-[active=true]:font-bold data-[active=true]:text-white data-[active=true]:shadow-[0_8px_22px_rgba(216,86,42,0.22)] [&>svg]:size-[1.125rem]"
                        >
                            <Link href={item.href} prefetch>
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
