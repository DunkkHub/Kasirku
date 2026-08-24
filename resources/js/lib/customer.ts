import type { Category, Product, ProductPhoto, RestaurantSettings } from '@/types/models';

export function formatMenuPrice(amount: number, settings: Pick<RestaurantSettings, 'currency_symbol' | 'currency_symbol_position'>) {
    const formatted = new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
        maximumFractionDigits: 2,
    }).format(amount);

    return settings.currency_symbol_position === 'before' ? `${settings.currency_symbol}${formatted}` : `${formatted} ${settings.currency_symbol}`;
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

export function phoneHref(phone?: string | null) {
    const digits = (phone ?? '').replace(/[^\d+]/g, '');
    return digits ? `tel:${digits}` : undefined;
}
