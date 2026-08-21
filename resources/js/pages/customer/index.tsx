import { CustomerFooter, CustomerHeader, InfoPill, ProductImage } from '@/components/customer/customer-chrome';
import { formatMoney, getProductImage, type StorefrontConfig } from '@/lib/customer';
import type { Category, Pagination, Product } from '@/types/models';
import { Head, router } from '@inertiajs/react';
import { BadgeCheck, Bike, ChevronRight, Clock3, Flame, MapPin, PackageCheck, PhoneCall, Pizza, Search, UtensilsCrossed } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface Props {
    products: Product[];
    categories: Category[];
    pagination?: Pagination;
    currency?: string;
    locale?: string;
    delivery_fee?: number;
    store_config?: StorefrontConfig;
}

export default function CustomerIndex({
    products: incomingProducts,
    categories,
    pagination,
    currency = 'EUR',
    locale = 'fr-FR',
    delivery_fee = 3,
    store_config,
}: Props) {
    const money = useMemo(
        () => ({ currency: store_config?.currency ?? currency, locale: store_config?.locale ?? locale }),
        [currency, locale, store_config?.currency, store_config?.locale],
    );
    const deliveryFee = store_config?.delivery_fee ?? delivery_fee;
    const [products, setProducts] = useState(incomingProducts);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [category, setCategory] = useState('all');
    const [isFiltering, setIsFiltering] = useState(false);
    const [currentPage, setCurrentPage] = useState(pagination?.current_page ?? 1);
    const [hasMore, setHasMore] = useState(pagination?.has_more_pages ?? false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const loadMoreTarget = useRef<HTMLDivElement>(null);
    const firstFilterRun = useRef(true);

    useEffect(() => {
        setProducts(incomingProducts);
        setCurrentPage(pagination?.current_page ?? 1);
        setHasMore(pagination?.has_more_pages ?? false);
    }, [incomingProducts, pagination]);

    useEffect(() => {
        const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
        return () => window.clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        if (firstFilterRun.current) {
            firstFilterRun.current = false;
            return;
        }

        router.get(
            '/',
            {
                ...(debouncedSearch ? { search: debouncedSearch } : {}),
                ...(category !== 'all' ? { category } : {}),
            },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
                only: ['products', 'pagination'],
                onStart: () => setIsFiltering(true),
                onFinish: () => setIsFiltering(false),
            },
        );
    }, [category, debouncedSearch]);

    const loadMore = useCallback(async () => {
        if (!hasMore || isLoadingMore) return;
        setIsLoadingMore(true);

        const params = new URLSearchParams({ page: String(currentPage + 1) });
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (category !== 'all') params.set('category', category);

        try {
            const response = await fetch(`/?${params.toString()}`, {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            if (!response.ok) return;

            const data = (await response.json()) as { products: Product[]; pagination: Pagination };
            setProducts((existing) => {
                const merged = new Map(existing.map((product) => [product.id, product]));
                data.products.forEach((product) => merged.set(product.id, product));
                return [...merged.values()];
            });
            setCurrentPage(data.pagination.current_page);
            setHasMore(data.pagination.has_more_pages);
        } finally {
            setIsLoadingMore(false);
        }
    }, [category, currentPage, debouncedSearch, hasMore, isLoadingMore]);

    useEffect(() => {
        const target = loadMoreTarget.current;
        if (!target) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) void loadMore();
            },
            { rootMargin: '320px' },
        );
        observer.observe(target);
        return () => observer.disconnect();
    }, [loadMore]);

    return (
        <div className="customer-theme">
            <Head title="Teisseire Pizza — La carte">
                <meta
                    name="description"
                    content="Consultez la carte digitale Teisseire Pizza, les formules, les prix et les informations du restaurant."
                />
                <link rel="preload" as="image" href="/images/teisseire-pizza-hero.webp" type="image/webp" fetchPriority="high" />
            </Head>
            <CustomerHeader />

            <main id="main-content">
                <section className="customer-hero flex items-end md:items-center" aria-labelledby="hero-title">
                    <div className="customer-container customer-enter relative z-10 py-12 md:py-20">
                        <div className="max-w-2xl">
                            <div className="mb-5 flex flex-wrap gap-2">
                                <InfoPill icon={<BadgeCheck className="size-4 text-[#ff7a30]" aria-hidden="true" />}>Viande halal</InfoPill>
                                <InfoPill icon={<Pizza className="size-4 text-[#ff7a30]" aria-hidden="true" />}>Pizzas 33 cm</InfoPill>
                                <InfoPill icon={<Clock3 className="size-4 text-[#ff7a30]" aria-hidden="true" />}>Ouvert jusqu’à 22 h 30</InfoPill>
                            </div>
                            <p className="mb-3 text-sm font-bold tracking-[0.22em] text-[#ff7a30] uppercase">Nouvelle équipe, nouvelles recettes</p>
                            <h1 id="hero-title" className="customer-display max-w-xl text-5xl leading-[0.98] text-[#fff6e8] sm:text-6xl md:text-7xl">
                                Le feu, la pâte, <span className="text-[#ff7a30]">la différence.</span>
                            </h1>
                            <p className="mt-6 max-w-lg text-base leading-7 text-[#d2c7b8] sm:text-lg">
                                Consultez les recettes, les formules et les prix de Teisseire Pizza avant de passer au restaurant ou d’appeler
                                l’équipe.
                            </p>
                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <a href="#carte" className="customer-primary-button">
                                    Voir la carte <ChevronRight className="size-4" aria-hidden="true" />
                                </a>
                                <a href="tel:+33634614047" className="customer-secondary-button">
                                    <PhoneCall className="size-4" aria-hidden="true" />
                                    Appeler le restaurant
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="border-y border-white/8 bg-[#100d0b]" aria-label="Services et adresse">
                    <div className="customer-container grid divide-y divide-white/8 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                        <ServiceItem icon={<UtensilsCrossed className="size-5" />} title="Sur place" text="Service du soir" />
                        <ServiceItem icon={<PackageCheck className="size-5" />} title="À emporter" text="Infos par téléphone" />
                        <ServiceItem
                            icon={<Bike className="size-5" />}
                            title="Livraison"
                            text={
                                deliveryFee > 0 ? `Frais indicatifs ${formatMoney(deliveryFee, money.currency, money.locale)}` : 'Infos par téléphone'
                            }
                        />
                    </div>
                </section>

                <section id="formules" className="customer-container scroll-mt-28 py-16 md:py-20" aria-labelledby="formules-title">
                    <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="mb-2 text-xs font-bold tracking-[0.2em] text-[#ff7a30] uppercase">À partager</p>
                            <h2 id="formules-title" className="customer-display text-3xl text-[#fff6e8] sm:text-4xl">
                                Les formules
                            </h2>
                        </div>
                        <p className="text-sm text-[#9f9587]">Des offres généreuses à consulter avant d’appeler ou de passer.</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <OfferCard
                            kicker="La grande tablée"
                            title="3 pizzas au choix"
                            detail="+ 1 bouteille de 1,5 L"
                            price="30 €"
                            icon={<Flame className="size-6" />}
                        />
                        <OfferCard
                            kicker="Le classique"
                            title="3 pizzas Margherita"
                            detail="Une valeur sûre à partager"
                            price="20 €"
                            icon={<Pizza className="size-6" />}
                        />
                    </div>
                </section>

                <section id="carte" className="scroll-mt-24 border-t border-white/8 bg-[#0c0a09] py-16 md:py-20" aria-labelledby="carte-title">
                    <div className="customer-container">
                        <div className="mb-7 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
                            <div>
                                <p className="mb-2 text-xs font-bold tracking-[0.2em] text-[#ff7a30] uppercase">Préparé sur place</p>
                                <h2 id="carte-title" className="customer-display text-3xl text-[#fff6e8] sm:text-4xl">
                                    Choisissez votre recette
                                </h2>
                            </div>
                            <label className="relative block w-full lg:w-80">
                                <span className="sr-only">Rechercher dans la carte</span>
                                <Search
                                    className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#887e71]"
                                    aria-hidden="true"
                                />
                                <input
                                    type="search"
                                    className="customer-field customer-search-field"
                                    placeholder="Rechercher une pizza…"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                />
                            </label>
                        </div>

                        <div className="customer-hide-scrollbar -mx-2 mb-7 flex gap-2 overflow-x-auto px-2 pb-2" aria-label="Filtrer par catégorie">
                            <button type="button" className="customer-chip" aria-pressed={category === 'all'} onClick={() => setCategory('all')}>
                                Toute la carte
                            </button>
                            {categories.map((item) => (
                                <button
                                    type="button"
                                    key={item.id}
                                    className="customer-chip"
                                    aria-pressed={category === String(item.id)}
                                    onClick={() => setCategory(String(item.id))}
                                >
                                    {item.name}
                                    {typeof item.products_count === 'number' && <span className="opacity-60">{item.products_count}</span>}
                                </button>
                            ))}
                        </div>

                        <div className="mb-5 flex min-h-6 items-center justify-between gap-3 text-sm text-[#958b7e]" aria-live="polite">
                            <span>
                                {pagination?.total ?? products.length} recette{(pagination?.total ?? products.length) === 1 ? '' : 's'}
                            </span>
                            {isFiltering && (
                                <span className="inline-flex items-center gap-2">
                                    <span className="size-2 animate-pulse rounded-full bg-[#ff6b22]" />
                                    Mise à jour…
                                </span>
                            )}
                        </div>

                        {products.length > 0 ? (
                            <div className="customer-stagger grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {products.map((product) => (
                                    <ProductCard key={product.id} product={product} money={money} />
                                ))}
                            </div>
                        ) : (
                            <div className="customer-card grid min-h-72 place-items-center p-8 text-center">
                                <div>
                                    <Search className="mx-auto mb-4 size-8 text-[#ff7a30]" aria-hidden="true" />
                                    <h3 className="text-lg font-bold text-[#fff6e8]">Aucune recette trouvée</h3>
                                    <p className="mt-2 text-sm text-[#9f9587]">Essayez un autre mot ou affichez toute la carte.</p>
                                    <button
                                        type="button"
                                        className="customer-secondary-button mt-5"
                                        onClick={() => {
                                            setSearch('');
                                            setCategory('all');
                                        }}
                                    >
                                        Réinitialiser
                                    </button>
                                </div>
                            </div>
                        )}

                        <div ref={loadMoreTarget} className="flex min-h-24 items-center justify-center" aria-live="polite">
                            {isLoadingMore && (
                                <span className="inline-flex items-center gap-2 text-sm text-[#9f9587]">
                                    <span className="size-2 animate-pulse rounded-full bg-[#ff6b22]" />
                                    Chargement des recettes…
                                </span>
                            )}
                        </div>
                    </div>
                </section>

                <section className="border-t border-white/8 bg-[#12100d] py-9">
                    <div className="customer-container flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-3">
                            <MapPin className="size-6 shrink-0 text-[#ff6b22]" aria-hidden="true" />
                            <div>
                                <p className="font-bold text-[#fff6e8]">75 rue Léon Jouhaux</p>
                                <p className="text-sm text-[#9f9587]">Ouvert tous les soirs de 18 h à 22 h 30</p>
                            </div>
                        </div>
                        <a href="tel:+33634614047" className="customer-secondary-button">
                            Appeler le 06 34 61 40 47
                        </a>
                    </div>
                </section>
            </main>

            <CustomerFooter />
        </div>
    );
}

function ServiceItem({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
    return (
        <div className="flex items-center gap-3 px-3 py-5 sm:justify-center sm:px-5">
            <span className="text-[#ff7a30]" aria-hidden="true">
                {icon}
            </span>
            <span>
                <strong className="block text-sm text-[#fff6e8]">{title}</strong>
                <span className="text-xs text-[#958b7e]">{text}</span>
            </span>
        </div>
    );
}

function OfferCard({ kicker, title, detail, price, icon }: { kicker: string; title: string; detail: string; price: string; icon: React.ReactNode }) {
    return (
        <article className="customer-card group relative overflow-hidden p-6 sm:p-7">
            <div
                className="absolute -right-10 -bottom-14 size-40 rounded-full border-[24px] border-[#ff6b22]/8 transition-colors group-hover:border-[#ff6b22]/12"
                aria-hidden="true"
            />
            <div className="relative flex items-start justify-between gap-4">
                <div>
                    <p className="mb-3 text-xs font-bold tracking-[0.16em] text-[#ff7a30] uppercase">{kicker}</p>
                    <h3 className="customer-display text-2xl text-[#fff6e8]">{title}</h3>
                    <p className="mt-2 text-sm text-[#a99f92]">{detail}</p>
                </div>
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#ff6b22]/12 text-[#ff7a30]" aria-hidden="true">
                    {icon}
                </span>
            </div>
            <div className="relative mt-6 flex items-end justify-between">
                <strong className="text-3xl text-[#fff6e8]">{price}</strong>
                <a
                    href="#carte"
                    className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-[#ff9c62] outline-none hover:text-[#fff6e8] focus-visible:underline"
                >
                    Voir les pizzas <ChevronRight className="size-4" />
                </a>
            </div>
        </article>
    );
}

function ProductCard({ product, money }: { product: Product; money: { currency: string; locale: string } }) {
    const unavailable = product.is_available === false;
    return (
        <article className="customer-card customer-product-card flex min-h-full flex-col">
            <div className="relative aspect-[4/3] overflow-hidden bg-[#17120f]">
                <ProductImage src={getProductImage(product)} alt={product.name} />
                {product.category && (
                    <span className="absolute top-3 left-3 rounded-full border border-white/15 bg-black/65 px-2.5 py-1 text-[0.68rem] font-bold tracking-wide text-[#f4eadb] uppercase backdrop-blur-sm">
                        {product.category.name}
                    </span>
                )}
                {unavailable && (
                    <span className="absolute inset-0 grid place-items-center bg-black/72 text-sm font-bold text-[#fff6e8]">Indisponible</span>
                )}
            </div>
            <div className="flex flex-1 flex-col p-4">
                <h3 className="text-lg font-bold text-[#fff6e8]">{product.name}</h3>
                <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-[#9f9587]">
                    {product.description || 'Recette généreuse, préparée sur place.'}
                </p>
                <div className="mt-5 flex items-center justify-between gap-3">
                    <strong className="text-lg text-[#ff9c62] tabular-nums">
                        {formatMoney(Number(product.price), money.currency, money.locale)}
                    </strong>
                    {unavailable && <span className="text-xs font-semibold text-[#c9bfb1]">Temporairement indisponible</span>}
                </div>
            </div>
        </article>
    );
}
