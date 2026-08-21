export interface Category {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
    products_count?: number;
}

export interface ProductPhoto {
    id: number;
    product_id: string;
    url: string;
    is_primary: boolean;
    created_at: string;
    updated_at: string;
}

export interface Product {
    id: string;
    name: string;
    category_id: number;
    price: number;
    description?: string | null;
    is_available?: boolean;
    created_at: string;
    updated_at: string;
    category?: Category;
    photos?: ProductPhoto[];
}

export interface CartItem {
    product: Product;
    quantity: number;
    notes?: string;
}

export interface OrderItem {
    id: number;
    order_id: number;
    product_id: string;
    quantity: number;
    notes?: string | null;
    price: number;
    subtotal: number;
    product: Product;
}

export interface Payment {
    id: number;
    order_id: number;
    amount: number;
    status: 'pending' | 'completed' | 'failed';
    payment_method: string | null;
    transaction_id: string | null;
    paid_at: string | null;
    notes?: string | null;
}

export interface Order {
    id: number;
    public_id?: string;
    order_reference?: string;
    customer_name: string | null;
    fulfillment_type?: 'dine_in' | 'pickup' | 'delivery';
    table_number: number | null;
    delivery_address?: string | null;
    delivery_instructions?: string | null;
    delivery_phone?: string | null;
    delivery_fee?: number;
    status: 'pending' | 'preparing' | 'ready' | 'out_for_delivery' | 'completed' | 'delivered' | 'cancelled';
    created_at: string;
    updated_at: string;
    order_items: OrderItem[];
    payment: Payment;
}

export interface PublicOrderItem {
    product: {
        id: string;
        name: string;
        photos?: Array<{ url: string; is_primary?: boolean }>;
    };
    quantity: number;
    notes?: string | null;
    price: number;
    subtotal: number;
}

export interface PublicOrder {
    public_id: string;
    reference: string;
    customer_name: string | null;
    fulfillment_type: 'dine_in' | 'pickup' | 'delivery';
    table_number: number | null;
    status: 'pending' | 'preparing' | 'ready' | 'out_for_delivery' | 'completed' | 'delivered' | 'cancelled';
    subtotal_amount: number;
    tax_amount: number;
    delivery_fee: number;
    total_amount: number;
    currency: string;
    created_at: string;
    order_items: PublicOrderItem[];
    payment: {
        method: string;
        status: 'pending' | 'completed' | 'failed';
        paid_at: string | null;
    };
}

export interface Pagination {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    has_more_pages: boolean;
}
