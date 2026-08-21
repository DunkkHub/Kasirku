import { OrdersByStatusChart } from '@/components/dashboard/orders-by-status-chart';
import { RevenueTrendChart } from '@/components/dashboard/revenue-trend-chart';
import { TopProductsChart } from '@/components/dashboard/top-products-chart';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarClock,
    CheckCircle2,
    ChefHat,
    Clock3,
    FolderKanban,
    Package,
    ReceiptText,
    ShoppingBag,
    TrendingUp,
    WalletCards,
    type LucideIcon,
} from 'lucide-react';

interface Stats {
    total_revenue: number;
    total_orders: number;
    pending_orders: number;
    completed_orders: number;
    cancelled_orders: number;
    today_orders: number;
    today_revenue: number;
    total_products: number;
    total_categories: number;
}

interface TopProduct {
    id: string | number;
    name: string;
    quantity_sold: number;
    revenue: number;
}

interface RecentOrder {
    id: number;
    reference?: string | null;
    customer_name: string | null;
    status: string;
    fulfillment_type?: string | null;
    order_type?: string | null;
    total: number;
    created_at: string;
}

interface RevenuePoint {
    date: string;
    revenue: number;
}

interface OrderStatusPoint {
    status: string;
    label: string;
    count: number;
}

interface Props {
    stats: Stats;
    topProducts: TopProduct[];
    recentOrders: RecentOrder[];
    revenueTrend: RevenuePoint[];
    ordersByStatus: OrderStatusPoint[];
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Vue d’ensemble', href: '/admin/dashboard' }];

const euroFormatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

const statusConfig: Record<string, { label: string; className: string }> = {
    pending: { label: 'À confirmer', className: 'border-[#d59b3f]/35 bg-[#fff1cc] text-[#80560e]' },
    preparing: { label: 'En préparation', className: 'border-[#d8562a]/30 bg-[#fbe2d5] text-[#963c20]' },
    ready: { label: 'Prête', className: 'border-[#427152]/30 bg-[#e2f0e5] text-[#31583e]' },
    out_for_delivery: { label: 'En livraison', className: 'border-[#526d8c]/30 bg-[#e5edf6] text-[#36516f]' },
    delivered: { label: 'Livrée', className: 'border-[#427152]/30 bg-[#dfeee3] text-[#31583e]' },
    completed: { label: 'Terminée', className: 'border-[#427152]/30 bg-[#dfeee3] text-[#31583e]' },
    cancelled: { label: 'Annulée', className: 'border-[#b42318]/25 bg-[#f9dfdc] text-[#8d1f16]' },
};

const fulfillmentLabels: Record<string, string> = {
    dine_in: 'Sur place',
    pickup: 'À emporter',
    delivery: 'Livraison',
};

function formatEuro(value: number) {
    return euroFormatter.format(Number(value) || 0);
}

function formatFrenchDate(value: string) {
    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
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
    value: string;
    hint?: string;
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
                    <p className="mt-4 text-2xl font-black tracking-[-0.035em] tabular-nums sm:text-3xl">{value}</p>
                    {hint && <p className={`mt-1 text-xs font-medium ${tone === 'ember' ? 'text-white/75' : 'text-[#857468]'}`}>{hint}</p>}
                </div>
            </CardContent>
        </Card>
    );
}

function SectionHeading({ icon: Icon, title, eyebrow }: { icon: LucideIcon; title: string; eyebrow?: string }) {
    return (
        <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#f3e4d2] text-[#c94720]">
                <Icon className="size-5" aria-hidden="true" />
            </span>
            <div>
                {eyebrow && <p className="text-[0.65rem] font-black tracking-[0.16em] text-[#a45634] uppercase">{eyebrow}</p>}
                <CardTitle className="text-base font-extrabold tracking-[-0.01em] text-[#2d211a]">{title}</CardTitle>
            </div>
        </div>
    );
}

export default function Dashboard({ stats, topProducts, recentOrders, revenueTrend, ordersByStatus }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tableau de bord" />
            <main className="flex min-h-full flex-1 flex-col gap-6 bg-[#f6efe4] p-4 sm:p-6 lg:p-8">
                <section className="relative overflow-hidden rounded-[1.75rem] bg-[#211812] px-5 py-7 text-[#fff7e9] shadow-[0_24px_60px_rgba(35,22,14,0.18)] sm:px-7 sm:py-8">
                    <div className="absolute -top-24 -right-16 size-64 rounded-full bg-[#d8562a]/20 blur-3xl" aria-hidden="true" />
                    <div
                        className="absolute right-8 bottom-0 h-20 w-20 rotate-12 rounded-t-full border-[14px] border-[#f0ad47]/15"
                        aria-hidden="true"
                    />
                    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl">
                            <p className="text-xs font-black tracking-[0.2em] text-[#ef9367] uppercase">Pilotage du restaurant</p>
                            <h1 className="mt-3 text-3xl leading-tight font-black tracking-[-0.04em] sm:text-4xl">
                                La salle, la cuisine et les livraisons en un coup d’œil.
                            </h1>
                            <p className="mt-3 max-w-xl text-sm leading-6 text-[#d8c7b4]">
                                Suivez l’activité de Teisseire Pizza et concentrez-vous sur les commandes qui demandent votre attention.
                            </p>
                        </div>
                        <Link
                            href="/admin/orders"
                            className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-xl bg-[#d8562a] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-black/15 transition-colors hover:bg-[#ef6840] focus-visible:ring-2 focus-visible:ring-[#ffd6bc] focus-visible:ring-offset-2 focus-visible:ring-offset-[#211812] focus-visible:outline-none"
                        >
                            Gérer les commandes
                            <ArrowRight className="size-4" aria-hidden="true" />
                        </Link>
                    </div>
                </section>

                <section aria-labelledby="indicateurs-title">
                    <div className="mb-3 flex items-end justify-between gap-4">
                        <div>
                            <p className="text-xs font-black tracking-[0.16em] text-[#a45634] uppercase">Aujourd’hui</p>
                            <h2 id="indicateurs-title" className="mt-1 text-xl font-black tracking-[-0.025em] text-[#2b2019]">
                                Indicateurs essentiels
                            </h2>
                        </div>
                        <p className="hidden text-sm text-[#75675b] sm:block">Données mises à jour à l’ouverture de la page</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard
                            icon={WalletCards}
                            label="Chiffre d’affaires"
                            value={formatEuro(stats.total_revenue)}
                            hint={`${formatEuro(stats.today_revenue)} aujourd’hui`}
                            tone="ember"
                        />
                        <StatCard
                            icon={ShoppingBag}
                            label="Commandes"
                            value={stats.total_orders.toLocaleString('fr-FR')}
                            hint={`${stats.today_orders.toLocaleString('fr-FR')} aujourd’hui`}
                        />
                        <StatCard
                            icon={Clock3}
                            label="À traiter"
                            value={stats.pending_orders.toLocaleString('fr-FR')}
                            hint="En attente de prise en charge"
                        />
                        <StatCard
                            icon={CheckCircle2}
                            label="Terminées"
                            value={stats.completed_orders.toLocaleString('fr-FR')}
                            hint={`${stats.cancelled_orders.toLocaleString('fr-FR')} annulée(s)`}
                            tone="green"
                        />
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <StatCard
                            icon={Package}
                            label="Produits à la carte"
                            value={stats.total_products.toLocaleString('fr-FR')}
                            hint="Recettes et boissons"
                        />
                        <StatCard
                            icon={FolderKanban}
                            label="Catégories"
                            value={stats.total_categories.toLocaleString('fr-FR')}
                            hint="Organisation du menu"
                        />
                    </div>
                </section>

                <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.75fr)]">
                    <Card className="rounded-2xl border-[#ddcfbd] bg-[#fffaf2] shadow-[0_10px_30px_rgba(64,39,23,0.05)]">
                        <CardHeader className="pb-2">
                            <SectionHeading icon={TrendingUp} title="Chiffre d’affaires sur 14 jours" eyebrow="Tendance" />
                        </CardHeader>
                        <CardContent className="pt-3">
                            <RevenueTrendChart data={revenueTrend} />
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-[#ddcfbd] bg-[#fffaf2] shadow-[0_10px_30px_rgba(64,39,23,0.05)]">
                        <CardHeader className="pb-2">
                            <SectionHeading icon={ChefHat} title="Commandes par statut" eyebrow="Flux cuisine" />
                        </CardHeader>
                        <CardContent className="pt-3">
                            <OrdersByStatusChart data={ordersByStatus} />
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-4 xl:grid-cols-2">
                    <Card className="min-w-0 rounded-2xl border-[#ddcfbd] bg-[#fffaf2] shadow-[0_10px_30px_rgba(64,39,23,0.05)]">
                        <CardHeader className="flex-row items-center justify-between gap-4 pb-3">
                            <SectionHeading icon={ReceiptText} title="Commandes récentes" eyebrow="Dernières entrées" />
                            <Link
                                href="/admin/orders"
                                className="rounded-lg px-3 py-2 text-sm font-bold text-[#b84523] hover:bg-[#f3e4d2] focus-visible:ring-2 focus-visible:ring-[#d8562a] focus-visible:outline-none"
                            >
                                Tout voir
                            </Link>
                        </CardHeader>
                        <CardContent className="px-0 pb-2">
                            {recentOrders.length === 0 ? (
                                <div className="px-6 py-12 text-center">
                                    <ReceiptText className="mx-auto size-9 text-[#b8a694]" aria-hidden="true" />
                                    <p className="mt-3 text-sm font-semibold text-[#6d5a4e]">Aucune commande pour le moment</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-[#e6d9c8] hover:bg-transparent">
                                                <TableHead className="pl-6 text-[#75675b]">Client</TableHead>
                                                <TableHead className="text-[#75675b]">Service</TableHead>
                                                <TableHead className="text-[#75675b]">Statut</TableHead>
                                                <TableHead className="pr-6 text-right text-[#75675b]">Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {recentOrders.map((order) => {
                                                const status = statusConfig[order.status] ?? {
                                                    label: order.status,
                                                    className: 'border-[#d8c9b7] bg-[#f1e6d7] text-[#645449]',
                                                };
                                                const fulfillment = order.fulfillment_type ?? order.order_type ?? '';
                                                return (
                                                    <TableRow key={order.id} className="border-[#eee3d4] hover:bg-[#faf1e5]">
                                                        <TableCell className="min-w-44 pl-6">
                                                            <div className="font-bold text-[#31241d]">
                                                                {order.customer_name || 'Client de passage'}
                                                            </div>
                                                            <div className="mt-1 flex items-center gap-1.5 text-xs text-[#857468]">
                                                                <CalendarClock className="size-3.5" aria-hidden="true" />
                                                                {formatFrenchDate(order.created_at)}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-sm whitespace-nowrap text-[#655348]">
                                                            {fulfillmentLabels[fulfillment] ?? 'Sur place'}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className={`whitespace-nowrap ${status.className}`}>
                                                                {status.label}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="pr-6 text-right font-black text-[#31241d] tabular-nums">
                                                            {formatEuro(order.total)}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="min-w-0 rounded-2xl border-[#ddcfbd] bg-[#fffaf2] shadow-[0_10px_30px_rgba(64,39,23,0.05)]">
                        <CardHeader className="pb-3">
                            <SectionHeading icon={Package} title="Meilleures ventes" eyebrow="Produits populaires" />
                        </CardHeader>
                        <CardContent>
                            {topProducts.length === 0 ? (
                                <div className="py-12 text-center">
                                    <Package className="mx-auto size-9 text-[#b8a694]" aria-hidden="true" />
                                    <p className="mt-3 text-sm font-semibold text-[#6d5a4e]">Les ventes apparaîtront ici</p>
                                </div>
                            ) : (
                                <>
                                    <TopProductsChart data={topProducts} />
                                    <div className="mt-4 overflow-x-auto border-t border-[#e6d9c8] pt-2">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="hover:bg-transparent">
                                                    <TableHead className="text-[#75675b]">Produit</TableHead>
                                                    <TableHead className="text-right text-[#75675b]">Qté</TableHead>
                                                    <TableHead className="text-right text-[#75675b]">CA</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {topProducts.slice(0, 5).map((product) => (
                                                    <TableRow key={product.id} className="border-[#eee3d4] hover:bg-[#faf1e5]">
                                                        <TableCell className="font-bold text-[#31241d]">{product.name}</TableCell>
                                                        <TableCell className="text-right text-[#655348] tabular-nums">
                                                            {product.quantity_sold.toLocaleString('fr-FR')}
                                                        </TableCell>
                                                        <TableCell className="text-right font-black text-[#31241d] tabular-nums">
                                                            {formatEuro(product.revenue)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </section>
            </main>
        </AppLayout>
    );
}
