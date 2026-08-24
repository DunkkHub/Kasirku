import { phoneHref } from '@/lib/customer';
import { cn } from '@/lib/utils';
import type { RestaurantSettings } from '@/types/models';
import { Clock3, Instagram, MapPin, Phone, Pizza } from 'lucide-react';
import type { ReactNode } from 'react';

export function CustomerBrand({ settings, compact = false }: { settings: RestaurantSettings; compact?: boolean }) {
    return (
        <span className="inline-flex min-w-0 items-center gap-3">
            {settings.logo_path ? (
                <img
                    src={settings.logo_path}
                    alt={`${settings.restaurant_name} logo`}
                    className={cn('h-14 w-auto max-w-28 object-contain sm:h-16', compact && 'h-11 max-w-20 sm:h-12')}
                    loading="eager"
                    decoding="async"
                />
            ) : (
                <span
                    className={cn(
                        'grid size-12 shrink-0 place-items-center rounded-2xl border border-white/12 bg-white/6 text-[#ff7a30]',
                        compact && 'size-10',
                    )}
                    aria-hidden="true"
                >
                    <Pizza className="size-6" />
                </span>
            )}
            <span className={cn('min-w-0', compact && 'hidden sm:block')}>
                <span className="block truncate text-sm font-black tracking-[0.18em] text-[#fff6e8] uppercase">{settings.restaurant_name}</span>
                {settings.show_halal_badge && <span className="mt-1 inline-flex text-[0.68rem] font-bold text-[#ff9c62]">Halal</span>}
            </span>
        </span>
    );
}

export function CustomerHeader({ settings }: { settings: RestaurantSettings }) {
    const href = phoneHref(settings.phone);

    return (
        <header className="sticky top-0 z-40 border-b border-white/8 bg-[#090807]/92 backdrop-blur-xl">
            <a
                href="#main-content"
                className="fixed top-2 left-2 z-[60] -translate-y-20 rounded-lg bg-[#fff6e8] px-4 py-3 font-bold text-[#170b05] transition-transform focus:translate-y-0"
            >
                Aller au contenu
            </a>
            <div className="customer-container flex min-h-18 items-center justify-between gap-3 py-3">
                <a
                    href="/"
                    className="min-w-0 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a30] focus-visible:ring-offset-4 focus-visible:ring-offset-[#090807]"
                >
                    <CustomerBrand settings={settings} compact />
                </a>

                <nav className="hidden items-center gap-7 text-sm font-semibold text-[#c9bfb1] lg:flex" aria-label="Navigation principale">
                    <a className="customer-nav-link" href="#carte">
                        La carte
                    </a>
                    <a className="customer-nav-link" href="#infos">
                        Infos
                    </a>
                </nav>

                {href && (
                    <a
                        href={href}
                        className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold text-[#efe5d5] transition-colors hover:bg-white/6 focus-visible:ring-2 focus-visible:ring-[#ff7a30] focus-visible:outline-none sm:px-4"
                        aria-label={`Appeler ${settings.restaurant_name}`}
                    >
                        <Phone className="size-4 text-[#ff7a30]" aria-hidden="true" />
                        <span className="hidden sm:inline">{settings.phone}</span>
                    </a>
                )}
            </div>
        </header>
    );
}

export function ProductImage({ src, alt, className, eager = false }: { src: string | null; alt: string; className?: string; eager?: boolean }) {
    if (src) {
        return (
            <img src={src} alt={alt} className={cn('h-full w-full object-cover', className)} loading={eager ? 'eager' : 'lazy'} decoding="async" />
        );
    }

    return (
        <div
            className={cn('customer-product-placeholder grid h-full w-full place-items-center', className)}
            role="img"
            aria-label={`${alt}, photo indisponible`}
        >
            <Pizza className="size-10 text-[#ff7a30]/70" aria-hidden="true" />
        </div>
    );
}

export function CustomerFooter({ settings }: { settings: RestaurantSettings }) {
    const href = phoneHref(settings.phone);

    return (
        <footer id="infos" className="border-t border-white/8 bg-[#080706]">
            <div className="customer-container grid gap-8 py-10 md:grid-cols-[1.2fr_1fr_1fr] md:py-12">
                <div>
                    <CustomerBrand settings={settings} />
                    {settings.description && <p className="mt-4 max-w-sm text-sm leading-6 text-[#a99f92]">{settings.description}</p>}
                </div>
                {settings.address && (
                    <FooterInfo icon={<MapPin className="size-5" aria-hidden="true" />} title="Adresse">
                        {settings.google_maps_url ? (
                            <a href={settings.google_maps_url} className="hover:text-[#fff6e8]" target="_blank" rel="noreferrer">
                                {settings.address}
                            </a>
                        ) : (
                            settings.address
                        )}
                    </FooterInfo>
                )}
                {settings.opening_hours && (
                    <FooterInfo icon={<Clock3 className="size-5" aria-hidden="true" />} title="Horaires">
                        {settings.opening_hours.split('\n').map((line) => (
                            <span key={line} className="block">
                                {line}
                            </span>
                        ))}
                    </FooterInfo>
                )}
            </div>
            <div className="customer-container flex flex-col gap-3 border-t border-white/8 py-5 text-xs text-[#7f776d] sm:flex-row sm:items-center sm:justify-between">
                <span>
                    © {new Date().getFullYear()} {settings.restaurant_name}
                </span>
                <span className="flex flex-wrap gap-3">
                    {href && (
                        <a href={href} className="hover:text-[#fff6e8]">
                            {settings.phone}
                        </a>
                    )}
                    {settings.instagram_url && (
                        <a
                            href={settings.instagram_url}
                            className="inline-flex items-center gap-1 hover:text-[#fff6e8]"
                            target="_blank"
                            rel="noreferrer"
                        >
                            <Instagram className="size-3.5" aria-hidden="true" />
                            Instagram
                        </a>
                    )}
                    {settings.facebook_url && (
                        <a href={settings.facebook_url} className="hover:text-[#fff6e8]" target="_blank" rel="noreferrer">
                            Facebook
                        </a>
                    )}
                </span>
            </div>
        </footer>
    );
}

function FooterInfo({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
    return (
        <div className="flex items-start gap-3">
            <span className="mt-0.5 text-[#ff7a30]">{icon}</span>
            <div>
                <p className="mb-1 text-sm font-bold text-[#fff6e8]">{title}</p>
                <div className="text-sm leading-6 text-[#a99f92]">{children}</div>
            </div>
        </div>
    );
}
