import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselIndicators, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { type Category, type Pagination, type Product } from '@/types/models';
import { Head, router } from '@inertiajs/react';
import { EditIcon, ImageIcon, PlusIcon, SearchIcon, TrashIcon, UploadIcon, XIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface ProductFormData {
    name: string;
    category_id: number | '';
    price: number | '';
    photos: File[];
    remove_photos: number[];
}

interface Props {
    products: Product[];
    categories: Category[];
    pagination?: Pagination;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Vue d’ensemble',
        href: '/admin/dashboard',
    },
    {
        title: 'Carte & produits',
        href: '/admin/products',
    },
];

export default function ProductsIndex({ products: initialProducts, categories, pagination }: Props) {
    // State
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Infinite scroll state
    const [currentPage, setCurrentPage] = useState(pagination?.current_page || 1);
    const [hasMorePages, setHasMorePages] = useState(pagination?.has_more_pages || false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const observerRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState<ProductFormData>({
        name: '',
        category_id: '',
        price: '',
        photos: [],
        remove_photos: [],
    });

    // Update products when props change
    useEffect(() => {
        setProducts(initialProducts);
        setCurrentPage(pagination?.current_page || 1);
        setHasMorePages(pagination?.has_more_pages || false);
    }, [initialProducts, pagination]);

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Filter products based on search term and category
    const filteredProducts = products.filter((product) => {
        const matchesSearch =
            product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            product.category?.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
        const matchesCategory = categoryFilter === '' || categoryFilter === 'all' || product.category_id.toString() === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    // Load more products function
    const loadMoreProducts = useCallback(async () => {
        if (isLoadingMore || !hasMorePages) return;

        setIsLoadingMore(true);

        try {
            const params = new URLSearchParams({
                page: (currentPage + 1).toString(),
            });

            if (debouncedSearchTerm) {
                params.append('search', debouncedSearchTerm);
            }

            if (categoryFilter && categoryFilter !== 'all') {
                params.append('category', categoryFilter);
            }

            const response = await fetch(`/admin/products?${params.toString()}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();

                setProducts((prev) => [...prev, ...data.products]);
                setCurrentPage(data.pagination.current_page);
                setHasMorePages(data.pagination.has_more_pages);
            }
        } catch (error) {
            console.error('Failed to load more products:', error);
        } finally {
            setIsLoadingMore(false);
        }
    }, [currentPage, hasMorePages, isLoadingMore, debouncedSearchTerm, categoryFilter]);

    // Intersection Observer for infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMorePages && !isLoadingMore) {
                    loadMoreProducts();
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
    }, [loadMoreProducts, hasMorePages, isLoadingMore]);

    // Reset pagination when search or filter changes
    useEffect(() => {
        setCurrentPage(1);
        setHasMorePages(true);
        // Reset products to initial when filtering locally
        // If you want server-side filtering, you'd make an API call here
    }, [debouncedSearchTerm, categoryFilter]);

    // Reset form
    const resetForm = () => {
        setFormData({
            name: '',
            category_id: '',
            price: '',
            photos: [],
            remove_photos: [],
        });
        setErrors({});
    };

    // Handle form input changes
    const handleInputChange = <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // Handle file upload
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            const fileArray = Array.from(files);
            setFormData((prev) => ({
                ...prev,
                photos: [...prev.photos, ...fileArray],
            }));
        }
    };

    // Remove photo from form
    const removePhoto = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            photos: prev.photos.filter((_, i) => i !== index),
        }));
    };

    // Mark existing photo for removal
    const markPhotoForRemoval = (photoId: number) => {
        setFormData((prev) => ({
            ...prev,
            remove_photos: [...prev.remove_photos, photoId],
        }));
    };

    // Unmark existing photo for removal
    const unmarkPhotoForRemoval = (photoId: number) => {
        setFormData((prev) => ({
            ...prev,
            remove_photos: prev.remove_photos.filter((id) => id !== photoId),
        }));
    };

    // Handle create product
    const handleCreate = async () => {
        setIsLoading(true);
        setErrors({});

        const formDataToSend = new FormData();
        formDataToSend.append('name', formData.name);
        formDataToSend.append('category_id', formData.category_id.toString());
        formDataToSend.append('price', formData.price.toString());

        formData.photos.forEach((photo, index) => {
            formDataToSend.append(`photos[${index}]`, photo);
        });

        router.post('/admin/products', formDataToSend, {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                resetForm();
            },
            onError: (errors) => {
                setErrors(errors);
            },
            onFinish: () => {
                setIsLoading(false);
            },
        });
    };

    // Handle edit product
    const handleEdit = async () => {
        if (!selectedProduct) return;

        setIsLoading(true);
        setErrors({});

        const formDataToSend = new FormData();
        formDataToSend.append('_method', 'PUT');
        formDataToSend.append('name', formData.name);
        formDataToSend.append('category_id', formData.category_id.toString());
        formDataToSend.append('price', formData.price.toString());

        // Add new photos
        formData.photos.forEach((photo, index) => {
            formDataToSend.append(`photos[${index}]`, photo);
        });

        // Add photos to remove
        formData.remove_photos.forEach((photoId, index) => {
            formDataToSend.append(`remove_photos[${index}]`, photoId.toString());
        });

        router.post(`/admin/products/${selectedProduct.id}`, formDataToSend, {
            onSuccess: () => {
                setIsEditModalOpen(false);
                setSelectedProduct(null);
                resetForm();
            },
            onError: (errors) => {
                setErrors(errors);
            },
            onFinish: () => {
                setIsLoading(false);
            },
        });
    };

    // Handle delete product
    const handleDelete = async () => {
        if (!selectedProduct) return;

        setIsLoading(true);

        router.delete(`/admin/products/${selectedProduct.id}`, {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setSelectedProduct(null);
            },
            onFinish: () => {
                setIsLoading(false);
            },
        });
    };

    // Open edit modal with selected product data
    const openEditModal = (product: Product) => {
        setSelectedProduct(product);
        setFormData({
            name: product.name,
            category_id: product.category_id,
            price: product.price,
            photos: [],
            remove_photos: [],
        });
        setIsEditModalOpen(true);
    };

    // Open delete modal
    const openDeleteModal = (product: Product) => {
        setSelectedProduct(product);
        setIsDeleteModalOpen(true);
    };

    // Format prices for the restaurant's French menu.
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Carte et produits" />

            <main className="flex min-h-full flex-1 flex-col gap-6 bg-[#f6efe4] p-4 sm:p-6 lg:p-8">
                {/* Header */}
                <div className="flex flex-col gap-4 rounded-[1.75rem] bg-[#211812] px-5 py-6 text-[#fff7e9] shadow-[0_20px_48px_rgba(35,22,14,0.14)] sm:flex-row sm:items-center sm:justify-between sm:px-7">
                    <div>
                        <p className="text-xs font-black tracking-[0.18em] text-[#ef9367] uppercase">Carte Teisseire Pizza</p>
                        <h1 className="mt-2 text-3xl font-black tracking-[-0.035em]">Produits</h1>
                        <p className="mt-2 text-sm text-[#d8c7b4]">Gérez les recettes, les boissons, les prix et les visuels du menu.</p>
                    </div>

                    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                        <DialogTrigger asChild>
                            <Button
                                onClick={() => resetForm()}
                                className="min-h-11 rounded-xl bg-[#d8562a] px-5 font-bold text-white hover:bg-[#ef6840] focus-visible:ring-2 focus-visible:ring-[#ffd6bc]"
                            >
                                <PlusIcon />
                                Ajouter un produit
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-[#ddcfbd] bg-[#fffaf2]">
                            <DialogHeader>
                                <DialogTitle>Ajouter un produit</DialogTitle>
                                <DialogDescription>Créez une nouvelle recette ou boisson pour la carte.</DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                                {/* Product Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nom du produit</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        placeholder="Ex. Margherita"
                                        className="min-h-11"
                                    />
                                    {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                                </div>

                                {/* Category */}
                                <div className="space-y-2">
                                    <Label htmlFor="category">Catégorie</Label>
                                    <Select
                                        value={formData.category_id.toString()}
                                        onValueChange={(value) => handleInputChange('category_id', parseInt(value))}
                                    >
                                        <SelectTrigger className="min-h-11">
                                            <SelectValue placeholder="Sélectionner une catégorie" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((category) => (
                                                <SelectItem key={category.id} value={category.id.toString()}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.category_id && <p className="text-sm text-red-600">{errors.category_id}</p>}
                                </div>

                                {/* Price */}
                                <div className="space-y-2">
                                    <Label htmlFor="price">Prix (€)</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || '')}
                                        placeholder="Ex. 10,50"
                                        min="0"
                                        step="0.01"
                                        className="min-h-11"
                                    />
                                    {errors.price && <p className="text-sm text-red-600">{errors.price}</p>}
                                </div>

                                {/* Photos */}
                                <div className="space-y-2">
                                    <Label>Photos du produit</Label>
                                    <div className="rounded-xl border-2 border-dashed border-[#cfbda7] bg-[#f9efe2] p-5">
                                        <div className="text-center">
                                            <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                                            <div className="mt-2">
                                                <Input
                                                    type="file"
                                                    multiple
                                                    accept="image/*"
                                                    onChange={handleFileUpload}
                                                    className="hidden"
                                                    id="photo-upload"
                                                />
                                                <Label
                                                    htmlFor="photo-upload"
                                                    className="inline-flex min-h-11 cursor-pointer items-center rounded-lg px-3 text-sm font-bold text-[#b84523] focus-within:ring-2 focus-within:ring-[#d8562a] hover:bg-[#f1dfca]"
                                                >
                                                    Choisir des photos
                                                </Label>
                                            </div>
                                            <p className="text-xs text-[#75675b]">PNG, JPG ou WebP, 5 Mo maximum par image</p>
                                        </div>
                                    </div>

                                    {/* Preview uploaded photos */}
                                    {formData.photos.length > 0 && (
                                        <div className="mt-4 grid grid-cols-3 gap-2">
                                            {formData.photos.map((photo, index) => (
                                                <div key={index} className="relative">
                                                    <img
                                                        src={URL.createObjectURL(photo)}
                                                        alt={`Nouvelle photo ${index + 1}`}
                                                        className="h-20 w-full rounded object-cover"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        className="absolute -top-2 -right-2 size-9 after:absolute after:-inset-1"
                                                        aria-label={`Retirer la photo ${index + 1}`}
                                                        onClick={() => removePhoto(index)}
                                                    >
                                                        <XIcon className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {errors.photos && <p className="text-sm text-red-600">{errors.photos}</p>}
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" className="min-h-11" onClick={() => setIsCreateModalOpen(false)} disabled={isLoading}>
                                    Annuler
                                </Button>
                                <Button
                                    className="min-h-11"
                                    onClick={handleCreate}
                                    disabled={isLoading || !formData.name || !formData.category_id || !formData.price}
                                >
                                    {isLoading ? 'Création…' : 'Créer le produit'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-3 rounded-2xl border border-[#ddcfbd] bg-[#fffaf2] p-4 shadow-[0_8px_24px_rgba(64,39,23,0.04)] sm:flex-row sm:items-center">
                    <div className="relative min-w-0 flex-1 sm:max-w-md">
                        <SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                        <Input
                            aria-label="Rechercher un produit"
                            placeholder="Rechercher un produit…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="min-h-11 pl-10"
                        />
                    </div>

                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="min-h-11 w-full sm:w-[220px]">
                            <SelectValue placeholder="Toutes les catégories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Toutes les catégories</SelectItem>
                            {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                    {category.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Products Grid */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {filteredProducts.map((product) => (
                        <Card
                            key={product.id}
                            className="overflow-hidden rounded-2xl border-[#ddcfbd] bg-[#fffaf2] shadow-[0_10px_28px_rgba(64,39,23,0.05)] transition-transform hover:-translate-y-0.5 motion-reduce:transform-none"
                        >
                            <div className="relative aspect-[4/3] bg-[#eadfce]">
                                {product.photos && product.photos.length > 0 ? (
                                    product.photos.length === 1 ? (
                                        // Single image - no carousel needed
                                        <img
                                            src={product.photos[0].url}
                                            alt={product.name}
                                            className="h-full w-full object-cover"
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    ) : (
                                        // Multiple images - use carousel
                                        <Carousel className="aspect-square w-full">
                                            <CarouselContent className="aspect-square">
                                                {product.photos.map((photo, index) => (
                                                    <CarouselItem key={photo.id} className="aspect-square">
                                                        <img
                                                            src={photo.url}
                                                            alt={`${product.name} - Photo ${index + 1}`}
                                                            className="h-full w-full object-cover"
                                                            loading="lazy"
                                                            decoding="async"
                                                        />
                                                    </CarouselItem>
                                                ))}
                                            </CarouselContent>
                                            <CarouselPrevious className="size-11" />
                                            <CarouselNext className="size-11" />
                                            <CarouselIndicators />
                                        </Carousel>
                                    )
                                ) : (
                                    <div className="flex h-full items-center justify-center">
                                        <ImageIcon className="h-12 w-12 text-gray-400" />
                                    </div>
                                )}
                            </div>

                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-black text-[#2d211a]">{product.name}</CardTitle>
                                <div className="flex items-center justify-between">
                                    <Badge variant="secondary">{product.category?.name}</Badge>
                                    <span className="text-lg font-black text-[#b84523] tabular-nums">{formatCurrency(product.price)}</span>
                                </div>
                            </CardHeader>

                            <CardContent className="pt-0">
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="min-h-11 flex-1" onClick={() => openEditModal(product)}>
                                        <EditIcon className="h-4 w-4" />
                                        Modifier
                                    </Button>
                                    <Button variant="destructive" size="sm" className="min-h-11 flex-1" onClick={() => openDeleteModal(product)}>
                                        <TrashIcon className="h-4 w-4" />
                                        Retirer
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Infinite Scroll Observer */}
                {hasMorePages && (
                    <div ref={observerRef} className="flex justify-center py-8">
                        {isLoadingMore ? (
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-gray-900"></div>
                                <span className="text-muted-foreground">Chargement des produits…</span>
                            </div>
                        ) : (
                            <div className="text-muted-foreground">Faites défiler pour afficher la suite</div>
                        )}
                    </div>
                )}

                {/* End of results indicator */}
                {!hasMorePages && filteredProducts.length > 0 && (
                    <div className="flex justify-center py-8">
                        <div className="text-center text-muted-foreground">
                            <div className="mx-auto mb-4 h-px w-24 bg-border"></div>
                            <p>Tous les produits sont affichés.</p>
                            <p className="mt-1 text-sm">{filteredProducts.length} produit(s)</p>
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {filteredProducts.length === 0 && !isLoadingMore && (
                    <div className="py-12 text-center">
                        <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-bold text-[#31241d]">Aucun produit trouvé</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {searchTerm || (categoryFilter && categoryFilter !== 'all')
                                ? 'Modifiez la recherche ou la catégorie sélectionnée.'
                                : 'Ajoutez le premier produit de la carte.'}
                        </p>
                    </div>
                )}

                {/* Edit Modal */}
                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-[#ddcfbd] bg-[#fffaf2]">
                        <DialogHeader>
                            <DialogTitle>Modifier le produit</DialogTitle>
                            <DialogDescription>Mettez à jour les informations et les visuels affichés à la carte.</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            {/* Product Name */}
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">Nom du produit</Label>
                                <Input
                                    id="edit-name"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    placeholder="Ex. Margherita"
                                    className="min-h-11"
                                />
                                {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                            </div>

                            {/* Category */}
                            <div className="space-y-2">
                                <Label htmlFor="edit-category">Catégorie</Label>
                                <Select
                                    value={formData.category_id.toString()}
                                    onValueChange={(value) => handleInputChange('category_id', parseInt(value))}
                                >
                                    <SelectTrigger className="min-h-11">
                                        <SelectValue placeholder="Sélectionner une catégorie" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((category) => (
                                            <SelectItem key={category.id} value={category.id.toString()}>
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.category_id && <p className="text-sm text-red-600">{errors.category_id}</p>}
                            </div>

                            {/* Price */}
                            <div className="space-y-2">
                                <Label htmlFor="edit-price">Prix (€)</Label>
                                <Input
                                    id="edit-price"
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || '')}
                                    placeholder="Ex. 10,50"
                                    min="0"
                                    step="0.01"
                                    className="min-h-11"
                                />
                                {errors.price && <p className="text-sm text-red-600">{errors.price}</p>}
                            </div>

                            {/* Current Photos */}
                            {selectedProduct?.photos && selectedProduct.photos.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Photos actuelles</Label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {selectedProduct.photos.map((photo) => (
                                            <div key={photo.id} className="relative">
                                                <img src={photo.url} alt={selectedProduct.name} className="h-20 w-full rounded object-cover" />
                                                {photo.is_primary && <Badge className="absolute top-1 left-1 text-xs">Principale</Badge>}
                                                <Button
                                                    type="button"
                                                    variant={formData.remove_photos.includes(photo.id) ? 'default' : 'destructive'}
                                                    size="icon"
                                                    className="absolute -top-2 -right-2 size-9 after:absolute after:-inset-1"
                                                    aria-label={
                                                        formData.remove_photos.includes(photo.id) ? 'Conserver cette photo' : 'Retirer cette photo'
                                                    }
                                                    onClick={() => {
                                                        if (formData.remove_photos.includes(photo.id)) {
                                                            unmarkPhotoForRemoval(photo.id);
                                                        } else {
                                                            markPhotoForRemoval(photo.id);
                                                        }
                                                    }}
                                                >
                                                    <XIcon className="h-3 w-3" />
                                                </Button>
                                                {formData.remove_photos.includes(photo.id) && (
                                                    <div className="bg-opacity-50 absolute inset-0 flex items-center justify-center rounded bg-red-500">
                                                        <span className="text-xs font-bold text-white">Sera retirée</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Add New Photos */}
                            <div className="space-y-2">
                                <Label>Ajouter des photos</Label>
                                <div className="rounded-xl border-2 border-dashed border-[#cfbda7] bg-[#f9efe2] p-5">
                                    <div className="text-center">
                                        <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                                        <div className="mt-2">
                                            <Input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                onChange={handleFileUpload}
                                                className="hidden"
                                                id="edit-photo-upload"
                                            />
                                            <Label
                                                htmlFor="edit-photo-upload"
                                                className="inline-flex min-h-11 cursor-pointer items-center rounded-lg px-3 text-sm font-bold text-[#b84523] hover:bg-[#f1dfca]"
                                            >
                                                Choisir de nouvelles photos
                                            </Label>
                                        </div>
                                        <p className="text-xs text-[#75675b]">PNG, JPG ou WebP, 5 Mo maximum par image</p>
                                    </div>
                                </div>

                                {/* Preview new photos */}
                                {formData.photos.length > 0 && (
                                    <div className="mt-4 grid grid-cols-3 gap-2">
                                        {formData.photos.map((photo, index) => (
                                            <div key={index} className="relative">
                                                <img
                                                    src={URL.createObjectURL(photo)}
                                                    alt={`Nouvelle photo ${index + 1}`}
                                                    className="h-20 w-full rounded object-cover"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute -top-2 -right-2 size-9 after:absolute after:-inset-1"
                                                    aria-label={`Retirer la nouvelle photo ${index + 1}`}
                                                    onClick={() => removePhoto(index)}
                                                >
                                                    <XIcon className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {errors.photos && <p className="text-sm text-red-600">{errors.photos}</p>}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" className="min-h-11" onClick={() => setIsEditModalOpen(false)} disabled={isLoading}>
                                Annuler
                            </Button>
                            <Button
                                className="min-h-11"
                                onClick={handleEdit}
                                disabled={isLoading || !formData.name || !formData.category_id || !formData.price}
                            >
                                {isLoading ? 'Enregistrement…' : 'Enregistrer le produit'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Modal */}
                <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Retirer le produit de la carte</DialogTitle>
                            <DialogDescription>
                                « {selectedProduct?.name} » sera archivé et ne sera plus proposé à la vente. Les commandes passées resteront intactes.
                            </DialogDescription>
                        </DialogHeader>

                        <DialogFooter>
                            <Button variant="outline" className="min-h-11" onClick={() => setIsDeleteModalOpen(false)} disabled={isLoading}>
                                Annuler
                            </Button>
                            <Button variant="destructive" className="min-h-11" onClick={handleDelete} disabled={isLoading}>
                                {isLoading ? 'Archivage…' : 'Retirer de la carte'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </main>
        </AppLayout>
    );
}
