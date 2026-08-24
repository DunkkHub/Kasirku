import { CustomerBrand, CustomerFooter, CustomerHeader, ProductImage } from '@/components/customer/customer-chrome';
import PublicLayout from '@/layouts/public/public-layout';
import { formatMenuPrice, getProductImage, phoneHref } from '@/lib/customer';
import type { Category, Product, RestaurantSettings } from '@/types/models';
import { Head } from '@inertiajs/react';
import { Clock3, MapPin, PhoneCall, Search, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface Props {
    settings: RestaurantSettings;
    products: Product[];
    categories: Category[];
}

export default function CustomerIndex({ settings, products, categories }: Props) {
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.slug ?? String(categories[0]?.id ?? ''));
    const categoryRefs = useRef<Record<string, HTMLElement | null>>({});
    const normalizedSearch = search.trim().toLocaleLowerCase('fr-FR');

    const filteredProducts = useMemo(() => {
        if (!normalizedSearch) return products;

        return products.filter((product) => {
            const haystack = [product.name, product.ingredients, product.description, product.category?.name]
                .filter(Boolean)
                .join(' ')
                .toLocaleLowerCase('fr-FR');

            return haystack.includes(normalizedSearch);
        });
    }, [normalizedSearch, products]);

    const productsByCategory = useMemo(() => {
        return categories.map((category) => {
            const items = filteredProducts.filter((product) => product.category_id === category.id);
            return { category, items, anchor: category.slug ?? String(category.id) };
        });
    }, [categories, filteredProducts]);

    const visibleProductCount = productsByCategory.reduce((total, group) => total + group.items.length, 0);
    const phoneLink = phoneHref(settings.phone);

    useEffect(() => {
        const observers = Object.entries(categoryRefs.current)
            .filter((entry): entry is [string, HTMLElement] => Boolean(entry[1]))
            .map(([anchor, element]) => {
                const observer = new IntersectionObserver(
                    ([entry]) => {
                        if (entry.isIntersecting) {
                            setActiveCategory(anchor);
                        }
                    },
                    { rootMargin: '-42% 0px -52% 0px', threshold: 0.01 },
                );
                observer.observe(element);
                return observer;
            });

        return () => observers.forEach((observer) => observer.disconnect());
    }, [productsByCategory]);

    return (
        <PublicLayout>
            <Head title={`${settings.restaurant_name} | Menu`}>
                <meta name="description" content={`Découvrez le menu de ${settings.restaurant_name} : pizzas, paninis, boissons et desserts.`} />
                <meta property="og:title" content={`${settings.restaurant_name} | Menu`} />
                <meta
                    property="og:description"
                    content={`Découvrez le menu de ${settings.restaurant_name} : pizzas, paninis, boissons et desserts.`}
                />
                <meta property="og:type" content="website" />
                {settings.logo_path && <meta property="og:image" content={settings.logo_path} />}
                <link rel="preload" as="image" href="/images/teisseire-pizza-hero.webp" type="image/webp" fetchPriority="high" />
            </Head>

            <CustomerHeader settings={settings} />

            <main id="main-content">
                <section className="customer-hero flex min-h-[560px] items-end md:items-center" aria-labelledby="hero-title">
                    <div className="customer-container customer-enter relative z-10 py-12 md:py-20">
                        <div className="max-w-3xl">
                            <CustomerBrand settings={settings} />
                            {settings.tagline && (
                                <p className="mt-7 text-xs font-black tracking-[0.22em] text-[#ff7a30] uppercase">{settings.tagline}</p>
                            )}
                            <h1 id="hero-title" className="customer-display mt-4 text-5xl leading-[0.96] text-[#fff6e8] sm:text-6xl md:text-7xl">
                                Menu digital
                                <span className="block text-[#ff7a30]">Teisseire Pizza</span>
                            </h1>
                            {settings.description && (
                                <p className="mt-6 max-w-xl text-base leading-7 text-[#d2c7b8] sm:text-lg">{settings.description}</p>
                            )}
                            <div className="mt-7 flex flex-wrap gap-3">
                                {settings.opening_hours && (
                                    <InfoPill icon={<Clock3 className="size-4" aria-hidden="true" />}>
                                        {settings.opening_hours.split('\n').join(' • ')}
                                    </InfoPill>
                                )}
                                {settings.address && <InfoPill icon={<MapPin className="size-4" aria-hidden="true" />}>{settings.address}</InfoPill>}
                                {settings.show_halal_badge && <InfoPill icon={<Sparkles className="size-4" aria-hidden="true" />}>Halal</InfoPill>}
                            </div>
                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <a href="#carte" className="customer-primary-button">
                                    Voir la carte
                                </a>
                                {phoneLink && (
                                    <a href={phoneLink} className="customer-secondary-button">
                                        <PhoneCall className="size-4" aria-hidden="true" />
                                        {settings.phone}
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <section id="carte" className="border-t border-white/8 bg-[#0c0a09]" aria-labelledby="carte-title">
                    <div className="customer-container py-8 md:py-10">
                        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
                            <div>
                                <p className="mb-2 text-xs font-black tracking-[0.18em] text-[#ff7a30] uppercase">La carte</p>
                                <h2 id="carte-title" className="customer-display text-3xl text-[#fff6e8] sm:text-4xl">
                                    Recettes, formules et prix
                                </h2>
                                {settings.pizza_size_text && <p className="mt-2 text-sm font-semibold text-[#d2c7b8]">{settings.pizza_size_text}</p>}
                            </div>

                            <label className="relative block w-full lg:w-96">
                                <span className="sr-only">Rechercher un plat</span>
                                <Search
                                    className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#887e71]"
                                    aria-hidden="true"
                                />
                                <input
                                    type="search"
                                    className="customer-field customer-search-field"
                                    placeholder="Rechercher un plat..."
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                />
                            </label>
                        </div>
                    </div>

                    <div className="sticky top-[73px] z-30 border-y border-white/8 bg-[#0c0a09]/94 backdrop-blur-xl">
                        <div className="customer-container">
                            <nav className="customer-hide-scrollbar -mx-2 flex gap-2 overflow-x-auto px-2 py-3" aria-label="Catégories du menu">
                                {categories.map((category) => {
                                    const anchor = category.slug ?? String(category.id);
                                    const isActive = activeCategory === anchor;

                                    return (
                                        <a
                                            key={category.id}
                                            href={`#${anchor}`}
                                            className="customer-chip"
                                            aria-current={isActive ? 'true' : undefined}
                                            onClick={() => setActiveCategory(anchor)}
                                        >
                                            {shortCategoryName(category.name)}
                                        </a>
                                    );
                                })}
                            </nav>
                        </div>
                    </div>

                    <div className="customer-container py-10 md:py-14">
                        <div className="mb-7 min-h-6 text-sm text-[#958b7e]" aria-live="polite">
                            {visibleProductCount === 0
                                ? 'Aucun plat trouvé.'
                                : `${visibleProductCount} plat${visibleProductCount > 1 ? 's' : ''} affiché${visibleProductCount > 1 ? 's' : ''}`}
                        </div>

                        {visibleProductCount === 0 ? (
                            <div className="customer-card grid min-h-72 place-items-center p-8 text-center">
                                <div>
                                    <Search className="mx-auto mb-4 size-8 text-[#ff7a30]" aria-hidden="true" />
                                    <h3 className="text-lg font-bold text-[#fff6e8]">Aucun plat trouvé.</h3>
                                    <p className="mt-2 text-sm text-[#9f9587]">Essayez un autre nom, ingrédient ou mot-clé.</p>
                                    <button type="button" className="customer-secondary-button mt-5" onClick={() => setSearch('')}>
                                        Effacer la recherche
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-14">
                                {productsByCategory.map(({ category, items, anchor }) => {
                                    if (items.length === 0) return null;

                                    return (
                                        <section
                                            key={category.id}
                                            id={anchor}
                                            ref={(element) => {
                                                categoryRefs.current[anchor] = element;
                                            }}
                                            className="scroll-mt-36"
                                            aria-labelledby={`${anchor}-title`}
                                        >
                                            <div className="mb-5 overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#15110e]">
                                                <div className="grid md:grid-cols-[minmax(0,1fr)_18rem]">
                                                    <div className="p-5 sm:p-7">
                                                        <p className="text-xs font-black tracking-[0.18em] text-[#ff7a30] uppercase">
                                                            {category.products_count ?? items.length} référence
                                                            {(category.products_count ?? items.length) > 1 ? 's' : ''}
                                                        </p>
                                                        <h3
                                                            id={`${anchor}-title`}
                                                            className="customer-display mt-2 text-3xl text-[#fff6e8] sm:text-4xl"
                                                        >
                                                            {category.name}
                                                        </h3>
                                                        {category.description && (
                                                            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#a99f92]">{category.description}</p>
                                                        )}
                                                    </div>
                                                    <div className="relative hidden min-h-44 md:block">
                                                        <ProductImage
                                                            src={category.image ?? getCategoryFallback(category.name)}
                                                            alt={category.name}
                                                        />
                                                        <div
                                                            className="absolute inset-0 bg-gradient-to-r from-[#15110e] via-transparent to-transparent"
                                                            aria-hidden="true"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="customer-stagger grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                                {items.map((product) => (
                                                    <ProductCard key={product.id} product={product} settings={settings} />
                                                ))}
                                            </div>
                                        </section>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <CustomerFooter settings={settings} />
        </PublicLayout>
    );
}

function ProductCard({ product, settings }: { product: Product; settings: RestaurantSettings }) {
    const unavailable = product.is_available === false;

    return (
        <article className="customer-card customer-product-card flex min-h-full flex-col">
            <div className="relative aspect-[4/3] overflow-hidden bg-[#17120f]">
                <ProductImage src={getProductImage(product)} alt={product.name} />
                {unavailable && (
                    <span className="absolute inset-0 grid place-items-center bg-black/72 text-sm font-black tracking-[0.14em] text-[#fff6e8] uppercase">
                        Indisponible
                    </span>
                )}
            </div>
            <div className="flex flex-1 flex-col p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                    <h3 className="text-lg font-black tracking-[-0.01em] text-[#fff6e8]">{product.name}</h3>
                    <strong className="shrink-0 text-lg text-[#ff9c62] tabular-nums">{formatMenuPrice(Number(product.price), settings)}</strong>
                </div>
                {product.ingredients && <p className="mt-2 text-sm leading-5 text-[#d1c4b5]">{product.ingredients}</p>}
                {product.description && <p className="mt-3 text-sm leading-5 text-[#958b7e]">{product.description}</p>}
                {unavailable && (
                    <span className="mt-4 inline-flex w-fit rounded-full border border-white/12 px-3 py-1 text-xs font-bold text-[#c9bfb1]">
                        Temporairement indisponible
                    </span>
                )}
            </div>
        </article>
    );
}

function InfoPill({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <span className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full border border-white/12 bg-black/25 px-3 py-1.5 text-xs font-bold tracking-wide text-[#f4eadb] backdrop-blur-sm">
            {icon}
            {children}
        </span>
    );
}

function shortCategoryName(name: string) {
    return name
        .replace(/^Pizza\s+/i, '')
        .replace(/^Gratins de\s+/i, '')
        .replace('Base ', '');
}

function getCategoryFallback(name: string) {
    const normalized = name.toLocaleLowerCase('fr-FR');
    if (normalized.includes('boisson')) return '/images/menu-boissons.webp';
    if (normalized.includes('raviole')) return '/images/menu-gratin-ravioles.webp';
    if (normalized.includes('crème')) return '/images/menu-pizza-creme.webp';
    if (normalized.includes('panini') || normalized.includes('dessert')) return '/images/menu-panini-tiramisu.webp';
    return '/images/menu-pizza-tomate.webp';
}
