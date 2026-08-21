import AppLogoIcon from '@/components/app-logo-icon';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: PropsWithChildren<AuthLayoutProps>) {
    return (
        <main className="customer-theme relative isolate min-h-svh overflow-x-clip">
            <div
                aria-hidden="true"
                className="absolute inset-0 -z-20 bg-[url('/images/teisseire-pizza-hero.webp')] bg-cover bg-[position:68%_center] bg-no-repeat"
            />
            <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(7,6,5,0.99)_0%,rgba(7,6,5,0.96)_36%,rgba(7,6,5,0.7)_58%,rgba(7,6,5,0.12)_100%)] max-lg:bg-[linear-gradient(180deg,rgba(7,6,5,0.72)_0%,rgba(7,6,5,0.98)_35%,rgba(7,6,5,1)_100%)]"
            />

            <div className="mx-auto grid min-h-svh w-full max-w-[100rem] lg:grid-cols-[minmax(0,38rem)_1fr]">
                <section className="flex min-h-svh flex-col px-5 py-5 sm:px-8 sm:py-7 lg:border-r lg:border-white/10 lg:bg-black/20 lg:px-12 lg:py-9 lg:backdrop-blur-[2px]">
                    <Link
                        href={route('home')}
                        aria-label="Retour à la carte Teisseire Pizza"
                        className="group inline-flex min-h-12 w-fit items-center gap-3 rounded-full pr-3 outline-none focus-visible:ring-2 focus-visible:ring-[var(--customer-ember-light)] focus-visible:ring-offset-4 focus-visible:ring-offset-[#0a0908]"
                    >
                        <span className="grid size-12 place-items-center rounded-full bg-[var(--customer-ember)] shadow-[0_10px_30px_rgba(255,80,14,0.2)] transition-colors duration-200 group-hover:bg-[#ff8341]">
                            <AppLogoIcon aria-hidden="true" className="size-10" />
                        </span>
                        <span className="leading-none">
                            <span className="customer-display block text-xl tracking-tight text-[var(--customer-cream)]">Teisseire</span>
                            <span className="mt-1.5 block text-[0.65rem] font-bold tracking-[0.3em] text-[var(--customer-ember-light)]">
                                PIZZA · HALAL
                            </span>
                        </span>
                    </Link>

                    <div className="flex flex-1 items-center py-8 sm:py-10">
                        <div className="customer-card customer-enter w-full max-w-md bg-[rgba(18,15,13,0.94)] p-6 shadow-[0_26px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:p-8">
                            <div className="mb-7 space-y-3">
                                <p className="text-xs font-bold tracking-[0.22em] text-[var(--customer-ember-light)] uppercase">Espace sécurisé</p>
                                <h1 className="customer-display text-3xl leading-tight text-balance text-[var(--customer-cream)] sm:text-4xl">
                                    {title}
                                </h1>
                                <p className="max-w-sm text-base leading-6 text-[#c7bcad]">{description}</p>
                            </div>
                            {children}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#a99d8e]">
                        <span>75 rue Léon Jouhaux</span>
                        <span aria-hidden="true" className="size-1 rounded-full bg-[var(--customer-ember)]" />
                        <a
                            href="tel:+33634614047"
                            className="inline-flex min-h-11 items-center rounded-sm transition-colors duration-200 hover:text-[var(--customer-cream)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--customer-ember-light)]"
                        >
                            06 34 61 40 47
                        </a>
                    </div>
                </section>

                <aside aria-hidden="true" className="relative hidden min-h-svh lg:block">
                    <div className="absolute right-10 bottom-10 max-w-sm rounded-2xl border border-white/10 bg-black/35 p-5 backdrop-blur-md xl:right-16 xl:bottom-14">
                        <p className="text-xs font-bold tracking-[0.2em] text-[var(--customer-ember-light)] uppercase">Service du soir</p>
                        <p className="customer-display mt-2 text-2xl text-[var(--customer-cream)]">Du lundi au dimanche</p>
                        <p className="mt-1 text-sm text-[#ded3c4]">18h00 — 22h30 · Pizzas 33 cm</p>
                    </div>
                </aside>
            </div>
        </main>
    );
}
