import { CustomerBrand } from '@/components/customer/customer-chrome';
import { Head } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, ChevronRight, Clock3, Home } from 'lucide-react';

interface OrderOutcomeProps {
    variant: 'success' | 'pending' | 'error';
    title: string;
    description: string;
    primaryHref: string;
    primaryLabel: string;
    secondaryHref?: string;
    secondaryLabel?: string;
}

const outcomeStyle = {
    success: { icon: CheckCircle2, iconClass: 'bg-emerald-400/12 text-emerald-300', eyebrow: 'Commande confirmée' },
    pending: { icon: Clock3, iconClass: 'bg-amber-400/12 text-amber-300', eyebrow: 'Action nécessaire' },
    error: { icon: AlertCircle, iconClass: 'bg-red-400/12 text-red-300', eyebrow: 'Paiement interrompu' },
};

export function OrderOutcome({
    variant,
    title,
    description,
    primaryHref,
    primaryLabel,
    secondaryHref = '/',
    secondaryLabel = 'Retour à la carte',
}: OrderOutcomeProps) {
    const style = outcomeStyle[variant];
    const Icon = style.icon;
    return (
        <div className="customer-theme grid min-h-screen grid-rows-[auto_1fr_auto]">
            <Head title={`${title} — Teisseire Pizza`} />
            <header className="customer-container flex min-h-20 items-center py-4">
                <a href="/" className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b22]">
                    <CustomerBrand />
                </a>
            </header>
            <main className="customer-container grid place-items-center py-10">
                <section className="customer-card customer-enter w-full max-w-lg p-6 text-center sm:p-10" aria-labelledby="outcome-title">
                    <span className={`mx-auto grid size-16 place-items-center rounded-full ${style.iconClass}`}>
                        <Icon className="size-8" aria-hidden="true" />
                    </span>
                    <p className="mt-6 text-xs font-bold tracking-[0.2em] text-[#ff7a30] uppercase">{style.eyebrow}</p>
                    <h1 id="outcome-title" className="customer-display mt-2 text-3xl text-[#fff6e8] sm:text-4xl">
                        {title}
                    </h1>
                    <p className="mx-auto mt-4 max-w-md leading-7 text-[#a99f92]">{description}</p>
                    <div className="mt-8 grid gap-3">
                        <a href={primaryHref} className="customer-primary-button w-full">
                            {primaryLabel}
                            <ChevronRight className="size-4" aria-hidden="true" />
                        </a>
                        <a href={secondaryHref} className="customer-secondary-button w-full">
                            <Home className="size-4" aria-hidden="true" />
                            {secondaryLabel}
                        </a>
                    </div>
                </section>
            </main>
            <footer className="customer-container py-6 text-center text-xs text-[#887f74]">
                Besoin d’aide ?{' '}
                <a href="tel:+33634614047" className="text-[#ff9c62] underline-offset-4 hover:underline">
                    06 34 61 40 47
                </a>
            </footer>
        </div>
    );
}
