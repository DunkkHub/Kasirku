import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { TAX_RATE } from '@/lib/constants';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    Calendar,
    CreditCard,
    EditIcon,
    EyeIcon,
    FileText,
    ImageIcon,
    Minus,
    Package,
    PlusIcon,
    Printer,
    SearchIcon,
    ShoppingCart,
    TrashIcon,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

// Types
interface OrderItem {
    id: number;
    product: {
        id: string;
        name: string;
        photos: Array<{ id: number; url: string }>;
    };
    quantity: number;
    price: number;
    subtotal: number;
}

interface Payment {
    id: number;
    method: string;
    status: string;
    amount: number;
    transaction_id: string;
    paid_at: string | null;
}

interface Order {
    id: number;
    reference?: string | null;
    customer_name: string;
    customer_phone: string | null;
    customer_email: string | null;
    total_amount: number;
    status: string;
    order_type: string;
    fulfillment_type?: string;
    table_number?: number | null;
    delivery_address?: string | null;
    delivery_instructions?: string | null;
    notes: string | null;
    created_at: string;
    order_items: OrderItem[];
    payment: Payment;
}

interface Product {
    id: string;
    name: string;
    price: number;
    photos: Array<{
        id: number;
        url: string;
    }>;
}

interface CartItem {
    product_id: string;
    product: Product;
    quantity: number;
    subtotal: number;
}

interface OrdersData {
    data: Order[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props {
    orders: OrdersData;
    products: Product[];
    filters: {
        status?: string;
        search?: string;
    };
}

interface OrderFormData {
    customer_name: string;
    customer_phone?: string;
    customer_email?: string;
    payment_method: string;
    fulfillment_type: string;
    table_number?: number;
    delivery_phone?: string;
    delivery_address?: string;
    delivery_instructions?: string;
    status?: string; // Order status for editing
    notes?: string;
    items: { product_id: string; quantity: number }[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Vue d’ensemble',
        href: '/admin/dashboard',
    },
    {
        title: 'Commandes',
        href: '/admin/orders',
    },
];

const statusConfig: Record<string, { label: string; variant: 'secondary' | 'default' | 'destructive' | 'outline'; className: string }> = {
    pending: { label: 'À confirmer', variant: 'secondary', className: 'border-[#d59b3f]/35 bg-[#fff1cc] text-[#80560e]' },
    preparing: { label: 'En préparation', variant: 'outline', className: 'border-[#d8562a]/30 bg-[#fbe2d5] text-[#963c20]' },
    ready: { label: 'Prête', variant: 'outline', className: 'border-[#427152]/30 bg-[#e2f0e5] text-[#31583e]' },
    out_for_delivery: { label: 'En livraison', variant: 'outline', className: 'border-[#526d8c]/30 bg-[#e5edf6] text-[#36516f]' },
    delivered: { label: 'Livrée', variant: 'default', className: 'border-[#427152]/30 bg-[#dfeee3] text-[#31583e]' },
    completed: { label: 'Terminée', variant: 'default', className: 'border-[#427152]/30 bg-[#dfeee3] text-[#31583e]' },
    cancelled: { label: 'Annulée', variant: 'destructive', className: 'border-[#b42318]/25 bg-[#f9dfdc] text-[#8d1f16]' },
};

const paymentStatusConfig: Record<string, { label: string; variant: 'secondary' | 'default' | 'destructive' | 'outline' }> = {
    pending: { label: 'En attente', variant: 'secondary' },
    completed: { label: 'Payé', variant: 'default' },
    paid: { label: 'Payé', variant: 'default' },
    failed: { label: 'Échec', variant: 'destructive' },
};

const fulfillmentLabels: Record<string, string> = {
    dine_in: 'Sur place',
    pickup: 'À emporter',
    delivery: 'Livraison',
    admin: 'Saisie en caisse',
    customer: 'Commande en ligne',
};

const paymentMethodLabels: Record<string, string> = {
    cash: 'Espèces',
    card: 'Carte bancaire',
    digital: 'Paiement en ligne',
};

const euroFormatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 });

const formatCurrency = (amount: number) => euroFormatter.format(Number(amount) || 0);
const formatDate = (dateString: string) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(dateString));

const getStatusMeta = (status: string) =>
    statusConfig[status] ?? { label: status, variant: 'outline' as const, className: 'border-[#d8c9b7] bg-[#f1e6d7] text-[#645449]' };

const getNextAction = (order: Order): { status: string; label: string } | null => {
    if (order.status === 'pending') return { status: 'preparing', label: 'Lancer la préparation' };
    if (order.status === 'preparing') return { status: 'ready', label: 'Marquer comme prête' };
    if (order.status === 'ready') {
        return (order.fulfillment_type ?? order.order_type) === 'delivery'
            ? { status: 'out_for_delivery', label: 'Départ en livraison' }
            : { status: 'completed', label: 'Terminer la commande' };
    }
    if (order.status === 'out_for_delivery') return { status: 'delivered', label: 'Marquer comme livrée' };
    return null;
};

export default function OrdersIndex({ orders, products, filters }: Props) {
    // State
    const [ordersList, setOrdersList] = useState<Order[]>(orders.data || []);
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>(filters?.status || '');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Infinite scroll state
    const [currentPage, setCurrentPage] = useState(orders?.current_page || 1);
    const [hasMorePages, setHasMorePages] = useState(orders?.current_page < orders?.last_page);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const observerRef = useRef<HTMLDivElement>(null);

    // Create order states
    const [cart, setCart] = useState<CartItem[]>([]);
    const [productSearchTerm, setProductSearchTerm] = useState('');

    const [formData, setFormData] = useState<OrderFormData>({
        customer_name: '',
        payment_method: 'cash',
        fulfillment_type: 'pickup',
        items: [],
    });

    // Update orders when props change
    useEffect(() => {
        setOrdersList(orders.data || []);
        setCurrentPage(orders?.current_page || 1);
        setHasMorePages(orders?.current_page < orders?.last_page);
    }, [orders]);

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Since filtering is now done server-side, we don't need client-side filtering
    const filteredOrders = ordersList;

    // Load more orders function
    const loadMoreOrders = useCallback(async () => {
        if (isLoadingMore || !hasMorePages) return;

        setIsLoadingMore(true);

        try {
            const params = new URLSearchParams({
                page: (currentPage + 1).toString(),
            });

            // Add search parameter if exists
            if (debouncedSearchTerm) {
                params.append('search', debouncedSearchTerm);
            }

            // Add status filter parameter if exists and not 'all'
            if (statusFilter && statusFilter !== '' && statusFilter !== 'all') {
                params.append('status', statusFilter);
            }

            const response = await fetch(`/admin/orders?${params.toString()}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();

                // Always append data for infinite scroll
                setOrdersList((prev) => [...prev, ...data.orders.data]);
                setCurrentPage(data.orders.current_page);
                setHasMorePages(data.orders.current_page < data.orders.last_page);
            }
        } catch {
            setErrors((current) => ({ ...current, general: 'Impossible de charger davantage de commandes.' }));
        } finally {
            setIsLoadingMore(false);
        }
    }, [currentPage, hasMorePages, isLoadingMore, debouncedSearchTerm, statusFilter]); // Intersection Observer for infinite scroll
    useEffect(() => {
        if (!hasMorePages) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMorePages && !isLoadingMore) {
                    loadMoreOrders();
                }
            },
            {
                threshold: 0.1,
                rootMargin: '100px',
            },
        );

        const observerTarget = observerRef.current;
        if (observerTarget) {
            observer.observe(observerTarget);
        }

        return () => {
            if (observerTarget) {
                observer.unobserve(observerTarget);
            }
        };
    }, [loadMoreOrders, hasMorePages, isLoadingMore, debouncedSearchTerm, statusFilter]);

    // Reset data and pagination when search or filter changes
    useEffect(() => {
        // Reset to first page and reload data when filters change
        setCurrentPage(1);
        setHasMorePages(true);

        // Reload data with new filters
        const loadInitialData = async () => {
            try {
                const params = new URLSearchParams({ page: '1' });

                if (debouncedSearchTerm) {
                    params.append('search', debouncedSearchTerm);
                }

                if (statusFilter && statusFilter !== '' && statusFilter !== 'all') {
                    params.append('status', statusFilter);
                }

                const response = await fetch(`/admin/orders?${params.toString()}`, {
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        Accept: 'application/json',
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setOrdersList(data.orders.data);
                    setCurrentPage(data.orders.current_page);
                    setHasMorePages(data.orders.current_page < data.orders.last_page);
                } else {
                    // Fallback to empty state if filter request fails
                    setOrdersList([]);
                    setHasMorePages(false);
                    setErrors((current) => ({ ...current, general: 'Impossible de filtrer les commandes.' }));
                }
            } catch {
                // Fallback to empty state if network error
                setOrdersList([]);
                setHasMorePages(false);
                setErrors((current) => ({ ...current, general: 'La recherche est momentanément indisponible.' }));
            }
        };

        // Always reload data when filters change (including switching to "all")
        loadInitialData();
    }, [debouncedSearchTerm, statusFilter]);

    // Reset form
    const resetForm = () => {
        setFormData({
            customer_name: '',
            payment_method: 'cash',
            fulfillment_type: 'pickup',
            status: 'pending', // Default order status
            items: [],
        });
        setCart([]);
        setErrors({});
    };

    // Handle form input changes
    const handleInputChange = <K extends keyof OrderFormData>(field: K, value: OrderFormData[K]) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const filteredProducts = (products || []).filter((product) => product.name.toLowerCase().includes(productSearchTerm.toLowerCase()));

    // Cart functions
    const addToCart = (product: Product) => {
        const existingItem = cart.find((item) => item.product_id === product.id);

        if (existingItem) {
            updateQuantity(product.id, existingItem.quantity + 1);
        } else {
            const newItem: CartItem = {
                product_id: product.id,
                product,
                quantity: 1,
                subtotal: product.price,
            };
            setCart([...cart, newItem]);
        }
    };

    const updateQuantity = (productId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            removeFromCart(productId);
            return;
        }

        setCart(
            cart.map((item) => {
                if (item.product_id === productId) {
                    return {
                        ...item,
                        quantity: newQuantity,
                        subtotal: item.product.price * newQuantity,
                    };
                }
                return item;
            }),
        );
    };

    const removeFromCart = (productId: string) => {
        setCart(cart.filter((item) => item.product_id !== productId));
    };

    const getSubtotal = () => {
        return cart.reduce((total, item) => total + item.subtotal, 0);
    };

    const getTaxAmount = () => {
        return getSubtotal() * TAX_RATE;
    };

    const getTotalAmount = () => {
        return getSubtotal() + getTaxAmount();
    };

    // Handle create order
    const handleCreate = async () => {
        if (cart.length === 0) {
            setErrors({ items: 'Ajoutez au moins un produit à la commande.' });
            return;
        }

        if (!formData.customer_name.trim()) {
            setErrors({ customer_name: 'Le nom du client est obligatoire.' });
            return;
        }

        if (!formData.status) {
            setErrors({ status: 'Le statut de la commande est obligatoire.' });
            return;
        }

        setIsLoading(true);
        setErrors({});

        const items = cart.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
        }));

        const formDataToSend = {
            ...formData,
            items,
        };

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

            const response = await fetch('/admin/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(formDataToSend),
            });

            if (response.ok) {
                const createdOrder = await response.json();
                setIsCreateModalOpen(false);
                resetForm();

                if (typeof createdOrder.order_internal_id === 'number') {
                    await handlePrint(createdOrder.order_internal_id);
                }

                // Reload to get updated data
                window.location.reload();
            } else {
                const errorData = await response.json();
                setErrors(errorData.errors || { general: 'Impossible de créer la commande.' });
            }
        } catch {
            setErrors({ general: 'Une erreur réseau est survenue.' });
        } finally {
            setIsLoading(false);
        }
    };

    // Handle edit order
    const handleEdit = async () => {
        if (!selectedOrder) return;

        setIsLoading(true);
        setErrors({});

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

            const response = await fetch(`/admin/orders/${selectedOrder.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setIsEditModalOpen(false);
                setSelectedOrder(null);
                resetForm();

                // Reload to get updated data
                window.location.reload();
            } else {
                const errorData = await response.json();
                setErrors(errorData.errors || { general: 'Impossible de mettre à jour la commande.' });
            }
        } catch {
            setErrors({ general: 'Une erreur réseau est survenue.' });
        } finally {
            setIsLoading(false);
        }
    };

    // Handle delete order
    const handleDelete = async () => {
        if (!selectedOrder) return;

        setIsLoading(true);

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

            const response = await fetch(`/admin/orders/${selectedOrder.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (response.ok) {
                setIsDeleteModalOpen(false);
                setSelectedOrder(null);

                // Reload to get updated data
                window.location.reload();
            } else {
                setErrors((current) => ({ ...current, general: 'Impossible de supprimer la commande.' }));
            }
        } catch {
            setErrors((current) => ({ ...current, general: 'Une erreur réseau est survenue.' }));
        } finally {
            setIsLoading(false);
        }
    };

    // Handle status update
    const handleStatusUpdate = (orderId: number, newStatus: string) => {
        setStatusUpdatingId(orderId);
        router.post(
            `/admin/orders/${orderId}/status`,
            {
                status: newStatus,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({ only: ['orders'] });
                },
                onError: () => {
                    setErrors((current) => ({ ...current, general: 'Le statut n’a pas pu être mis à jour.' }));
                },
                onFinish: () => setStatusUpdatingId(null),
            },
        );
    };

    // Open edit modal
    const openEditModal = (order: Order) => {
        setSelectedOrder(order);
        setFormData({
            customer_name: order.customer_name,
            payment_method: order.payment.method,
            fulfillment_type: order.fulfillment_type ?? order.order_type ?? 'pickup',
            table_number: order.table_number ?? undefined,
            delivery_phone: order.customer_phone ?? undefined,
            delivery_address: order.delivery_address ?? undefined,
            delivery_instructions: order.delivery_instructions ?? undefined,
            status: order.status, // Order status, not payment status
            items: [],
        });
        setIsEditModalOpen(true);
    };

    // Open view modal
    const openViewModal = (order: Order) => {
        setSelectedOrder(order);
        setIsViewModalOpen(true);
    };

    // Open delete modal
    const openDeleteModal = (order: Order) => {
        setSelectedOrder(order);
        setIsDeleteModalOpen(true);
    };

    // Handle print order
    const handlePrint = async (orderId: number) => {
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

            const response = await fetch(`/admin/orders/${orderId}/print`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                setErrors((current) => ({ ...current, print: 'Le ticket n’a pas pu être imprimé. Vérifiez l’imprimante puis réessayez.' }));
            }
        } catch {
            setErrors((current) => ({ ...current, print: 'L’imprimante est momentanément indisponible.' }));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestion des commandes" />

            <main className="flex min-h-full flex-1 flex-col gap-6 bg-[#f6efe4] p-4 sm:p-6 lg:p-8">
                {/* Header */}
                <div className="flex flex-col gap-4 rounded-[1.75rem] bg-[#211812] px-5 py-6 text-[#fff7e9] shadow-[0_20px_48px_rgba(35,22,14,0.14)] sm:flex-row sm:items-center sm:justify-between sm:px-7">
                    <div>
                        <p className="text-xs font-black tracking-[0.18em] text-[#ef9367] uppercase">Service en cours</p>
                        <h1 className="mt-2 text-3xl font-black tracking-[-0.035em]">Commandes</h1>
                        <p className="mt-2 text-sm text-[#d8c7b4]">Pilotez les commandes de la prise en charge jusqu’à la remise au client.</p>
                    </div>

                    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                        <DialogTrigger asChild>
                            <Button
                                onClick={() => resetForm()}
                                className="min-h-11 rounded-xl bg-[#d8562a] px-5 font-bold text-white hover:bg-[#ef6840] focus-visible:ring-2 focus-visible:ring-[#ffd6bc]"
                            >
                                <PlusIcon />
                                Nouvelle commande
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto border-[#ddcfbd] bg-[#fffaf2]">
                            <DialogHeader>
                                <DialogTitle>Créer une commande</DialogTitle>
                                <DialogDescription>Enregistrez une commande prise sur place, à emporter ou en livraison.</DialogDescription>
                            </DialogHeader>

                            <div className="grid grid-cols-1 gap-6">
                                {/* Product Selection */}
                                <div className="">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Sélection des produits</CardTitle>
                                            <Input
                                                placeholder="Rechercher un produit…"
                                                value={productSearchTerm}
                                                onChange={(e) => setProductSearchTerm(e.target.value)}
                                            />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid max-h-64 grid-cols-1 gap-4 overflow-y-auto md:grid-cols-2">
                                                {filteredProducts.map((product) => (
                                                    <button
                                                        type="button"
                                                        key={product.id}
                                                        className="w-full cursor-pointer rounded-xl border border-[#ddcfbd] p-3 text-left transition-colors hover:bg-[#f6eadb] focus-visible:ring-2 focus-visible:ring-[#d8562a] focus-visible:outline-none"
                                                        onClick={() => addToCart(product)}
                                                        aria-label={`Ajouter ${product.name} au panier`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {product.photos.length > 0 ? (
                                                                <img
                                                                    src={product.photos[0].url}
                                                                    alt={product.name}
                                                                    className="h-12 w-12 rounded object-cover"
                                                                    loading="lazy"
                                                                    decoding="async"
                                                                />
                                                            ) : (
                                                                <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-200">
                                                                    <ImageIcon className="h-6 w-6 text-gray-400" />
                                                                </div>
                                                            )}
                                                            <div className="flex-1">
                                                                <h4 className="text-sm font-medium">{product.name}</h4>
                                                                <p className="text-sm font-bold text-[#b84523]">{formatCurrency(product.price)}</p>
                                                            </div>
                                                            <PlusIcon className="h-4 w-4 text-gray-400" />
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Cart & Customer Form */}
                                <div className="space-y-4">
                                    {/* Cart */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center text-base">
                                                <ShoppingCart className="mr-2 h-4 w-4" />
                                                Panier ({cart.length})
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {cart.length === 0 ? (
                                                <p className="py-3 text-center text-sm text-muted-foreground">Le panier est vide.</p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {cart.map((item) => (
                                                        <div key={item.product_id} className="flex items-center gap-2">
                                                            <div className="flex-1">
                                                                <p className="text-xs font-medium">{item.product.name}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {formatCurrency(item.product.price)} x {item.quantity}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="size-11 p-0"
                                                                    aria-label={`Retirer une unité de ${item.product.name}`}
                                                                    onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                                                                >
                                                                    <Minus className="h-3 w-3" />
                                                                </Button>
                                                                <span className="w-6 text-center text-xs">{item.quantity}</span>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="size-11 p-0"
                                                                    aria-label={`Ajouter une unité de ${item.product.name}`}
                                                                    onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                                                                >
                                                                    <PlusIcon className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                            <p className="min-w-[60px] text-right text-xs font-semibold">
                                                                {formatCurrency(item.subtotal)}
                                                            </p>
                                                        </div>
                                                    ))}

                                                    <div className="space-y-2 border-t pt-3">
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span>Sous-total</span>
                                                            <span>{formatCurrency(getSubtotal())}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span>Taxe ({TAX_RATE * 100} %)</span>
                                                            <span>{formatCurrency(getTaxAmount())}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between border-t pt-2 text-sm font-bold">
                                                            <span>Total</span>
                                                            <span>{formatCurrency(getTotalAmount())}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Customer Form */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-base">Informations de service</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div>
                                                <Label htmlFor="customer_name" className="text-sm">
                                                    Nom du client *
                                                </Label>
                                                <Input
                                                    id="customer_name"
                                                    value={formData.customer_name}
                                                    onChange={(e) => handleInputChange('customer_name', e.target.value)}
                                                    className="min-h-11"
                                                />
                                                {errors.customer_name && <p className="mt-1 text-xs text-red-500">{errors.customer_name}</p>}
                                            </div>

                                            <div>
                                                <Label htmlFor="fulfillment_type" className="text-sm">
                                                    Mode de service *
                                                </Label>
                                                <Select
                                                    value={formData.fulfillment_type}
                                                    onValueChange={(value) => handleInputChange('fulfillment_type', value)}
                                                >
                                                    <SelectTrigger id="fulfillment_type" className="min-h-11">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="dine_in">Sur place</SelectItem>
                                                        <SelectItem value="pickup">À emporter</SelectItem>
                                                        <SelectItem value="delivery">Livraison</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {formData.fulfillment_type === 'dine_in' && (
                                                <div>
                                                    <Label htmlFor="table_number" className="text-sm">
                                                        Numéro de table *
                                                    </Label>
                                                    <Input
                                                        id="table_number"
                                                        type="number"
                                                        min={1}
                                                        max={999}
                                                        value={formData.table_number ?? ''}
                                                        onChange={(e) =>
                                                            handleInputChange('table_number', e.target.value ? Number(e.target.value) : undefined)
                                                        }
                                                        className="min-h-11"
                                                    />
                                                </div>
                                            )}

                                            {formData.fulfillment_type === 'delivery' && (
                                                <div className="space-y-3 rounded-xl border border-[#ddcfbd] bg-[#f8eee1] p-3">
                                                    <div>
                                                        <Label htmlFor="delivery_phone" className="text-sm">
                                                            Téléphone *
                                                        </Label>
                                                        <Input
                                                            id="delivery_phone"
                                                            value={formData.delivery_phone ?? ''}
                                                            onChange={(e) => handleInputChange('delivery_phone', e.target.value)}
                                                            className="min-h-11"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="delivery_address" className="text-sm">
                                                            Adresse de livraison *
                                                        </Label>
                                                        <Textarea
                                                            id="delivery_address"
                                                            value={formData.delivery_address ?? ''}
                                                            onChange={(e) => handleInputChange('delivery_address', e.target.value)}
                                                            rows={3}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <div>
                                                <Label htmlFor="payment_method" className="text-sm">
                                                    Moyen de paiement *
                                                </Label>
                                                <Select
                                                    value={formData.payment_method}
                                                    onValueChange={(value) => handleInputChange('payment_method', value)}
                                                >
                                                    <SelectTrigger className="min-h-11">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="cash">Espèces</SelectItem>
                                                        <SelectItem value="card">Carte bancaire</SelectItem>
                                                        <SelectItem value="digital">Paiement en ligne</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <Label htmlFor="order_status" className="text-sm">
                                                    Statut initial *
                                                </Label>
                                                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                                                    <SelectTrigger className="min-h-11">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="pending">À confirmer</SelectItem>
                                                        <SelectItem value="preparing">En préparation</SelectItem>
                                                        <SelectItem value="ready">Prête</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>

                            {errors.items && <p className="text-sm text-red-600">{errors.items}</p>}

                            <DialogFooter>
                                <Button variant="outline" className="min-h-11" onClick={() => setIsCreateModalOpen(false)} disabled={isLoading}>
                                    Annuler
                                </Button>
                                <Button
                                    className="min-h-11"
                                    onClick={handleCreate}
                                    disabled={isLoading || cart.length === 0 || !formData.customer_name}
                                >
                                    {isLoading ? 'Création…' : 'Créer la commande'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {(errors.general || errors.print) && (
                    <div
                        role="alert"
                        aria-live="polite"
                        className="rounded-xl border border-[#b42318]/25 bg-[#f9dfdc] px-4 py-3 text-sm font-semibold text-[#8d1f16]"
                    >
                        {errors.general ?? errors.print}
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-col gap-3 rounded-2xl border border-[#ddcfbd] bg-[#fffaf2] p-4 shadow-[0_8px_24px_rgba(64,39,23,0.04)] sm:flex-row sm:items-center">
                    <div className="relative min-w-0 flex-1 sm:max-w-md">
                        <SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                        <Input
                            aria-label="Rechercher une commande"
                            placeholder="Rechercher par client ou référence…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="min-h-11 pl-10"
                        />
                    </div>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="min-h-11 w-full sm:w-[220px]">
                            <SelectValue placeholder="Tous les statuts" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les statuts</SelectItem>
                            <SelectItem value="pending">À confirmer</SelectItem>
                            <SelectItem value="preparing">En préparation</SelectItem>
                            <SelectItem value="ready">Prête</SelectItem>
                            <SelectItem value="out_for_delivery">En livraison</SelectItem>
                            <SelectItem value="delivered">Livrée</SelectItem>
                            <SelectItem value="completed">Terminée</SelectItem>
                            <SelectItem value="cancelled">Annulée</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Orders Grid */}
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {filteredOrders.map((order) => {
                        const status = getStatusMeta(order.status);
                        const nextAction = getNextAction(order);
                        const fulfillment = order.fulfillment_type ?? order.order_type;
                        return (
                            <Card
                                key={order.id}
                                className="overflow-hidden rounded-2xl border-[#ddcfbd] bg-[#fffaf2] shadow-[0_10px_28px_rgba(64,39,23,0.05)] transition-transform hover:-translate-y-0.5 motion-reduce:transform-none"
                            >
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg font-black text-[#2d211a]">
                                            {order.reference ?? `Commande #${order.id}`}
                                        </CardTitle>
                                        <Badge variant={status.variant} className={status.className}>
                                            {status.label}
                                        </Badge>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">{order.customer_name}</p>
                                        {order.customer_phone && <p className="text-xs text-muted-foreground">{order.customer_phone}</p>}
                                        <p className="text-xl font-black text-[#b84523] tabular-nums">{formatCurrency(order.total_amount)}</p>
                                    </div>
                                </CardHeader>

                                <CardContent className="pt-0">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">Paiement</span>
                                            <Badge
                                                variant={paymentStatusConfig[order.payment.status as keyof typeof paymentStatusConfig]?.variant}
                                                className="text-xs"
                                            >
                                                {paymentStatusConfig[order.payment.status]?.label ?? order.payment.status}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">Service</span>
                                            <Badge variant="outline" className="text-xs">
                                                {fulfillmentLabels[fulfillment] ?? fulfillment}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Calendar className="h-3 w-3" />
                                            <span>{formatDate(order.created_at)}</span>
                                        </div>
                                    </div>

                                    {nextAction && (
                                        <Button
                                            className="mt-4 min-h-11 w-full rounded-xl bg-[#d8562a] font-bold hover:bg-[#c94720]"
                                            onClick={() => handleStatusUpdate(order.id, nextAction.status)}
                                            disabled={statusUpdatingId === order.id}
                                        >
                                            {statusUpdatingId === order.id ? 'Mise à jour…' : nextAction.label}
                                        </Button>
                                    )}
                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                        <Button variant="outline" size="sm" className="min-h-11" onClick={() => openViewModal(order)}>
                                            <EyeIcon className="h-4 w-4" />
                                            Détails
                                        </Button>
                                        <Button variant="outline" size="sm" className="min-h-11" onClick={() => openEditModal(order)}>
                                            <EditIcon className="h-4 w-4" />
                                            Modifier
                                        </Button>
                                        {order.status === 'cancelled' && (
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                className="col-span-2 min-h-11"
                                                onClick={() => openDeleteModal(order)}
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                                Supprimer
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Infinite Scroll Observer */}
                {hasMorePages && (
                    <div ref={observerRef} className="flex justify-center py-8">
                        {isLoadingMore ? (
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-gray-900"></div>
                                <span className="text-muted-foreground">Chargement des commandes…</span>
                            </div>
                        ) : (
                            <div className="text-muted-foreground">Faites défiler pour afficher la suite</div>
                        )}
                    </div>
                )}

                {/* End of results indicator */}
                {!hasMorePages && filteredOrders.length > 0 && (
                    <div className="flex justify-center py-8">
                        <div className="text-center text-muted-foreground">
                            <div className="mx-auto mb-4 h-px w-24 bg-border"></div>
                            <p>Toutes les commandes sont affichées.</p>
                            <p className="mt-1 text-sm">{filteredOrders.length} commande(s)</p>
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {filteredOrders.length === 0 && !isLoadingMore && (
                    <div className="py-12 text-center">
                        <Package className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-bold text-[#31241d]">Aucune commande trouvée</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {searchTerm || (statusFilter && statusFilter !== '' && statusFilter !== 'all')
                                ? 'Modifiez la recherche ou le filtre sélectionné.'
                                : 'Créez la première commande pour commencer.'}
                        </p>
                    </div>
                )}

                {/* View Order Modal */}
                <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                    <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Détails de la commande {selectedOrder?.reference ?? `#${selectedOrder?.id}`}</DialogTitle>
                            <DialogDescription>Produits, service, client et règlement.</DialogDescription>
                        </DialogHeader>

                        {selectedOrder && (
                            <div className="grid grid-cols-1 gap-6">
                                {/* Order Items */}
                                <div className="">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center">
                                                <Package className="mr-2 h-5 w-5" />
                                                Produits commandés
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                {selectedOrder.order_items.map((item) => (
                                                    <div key={item.id} className="flex items-center gap-3 rounded border p-3">
                                                        {item.product.photos.length > 0 ? (
                                                            <img
                                                                src={item.product.photos[0].url}
                                                                alt={item.product.name}
                                                                className="h-12 w-12 rounded object-cover"
                                                                loading="lazy"
                                                                decoding="async"
                                                            />
                                                        ) : (
                                                            <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-200">
                                                                <ImageIcon className="h-6 w-6 text-gray-400" />
                                                            </div>
                                                        )}
                                                        <div className="flex-1">
                                                            <p className="font-medium">{item.product.name}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {formatCurrency(item.price)} x {item.quantity}
                                                            </p>
                                                        </div>
                                                        <p className="font-semibold">{formatCurrency(item.subtotal)}</p>
                                                    </div>
                                                ))}

                                                <div className="space-y-2 border-t pt-3">
                                                    {(() => {
                                                        const orderSubtotal = selectedOrder.order_items.reduce(
                                                            (total, item) => total + item.subtotal,
                                                            0,
                                                        );
                                                        const orderTax = selectedOrder.total_amount - orderSubtotal;

                                                        return (
                                                            <>
                                                                <div className="flex items-center justify-between text-sm">
                                                                    <span>Sous-total</span>
                                                                    <span>{formatCurrency(orderSubtotal)}</span>
                                                                </div>
                                                                <div className="flex items-center justify-between text-sm">
                                                                    <span>Taxe ({TAX_RATE * 100} %)</span>
                                                                    <span>{formatCurrency(orderTax)}</span>
                                                                </div>
                                                                <div className="flex items-center justify-between border-t pt-2 text-lg font-bold">
                                                                    <span>Total</span>
                                                                    <span>{formatCurrency(selectedOrder.total_amount)}</span>
                                                                </div>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Notes */}
                                    {selectedOrder.notes && (
                                        <Card className="mt-4">
                                            <CardHeader>
                                                <CardTitle className="flex items-center">
                                                    <FileText className="mr-2 h-5 w-5" />
                                                    Notes de commande
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-gray-700">{selectedOrder.notes}</p>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>

                                {/* Order Info Sidebar */}
                                <div className="space-y-4">
                                    {/* Order Status */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Suivi de la commande</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span>Statut</span>
                                                <Badge
                                                    variant={getStatusMeta(selectedOrder.status).variant}
                                                    className={getStatusMeta(selectedOrder.status).className}
                                                >
                                                    {getStatusMeta(selectedOrder.status).label}
                                                </Badge>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span>Service</span>
                                                <Badge variant="outline">
                                                    {fulfillmentLabels[selectedOrder.fulfillment_type ?? selectedOrder.order_type] ??
                                                        selectedOrder.order_type}
                                                </Badge>
                                            </div>

                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Calendar className="h-4 w-4" />
                                                <span>{formatDate(selectedOrder.created_at)}</span>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Customer Info */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Informations client</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            <div>
                                                <p className="font-medium">{selectedOrder.customer_name}</p>
                                            </div>

                                            {selectedOrder.customer_phone && (
                                                <div className="text-sm">
                                                    <span className="text-muted-foreground">Téléphone : </span>
                                                    <span>{selectedOrder.customer_phone}</span>
                                                </div>
                                            )}

                                            {selectedOrder.customer_email && (
                                                <div className="text-sm">
                                                    <span className="text-muted-foreground">Email: </span>
                                                    <span>{selectedOrder.customer_email}</span>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Payment Info */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center">
                                                <CreditCard className="mr-2 h-5 w-5" />
                                                Paiement
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span>Statut</span>
                                                <Badge
                                                    variant={
                                                        paymentStatusConfig[selectedOrder.payment.status as keyof typeof paymentStatusConfig]?.variant
                                                    }
                                                >
                                                    {paymentStatusConfig[selectedOrder.payment.status]?.label ?? selectedOrder.payment.status}
                                                </Badge>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span>Moyen</span>
                                                <span>{paymentMethodLabels[selectedOrder.payment.method] ?? selectedOrder.payment.method}</span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span>Montant</span>
                                                <span className="font-medium">{formatCurrency(selectedOrder.payment.amount)}</span>
                                            </div>

                                            <div className="text-xs text-muted-foreground">
                                                <p>Identifiant de transaction</p>
                                                <p className="font-mono">{selectedOrder.payment.transaction_id}</p>
                                            </div>

                                            {selectedOrder.payment.paid_at && (
                                                <div className="text-xs text-muted-foreground">
                                                    <p>Payé le</p>
                                                    <p>{formatDate(selectedOrder.payment.paid_at)}</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button variant="outline" className="min-h-11" onClick={() => setIsViewModalOpen(false)}>
                                Fermer
                            </Button>
                            {selectedOrder && (
                                <Button className="min-h-11" onClick={() => handlePrint(selectedOrder.id)}>
                                    <Printer className="mr-2 h-4 w-4" />
                                    Imprimer le ticket
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Order Modal */}
                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Modifier la commande {selectedOrder?.reference ?? `#${selectedOrder?.id}`}</DialogTitle>
                            <DialogDescription>Mettez à jour le client et faites avancer la commande.</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="edit_customer_name">Nom du client *</Label>
                                <Input
                                    id="edit_customer_name"
                                    value={formData.customer_name}
                                    onChange={(e) => handleInputChange('customer_name', e.target.value)}
                                />
                                {errors.customer_name && <p className="mt-1 text-sm text-red-500">{errors.customer_name}</p>}
                            </div>

                            <div>
                                <Label htmlFor="edit_customer_phone">Téléphone</Label>
                                <Input
                                    id="edit_customer_phone"
                                    value={formData.customer_phone}
                                    onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                                />
                            </div>

                            <div>
                                <Label htmlFor="edit_customer_email">Email</Label>
                                <Input
                                    id="edit_customer_email"
                                    type="email"
                                    value={formData.customer_email}
                                    onChange={(e) => handleInputChange('customer_email', e.target.value)}
                                />
                            </div>

                            <div>
                                <Label htmlFor="edit_status">Statut *</Label>
                                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">À confirmer</SelectItem>
                                        <SelectItem value="preparing">En préparation</SelectItem>
                                        <SelectItem value="ready">Prête</SelectItem>
                                        <SelectItem value="out_for_delivery">En livraison</SelectItem>
                                        <SelectItem value="delivered">Livrée</SelectItem>
                                        <SelectItem value="completed">Terminée</SelectItem>
                                        <SelectItem value="cancelled">Annulée</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="edit_notes">Notes internes</Label>
                                <Textarea
                                    id="edit_notes"
                                    value={formData.notes}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" className="min-h-11" onClick={() => setIsEditModalOpen(false)} disabled={isLoading}>
                                Annuler
                            </Button>
                            <Button className="min-h-11" onClick={handleEdit} disabled={isLoading || !formData.customer_name || !formData.status}>
                                {isLoading ? 'Enregistrement…' : 'Enregistrer'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Modal */}
                <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Supprimer la commande</DialogTitle>
                            <DialogDescription>
                                Confirmez-vous la suppression de la commande #{selectedOrder?.id} de « {selectedOrder?.customer_name} » ? Cette action
                                est définitive.
                            </DialogDescription>
                        </DialogHeader>

                        <DialogFooter>
                            <Button variant="outline" className="min-h-11" onClick={() => setIsDeleteModalOpen(false)} disabled={isLoading}>
                                Annuler
                            </Button>
                            <Button variant="destructive" className="min-h-11" onClick={handleDelete} disabled={isLoading}>
                                {isLoading ? 'Suppression…' : 'Supprimer la commande'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </main>
        </AppLayout>
    );
}
