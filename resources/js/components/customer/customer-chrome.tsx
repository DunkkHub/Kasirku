import { cn } from '@/lib/utils';
import { ArrowLeft, Clock3, MapPin, Phone, Pizza } from 'lucide-react';
import type { ReactNode } from 'react';

interface CustomerHeaderProps {
    backHref?: string;
    context?: string;
}

export function CustomerBrand({ compact = false }: { compact?: boolean }) {
    return (
        <span className="inline-flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full border border-[#ff7a30]/40 bg-[#ff6b22] text-[#170b05] shadow-[0_0_28px_rgba(255,107,34,0.2)] sm:size-11">
                <Pizza className="size-5" aria-hidden="true" />
            </span>
            <span className={cn('leading-none', compact && 'hidden min-[380px]:block')}>
                <span className="customer-display block text-lg tracking-[0.04em] text-[#fff6e8] sm:text-xl">Teisseire</span>
                <span className="mt-1 block text-[0.62rem] font-bold tracking-[0.32em] text-[#ff7a30] uppercase">Pizza · Halal</span>
            </span>
        </span>
    );
}

export function CustomerHeader({ backHref, context }: CustomerHeaderProps) {
    return (
        <header className="sticky top-0 z-40 border-b border-white/8 bg-[#090807]/92 backdrop-blur-xl">
            <a
                href="#main-content"
                className="fixed top-2 left-2 z-[60] -translate-y-20 rounded-lg bg-[#fff6e8] px-4 py-3 font-bold text-[#170b05] transition-transform focus:translate-y-0"
            >
                Aller au contenu
            </a>
            <div className="customer-container flex min-h-18 items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-2 sm:gap-4">
                    {backHref && (
                        <a href={backHref} className="customer-icon-button" aria-label="Retour à la carte">
                            <ArrowLeft className="size-5" aria-hidden="true" />
                        </a>
                    )}
                    <a
                        href="/"
                        className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a30] focus-visible:ring-offset-4 focus-visible:ring-offset-[#090807]"
                    >
                        <CustomerBrand compact={Boolean(backHref)} />
                    </a>
                    {context && <span className="hidden border-l border-white/12 pl-4 text-sm font-semibold text-[#c9bfb1] md:block">{context}</span>}
                </div>

                {!backHref && (
                    <nav className="hidden items-center gap-7 text-sm font-semibold text-[#c9bfb1] lg:flex" aria-label="Navigation principale">
                        <a className="customer-nav-link" href="#carte">
                            La carte
                        </a>
                        <a className="customer-nav-link" href="#formules">
                            Les formules
                        </a>
                        <a className="customer-nav-link" href="#infos">
                            Infos
                        </a>
                    </nav>
                )}

                <div className="flex items-center gap-2">
                    <a
                        href="tel:+33634614047"
                        className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold text-[#efe5d5] transition-colors hover:bg-white/6 focus-visible:ring-2 focus-visible:ring-[#ff7a30] focus-visible:outline-none sm:px-4"
                        aria-label="Appeler Teisseire Pizza"
                    >
                        <Phone className="size-4 text-[#ff7a30]" aria-hidden="true" />
                        <span className="hidden sm:inline">06 34 61 40 47</span>
                    </a>
                </div>
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

export function InfoPill({ icon, children }: { icon: ReactNode; children: ReactNode }) {
    return (
        <span className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full border border-white/12 bg-black/25 px-3 py-1.5 text-xs font-bold tracking-wide text-[#f4eadb] backdrop-blur-sm">
            {icon}
            {children}
        </span>
    );
}

export function CustomerFooter() {
    return (
        <footer id="infos" className="border-t border-white/8 bg-[#080706]">
            <div className="customer-container grid gap-8 py-10 md:grid-cols-[1.2fr_1fr_1fr] md:py-12">
                <div>
                    <CustomerBrand />
                    <p className="mt-4 max-w-sm text-sm leading-6 text-[#a99f92]">
                        Pizzas 33 cm préparées sur place, recettes généreuses et viande halal.
                    </p>
                </div>
                <FooterInfo icon={<MapPin className="size-5" aria-hidden="true" />} title="Nous trouver">
                    <a href="https://maps.google.com/?q=75+rue+Leon+Jouhaux" className="hover:text-[#fff6e8]">
                        75 rue Léon Jouhaux
                    </a>
                </FooterInfo>
                <FooterInfo icon={<Clock3 className="size-5" aria-hidden="true" />} title="Horaires">
                    Lundi au dimanche
                    <br />
                    18 h – 22 h 30
                </FooterInfo>
            </div>
            <div className="customer-container flex flex-col gap-2 border-t border-white/8 py-5 text-xs text-[#7f776d] sm:flex-row sm:items-center sm:justify-between">
                <span>© {new Date().getFullYear()} Teisseire Pizza</span>
                <span>Sur place · À emporter · Livraison</span>
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
