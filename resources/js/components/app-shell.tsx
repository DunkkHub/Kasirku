import { SidebarProvider } from '@/components/ui/sidebar';
import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

interface AppShellProps {
    children: React.ReactNode;
    variant?: 'header' | 'sidebar';
}

export function AppShell({ children, variant = 'header' }: AppShellProps) {
    const isOpen = usePage<SharedData>().props.sidebarOpen;

    if (variant === 'header') {
        return <div className="flex min-h-screen w-full flex-col">{children}</div>;
    }

    return (
        <SidebarProvider
            defaultOpen={isOpen}
            className="bg-[#17130f] antialiased [--accent-foreground:#2a211b] [--accent:#f0dfca] [--background:#f6efe4] [--border:#ddcfbd] [--card-foreground:#241b16] [--card:#fffaf2] [--chart-1:#d8562a] [--chart-2:#436b52] [--chart-3:#d59b3f] [--chart-4:#8f4b35] [--chart-5:#76685b] [--destructive-foreground:#fff8ec] [--destructive:#b42318] [--foreground:#241b16] [--input:#d9c9b5] [--muted-foreground:#75675b] [--muted:#eee3d4] [--popover-foreground:#241b16] [--popover:#fffaf2] [--primary-foreground:#fffaf2] [--primary:#c94720] [--ring:#d8562a] [--secondary-foreground:#352820] [--secondary:#eadfce] [--sidebar-accent-foreground:#fff3df] [--sidebar-accent:#35261d] [--sidebar-border:#3b2d24] [--sidebar-foreground:#f5e9d6] [--sidebar-primary-foreground:#fffaf2] [--sidebar-primary:#d8562a] [--sidebar-ring:#f09363] [--sidebar:#17130f]"
        >
            {children}
        </SidebarProvider>
    );
}
