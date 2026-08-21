import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    return (
        <header className="flex min-h-16 shrink-0 items-center justify-between gap-4 border-b border-[#ddcfbd] bg-[#fffaf2]/90 px-4 backdrop-blur-md transition-[width,height] ease-linear md:px-6">
            <div className="flex min-w-0 items-center gap-3">
                <SidebarTrigger className="size-11 shrink-0 rounded-xl text-[#5f4b3f] hover:bg-[#eadfce] hover:text-[#c94720] focus-visible:ring-2 focus-visible:ring-[#d8562a]" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-[#ddcfbd] bg-[#f6efe4] px-3 py-1.5 text-xs font-semibold text-[#6d5a4e] sm:flex">
                <span className="size-2 rounded-full bg-[#4f795d]" aria-hidden="true" />
                Espace administrateur
            </div>
        </header>
    );
}
