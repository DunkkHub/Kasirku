export interface Category {
    id: number;
    name: string;
    slug?: string | null;
    description?: string | null;
    image?: string | null;
    is_active?: boolean;
    sort_order?: number;
    created_at?: string;
    updated_at?: string;
    products_count?: number;
}

export interface ProductPhoto {
    id?: number;
    product_id?: string;
    url: string;
    is_primary: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface Product {
    id: string;
    name: string;
    slug?: string | null;
    category_id: number;
    price: number;
    description?: string | null;
    ingredients?: string | null;
    is_available?: boolean;
    sort_order?: number;
    created_at?: string;
    updated_at?: string;
    category?: Category;
    photos?: ProductPhoto[];
}

export interface Pagination {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    has_more_pages: boolean;
}

export interface RestaurantSettings {
    restaurant_name: string;
    logo_path?: string | null;
    halal_badge_path?: string | null;
    show_halal_badge: boolean;
    tagline?: string | null;
    description?: string | null;
    phone?: string | null;
    address?: string | null;
    opening_hours?: string | null;
    currency_code: string;
    currency_symbol: string;
    currency_symbol_position: 'before' | 'after';
    pizza_size_text?: string | null;
    instagram_url?: string | null;
    facebook_url?: string | null;
    google_maps_url?: string | null;
}
