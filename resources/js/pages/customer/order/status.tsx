import { CustomerFooter, CustomerHeader, ProductImage } from '@/components/customer/customer-chrome';
import { formatMoney, fulfillmentLabel, getProductImage, type FulfillmentType, type StorefrontConfig } from '@/lib/customer';
import type { PublicOrder } from '@/types/models';
import { Head } from '@inertiajs/react';
import {
    AlertTriangle,
    Bike,
    Check,
    CheckCircle2,
    ChefHat,
    Clock3,
    House,
    PackageCheck,
    Phone,
    ReceiptText,
    RefreshCw,
    UtensilsCrossed,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface Props {
    order: PublicOrder;
    currency?: string;
    locale?: string;
    store_config?: StorefrontConfig;
}

type OrderStatus = PublicOrder['status'];

export default function OrderStatusPage({ order: initialOrder, currency = 'EUR', locale = 'fr-FR', store_config }: Props) {
    const [order, setOrder] = useState(initialOrder);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshError, setRefreshError] = useState('');
    const [lastChecked, setLastChecked] = useState<Date | null>(null);
    const [announcement, setAnnouncement] = useState('');
    const money = useMemo(
        () => ({ currency: order.currency ?? store_config?.currency ?? currency, locale: store_config?.locale ?? locale }),
        [currency, locale, order.currency, store_config?.currency, store_config?.locale],
    );
    const orderIdentifier = order.public_id;

    const refresh = async (manual = false) => {
        if (manual) setIsRefreshing(true);
        try {
            const response = await fetch(`/order/${orderIdentifier}/check`, {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            if (!response.ok) throw new Error('refresh-failed');
            const data = (await response.json()) as { order: PublicOrder };
            if (data.order.status !== order.status) setAnnouncement(`Nouveau statut : ${statusCopy(data.order).title}`);
            setOrder(data.order);
            setLastChecked(new Date());
            setRefreshError('');
        } catch {
            if (manual) setRefreshError('Le statut n’a pas pu être actualisé. Réessayez dans un instant.');
        } finally {
            if (manual) setIsRefreshing(false);
        }
    };

    useEffect(() => {
        if (isFinalStatus(order.status)) return;
        const interval = window.setInterval(() => void refresh(false), 10_000);
        return () => window.clearInterval(interval);
        // The identifier and final status are the only values that should restart polling.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderIdentifier, order.status]);

    const status = statusCopy(order);
    const fulfillment = order.fulfillment_type ?? 'dine_in';
    const reference = order.reference;
    const itemsSubtotal = Number(order.subtotal_amount);

    return (
        <div className="customer-theme">
            <Head title={`Commande ${reference} — Teisseire Pizza`} />
            <CustomerHeader backHref="/" context={`Commande ${reference}`} />
            <p className="sr-only" aria-live="polite">
                {announcement}
            </p>

            <main id="main-content" className="customer-container py-8 md:py-12">
                <div className="mx-auto max-w-5xl">
                    <section
                        className={`customer-card relative overflow-hidden border-l-4 p-6 sm:p-8 ${status.borderClass}`}
                        aria-labelledby="order-status-title"
                    >
                        <div className="absolute -top-16 -right-16 size-52 rounded-full bg-[#ff6b22]/[0.04]" aria-hidden="true" />
                        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex items-start gap-4">
                                <span className={`grid size-12 shrink-0 place-items-center rounded-full ${status.iconClass}`}>{status.icon}</span>
                                <div>
                                    <p className="text-xs font-bold tracking-[0.18em] text-[#ff9c62] uppercase">Commande {reference}</p>
                                    <h1 id="order-status-title" className="customer-display mt-2 text-3xl text-[#fff6e8] sm:text-4xl">
                                        {status.title}
                                    </h1>
                                    <p className="mt-2 max-w-2xl leading-7 text-[#aaa092]">{status.description}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="customer-secondary-button shrink-0"
                                onClick={() => void refresh(true)}
                                disabled={isRefreshing}
                            >
                                <RefreshCw className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
                                {isRefreshing ? 'Actualisation…' : 'Actualiser'}
                            </button>
                        </div>
                        {refreshError && (
                            <p role="alert" className="relative mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                {refreshError}
                            </p>
                        )}
                        {!isFinalStatus(order.status) && (
                            <p className="relative mt-5 flex items-center gap-2 text-xs text-[#81786e]">
                                <span className="size-2 animate-pulse rounded-full bg-[#ff6b22]" />
                                Mise à jour automatique toutes les 10 secondes
                                {lastChecked ? ` · vérifié à ${lastChecked.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : ''}
                            </p>
                        )}
                    </section>

                    <OrderTimeline fulfillment={fulfillment} status={order.status} />

                    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,.75fr)]">
                        <section className="customer-card overflow-hidden" aria-labelledby="items-title">
                            <div className="flex items-center justify-between border-b border-white/10 p-5 sm:p-6">
                                <div>
                                    <h2 id="items-title" className="customer-display text-2xl text-[#fff6e8]">
                                        Détail de la commande
                                    </h2>
                                    <p className="mt-1 text-sm text-[#8f8578]">Passée le {formatDate(order.created_at)}</p>
                                </div>
                                <ReceiptText className="size-6 text-[#ff6b22]" aria-hidden="true" />
                            </div>
                            <div className="divide-y divide-white/8 px-5 sm:px-6">
                                {order.order_items.map((item, index) => (
                                    <article key={`${item.product.id}-${index}`} className="flex gap-4 py-5">
                                        <div className="size-16 shrink-0 overflow-hidden rounded-xl">
                                            <ProductImage src={getProductImage(item.product)} alt={item.product.name} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-bold text-[#fff6e8]">{item.product.name}</h3>
                                            <p className="mt-1 text-sm text-[#948a7d]">
                                                {item.quantity} × {formatMoney(Number(item.price), money.currency, money.locale)}
                                            </p>
                                            {item.notes && <p className="mt-1 text-xs text-[#ff9c62]">Cuisine : {item.notes}</p>}
                                        </div>
                                        <strong className="text-sm text-[#e7dccd] tabular-nums">
                                            {formatMoney(Number(item.subtotal), money.currency, money.locale)}
                                        </strong>
                                    </article>
                                ))}
                            </div>
                            <div className="space-y-2 border-t border-white/10 bg-[#0e0c0a] p-5 text-sm sm:p-6">
                                <SummaryLine label="Sous-total" value={formatMoney(itemsSubtotal, money.currency, money.locale)} />
                                {Number(order.tax_amount) > 0 && (
                                    <SummaryLine label="Taxes" value={formatMoney(Number(order.tax_amount), money.currency, money.locale)} />
                                )}
                                {Number(order.delivery_fee ?? 0) > 0 && (
                                    <SummaryLine label="Livraison" value={formatMoney(Number(order.delivery_fee), money.currency, money.locale)} />
                                )}
                                <div className="mt-3 flex items-end justify-between border-t border-white/10 pt-4">
                                    <span className="font-bold text-[#fff6e8]">Total</span>
                                    <strong className="text-2xl text-[#ff9c62] tabular-nums">
                                        {formatMoney(Number(order.total_amount), money.currency, money.locale)}
                                    </strong>
                                </div>
                            </div>
                        </section>

                        <div className="space-y-6">
                            <section className="customer-card p-5 sm:p-6" aria-labelledby="fulfillment-info-title">
                                <div className="mb-5 flex items-center gap-3">
                                    <span className="grid size-10 place-items-center rounded-full bg-[#ff6b22]/10 text-[#ff6b22]">
                                        {fulfillmentIcon(fulfillment)}
                                    </span>
                                    <div>
                                        <p className="text-xs font-bold tracking-wider text-[#887f74] uppercase">Mode de retrait</p>
                                        <h2 id="fulfillment-info-title" className="font-bold text-[#fff6e8]">
                                            {fulfillmentLabel(fulfillment)}
                                        </h2>
                                    </div>
                                </div>
                                <dl className="space-y-4 text-sm">
                                    <DetailRow label="Nom" value={order.customer_name || '—'} />
                                    {fulfillment === 'dine_in' && (
                                        <DetailRow label="Table" value={order.table_number ? `N° ${order.table_number}` : 'À confirmer'} />
                                    )}
                                    {fulfillment === 'delivery' && <DetailRow label="Destination" value="Adresse de livraison confirmée" />}
                                    {fulfillment === 'pickup' && <DetailRow label="Retrait" value="75 rue Léon Jouhaux" />}
                                </dl>
                            </section>

                            <section className="customer-card p-5 sm:p-6" aria-labelledby="payment-title">
                                <div className="mb-4 flex items-center justify-between gap-3">
                                    <h2 id="payment-title" className="font-bold text-[#fff6e8]">
                                        Paiement
                                    </h2>
                                    <PaymentBadge status={order.payment.status} />
                                </div>
                                <p className="text-sm leading-6 text-[#948a7d]">
                                    {order.payment.status === 'completed'
                                        ? `Réglé${order.payment.paid_at ? ` le ${formatDate(order.payment.paid_at)}` : ''}.`
                                        : fulfillment === 'delivery'
                                          ? 'À régler lors de la livraison.'
                                          : 'À régler au comptoir.'}
                                </p>
                                <p className="mt-2 text-xs text-[#887f74]">Mode : {paymentMethodLabel(order.payment.method)}</p>
                            </section>

                            <a href="tel:+33634614047" className="customer-secondary-button w-full">
                                <Phone className="size-4" aria-hidden="true" />
                                Besoin d’aide ? Appelez-nous
                            </a>
                        </div>
                    </div>

                    <div className="mt-8 rounded-2xl border border-dashed border-white/12 p-5 text-center text-sm text-[#8f8578]">
                        <p className="font-bold text-[#d8cebf]">Gardez cette page ouverte</p>
                        <p className="mt-1">
                            Votre référence <strong className="text-[#ff9c62]">{reference}</strong> permet à l’équipe de retrouver rapidement la
                            commande.
                        </p>
                    </div>
                </div>
            </main>
            <CustomerFooter />
        </div>
    );
}

function statusCopy(order: PublicOrder) {
    const fulfillment = order.fulfillment_type ?? 'dine_in';
    const completedText =
        fulfillment === 'delivery'
            ? 'Votre commande a été livrée. Bon appétit !'
            : fulfillment === 'pickup'
              ? 'Votre commande est prête au comptoir.'
              : 'Votre commande est prête à être servie.';
    const statuses: Record<OrderStatus, { title: string; description: string; icon: React.ReactNode; iconClass: string; borderClass: string }> = {
        pending: {
            title: 'Commande bien reçue',
            description: 'L’équipe va confirmer votre commande et lancer sa préparation.',
            icon: <Clock3 className="size-6" aria-hidden="true" />,
            iconClass: 'bg-amber-400/12 text-amber-300',
            borderClass: 'border-l-amber-400',
        },
        preparing: {
            title: 'En préparation',
            description: 'Votre commande est entre les mains de notre équipe en cuisine.',
            icon: <ChefHat className="size-6" aria-hidden="true" />,
            iconClass: 'bg-[#ff6b22]/12 text-[#ff9c62]',
            borderClass: 'border-l-[#ff6b22]',
        },
        ready: {
            title: fulfillment === 'delivery' ? 'Prête pour le départ' : 'Votre commande est prête',
            description: fulfillment === 'delivery' ? 'Elle sera confiée au livreur dans un instant.' : completedText,
            icon: <PackageCheck className="size-6" aria-hidden="true" />,
            iconClass: 'bg-emerald-400/12 text-emerald-300',
            borderClass: 'border-l-emerald-400',
        },
        out_for_delivery: {
            title: 'En cours de livraison',
            description: 'Votre commande est en route vers l’adresse indiquée.',
            icon: <Bike className="size-6" aria-hidden="true" />,
            iconClass: 'bg-sky-400/12 text-sky-300',
            borderClass: 'border-l-sky-400',
        },
        completed: {
            title: fulfillment === 'delivery' ? 'Commande livrée' : 'Commande terminée',
            description: completedText,
            icon: <CheckCircle2 className="size-6" aria-hidden="true" />,
            iconClass: 'bg-emerald-400/12 text-emerald-300',
            borderClass: 'border-l-emerald-400',
        },
        delivered: {
            title: 'Commande livrée',
            description: completedText,
            icon: <House className="size-6" aria-hidden="true" />,
            iconClass: 'bg-emerald-400/12 text-emerald-300',
            borderClass: 'border-l-emerald-400',
        },
        cancelled: {
            title: 'Commande annulée',
            description: 'Cette commande a été annulée. Contactez-nous si vous avez besoin d’aide.',
            icon: <AlertTriangle className="size-6" aria-hidden="true" />,
            iconClass: 'bg-red-400/12 text-red-300',
            borderClass: 'border-l-red-400',
        },
    };
    return statuses[order.status] ?? statuses.pending;
}

function isFinalStatus(status: OrderStatus) {
    return ['completed', 'delivered', 'cancelled'].includes(status);
}

function OrderTimeline({ fulfillment, status }: { fulfillment: FulfillmentType; status: OrderStatus }) {
    const steps =
        fulfillment === 'delivery'
            ? ['Reçue', 'En cuisine', 'En route', 'Livrée']
            : fulfillment === 'pickup'
              ? ['Reçue', 'En cuisine', 'Prête', 'Retirée']
              : ['Reçue', 'En cuisine', 'Prête', 'Servie'];
    const activeIndex =
        status === 'pending'
            ? 0
            : status === 'preparing'
              ? 1
              : status === 'ready' || status === 'out_for_delivery'
                ? 2
                : status === 'completed' || status === 'delivered'
                  ? 3
                  : 0;
    return (
        <section className="customer-card mt-6 p-5 sm:p-6" aria-labelledby="progress-title">
            <h2 id="progress-title" className="sr-only">
                Progression de la commande
            </h2>
            <ol className="grid grid-cols-4">
                {steps.map((step, index) => {
                    const reached = status !== 'cancelled' && index <= activeIndex;
                    return (
                        <li key={step} className="relative flex flex-col items-center text-center">
                            {index > 0 && (
                                <span
                                    className={`absolute top-4 right-1/2 h-0.5 w-full ${reached ? 'bg-[#ff6b22]' : 'bg-white/10'}`}
                                    aria-hidden="true"
                                />
                            )}
                            <span
                                className={`relative z-10 grid size-8 place-items-center rounded-full border text-xs font-bold ${reached ? 'border-[#ff6b22] bg-[#ff6b22] text-[#170b05]' : 'border-white/15 bg-[#15120f] text-[#8f8578]'}`}
                            >
                                {index < activeIndex && reached ? <Check className="size-4" aria-hidden="true" /> : index + 1}
                            </span>
                            <span className={`mt-2 text-[0.68rem] font-bold sm:text-xs ${reached ? 'text-[#e9decf]' : 'text-[#8f8578]'}`}>
                                {step}
                            </span>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}

function fulfillmentIcon(type: FulfillmentType) {
    if (type === 'delivery') return <Bike className="size-5" aria-hidden="true" />;
    if (type === 'pickup') return <PackageCheck className="size-5" aria-hidden="true" />;
    return <UtensilsCrossed className="size-5" aria-hidden="true" />;
}

function PaymentBadge({ status }: { status: PublicOrder['payment']['status'] }) {
    const styles =
        status === 'completed'
            ? 'bg-emerald-400/12 text-emerald-300'
            : status === 'failed'
              ? 'bg-red-400/12 text-red-300'
              : 'bg-amber-400/12 text-amber-300';
    const label = status === 'completed' ? 'Réglé' : status === 'failed' ? 'Échec' : 'À régler';
    return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${styles}`}>{label}</span>;
}

function paymentMethodLabel(method: string) {
    if (method === 'cash_on_delivery') return 'paiement à la livraison';
    if (method === 'pay_at_counter' || method === 'cash') return 'paiement au comptoir';
    if (method === 'midtrans') return 'paiement en ligne';
    return method;
}

function SummaryLine({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between text-[#9b9184]">
            <span>{label}</span>
            <span className="text-[#d8cebf] tabular-nums">{value}</span>
        </div>
    );
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-xs font-bold tracking-wide text-[#887f74] uppercase">{label}</dt>
            <dd className="mt-1 leading-6 text-[#d8cebf]">{value}</dd>
        </div>
    );
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}
