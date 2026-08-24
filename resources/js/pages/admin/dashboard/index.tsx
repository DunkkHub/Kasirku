import { Card, CardContent } from '@/components/ui/card';
import AdminLayout from '@/layouts/admin/admin-layout';
import type { BreadcrumbItem } from '@/types';
import type { RestaurantSettings } from '@/types/models';
import { Head, Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, Eye, FolderKanban, ImagePlus, Package, Settings, UtensilsCrossed } from 'lucide-react';

interface Stats {
    total_products: number;
    total_categories: number;
    available_products: number;
    unavailable_products: number;
    active_categories: number;
    disabled_categories: number;
}

interface Props {
    stats: Stats;
    settings: RestaurantSettings;
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Tableau de bord', href: '/admin' }];

export default function Dashboard({ stats, settings }: Props) {
    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Tableau de bord" />
            <main className="admin-cms-surface flex min-h-full flex-1 flex-col gap-6 bg-[#f6efe4] p-4 sm:p-6 lg:p-8">
                <section className="relative overflow-hidden rounded-[1.75rem] bg-[#211812] px-5 py-7 text-[#fff7e9] shadow-[0_24px_60px_rgba(35,22,14,0.18)] sm:px-7 sm:py-8">
                    <div className="absolute -top-24 -right-16 size-64 rounded-full bg-[#d8562a]/20 blur-3xl" aria-hidden="true" />
                    <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                        <div>
                            <p className="text-xs font-black tracking-[0.2em] text-[#ef9367] uppercase">Menu digital</p>
                            <h1 className="mt-3 max-w-3xl text-3xl leading-tight font-black tracking-[-0.04em] sm:text-4xl">
                                Gérez simplement la carte de {settings.restaurant_name}.
                            </h1>
                            <p className="mt-3 max-w-xl text-sm leading-6 text-[#d8c7b4]">
                                Ajoutez des plats, corrigez les prix, organisez les catégories et modifiez les informations affichées aux clients.
                            </p>
                        </div>
                        <Link
                            href="/"
                            className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/8 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/14 focus-visible:ring-2 focus-visible:ring-[#ffd6bc] focus-visible:outline-none"
                        >
                            Voir le menu public
                            <Eye className="size-4" aria-hidden="true" />
                        </Link>
                    </div>
                </section>

                <section aria-labelledby="stats-title">
                    <div className="mb-3">
                        <p className="text-xs font-black tracking-[0.16em] text-[#a45634] uppercase">Aperçu</p>
                        <h2 id="stats-title" className="mt-1 text-xl font-black tracking-[-0.025em] text-[#2b2019]">
                            Indicateurs de la carte
                        </h2>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard
                            icon={UtensilsCrossed}
                            label="Total plats"
                            value={stats.total_products}
                            hint="Tous les plats visibles en admin"
                            tone="ember"
                        />
                        <StatCard
                            icon={FolderKanban}
                            label="Total catégories"
                            value={stats.total_categories}
                            hint={`${stats.active_categories} active(s)`}
                        />
                        <StatCard
                            icon={Package}
                            label="Plats disponibles"
                            value={stats.available_products}
                            hint="Affichés normalement"
                            tone="green"
                        />
                        <StatCard
                            icon={ImagePlus}
                            label="Plats indisponibles"
                            value={stats.unavailable_products}
                            hint="Visibles avec badge indisponible"
                        />
                    </div>
                </section>

                <section aria-labelledby="shortcuts-title">
                    <div className="mb-3">
                        <p className="text-xs font-black tracking-[0.16em] text-[#a45634] uppercase">Actions rapides</p>
                        <h2 id="shortcuts-title" className="mt-1 text-xl font-black tracking-[-0.025em] text-[#2b2019]">
                            Ce que l’admin fait le plus souvent
                        </h2>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                        <Shortcut
                            href="/admin/menu"
                            icon={UtensilsCrossed}
                            title="Ajouter un plat"
                            text="Créer ou modifier une pizza, boisson, formule ou dessert."
                        />
                        <Shortcut
                            href="/admin/categories"
                            icon={FolderKanban}
                            title="Ajouter une catégorie"
                            text="Renommer, désactiver ou réordonner les sections."
                        />
                        <Shortcut
                            href="/admin/settings"
                            icon={Settings}
                            title="Paramètres restaurant"
                            text="Logo, horaires, téléphone, devise et réseaux sociaux."
                        />
                    </div>
                </section>
            </main>
        </AdminLayout>
    );
}

function StatCard({
    icon: Icon,
    label,
    value,
    hint,
    tone = 'neutral',
}: {
    icon: LucideIcon;
    label: string;
    value: number;
    hint: string;
    tone?: 'neutral' | 'ember' | 'green';
}) {
    const toneClass =
        tone === 'ember'
            ? 'bg-[#d8562a] text-white shadow-[0_18px_42px_rgba(164,58,27,0.22)]'
            : tone === 'green'
              ? 'border-[#b8ccb9] bg-[#edf5ec] text-[#294d35]'
              : 'border-[#ddcfbd] bg-[#fffaf2] text-[#241b16]';

    return (
        <Card className={`group overflow-hidden rounded-2xl border shadow-[0_10px_30px_rgba(64,39,23,0.05)] ${toneClass}`}>
            <CardContent className="flex min-h-36 flex-col justify-between p-5">
                <div className="flex items-start justify-between gap-4">
                    <p className={`text-sm font-semibold ${tone === 'ember' ? 'text-white/80' : 'text-[#75675b]'}`}>{label}</p>
                    <span
                        className={`flex size-10 items-center justify-center rounded-xl ${tone === 'ember' ? 'bg-white/15' : 'bg-[#f1e4d2] text-[#c94720]'}`}
                    >
                        <Icon className="size-5" aria-hidden="true" />
                    </span>
                </div>
                <div>
                    <p className="mt-4 text-3xl font-black tracking-[-0.035em] tabular-nums">{value.toLocaleString('fr-FR')}</p>
                    <p className={`mt-1 text-xs font-medium ${tone === 'ember' ? 'text-white/75' : 'text-[#857468]'}`}>{hint}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function Shortcut({ href, icon: Icon, title, text }: { href: string; icon: LucideIcon; title: string; text: string }) {
    return (
        <Link
            href={href}
            className="group rounded-2xl border border-[#ddcfbd] bg-[#fffaf2] p-5 shadow-[0_10px_30px_rgba(64,39,23,0.05)] transition hover:-translate-y-0.5 hover:border-[#d8562a]/35 focus-visible:ring-2 focus-visible:ring-[#d8562a] focus-visible:outline-none motion-reduce:transform-none"
        >
            <span className="flex size-11 items-center justify-center rounded-xl bg-[#f3e4d2] text-[#c94720]">
                <Icon className="size-5" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-lg font-black text-[#2d211a]">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-[#75675b]">{text}</p>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-black text-[#b84523]">
                Ouvrir <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
        </Link>
    );
}
