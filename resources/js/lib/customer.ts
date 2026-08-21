import type { Category, Product, ProductPhoto } from '@/types/models';

export type FulfillmentType = 'dine_in' | 'pickup' | 'delivery';

export interface StorefrontConfig {
    currency?: string;
    locale?: string;
    delivery_fee?: number;
    tax_rate?: number;
    midtrans_enabled?: boolean;
    online_payment_enabled?: boolean;
}

export function formatMoney(amount: number, currency = 'EUR', locale = 'fr-FR') {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

export function getPrimaryPhoto(photos: Array<Pick<ProductPhoto, 'url'> & Partial<Pick<ProductPhoto, 'is_primary'>>> = []) {
    const primary = photos.find((photo) => photo.is_primary);
    return primary?.url ?? photos[0]?.url ?? null;
}

export function getProductImage(
    product: Pick<Product, 'name'> & {
        category?: Pick<Category, 'name'>;
        photos?: Array<Pick<ProductPhoto, 'url'> & Partial<Pick<ProductPhoto, 'is_primary'>>>;
    },
) {
    const uploaded = getPrimaryPhoto(product.photos);
    if (uploaded) return uploaded;

    const menuContext = `${product.category?.name ?? ''} ${product.name}`.toLocaleLowerCase('fr-FR');
    if (/(boisson|bouteille|canette|sirop)/.test(menuContext)) return '/images/menu-boissons.webp';
    if (/(gratin|raviole)/.test(menuContext)) return '/images/menu-gratin-ravioles.webp';
    if (/(crème|creme|blanche)/.test(menuContext)) return '/images/menu-pizza-creme.webp';
    if (/(panini|tiramisu|dessert)/.test(menuContext)) return '/images/menu-panini-tiramisu.webp';
    if (/(pizza|tomate|margherita)/.test(menuContext)) return '/images/menu-pizza-tomate.webp';
    return null;
}

export function fulfillmentLabel(type: FulfillmentType) {
    return {
        dine_in: 'Sur place',
        pickup: 'À emporter',
        delivery: 'Livraison',
    }[type];
}
