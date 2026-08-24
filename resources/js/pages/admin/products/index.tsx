import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/admin/admin-layout';
import { formatMenuPrice, getProductImage } from '@/lib/customer';
import type { BreadcrumbItem } from '@/types';
import type { Category, Product, ProductPhoto } from '@/types/models';
import { Head, router } from '@inertiajs/react';
import { EyeOff, ImageIcon, PlusIcon, SearchIcon, TrashIcon, UploadIcon, XIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

interface ProductFormData {
    name: string;
    category_id: number | '';
    ingredients: string;
    description: string;
    price: string;
    is_available: boolean;
    sort_order: string;
    photos: File[];
    remove_photos: number[];
}

interface Props {
    products: Product[];
    categories: Category[];
    filters?: {
        search?: string;
        category?: string;
        availability?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tableau de bord', href: '/admin' },
    { title: 'Menu', href: '/admin/menu' },
];

const euroSettings = {
    currency_symbol: '€',
    currency_symbol_position: 'after' as const,
};

const emptyForm: ProductFormData = {
    name: '',
    category_id: '',
    ingredients: '',
    description: '',
    price: '',
    is_available: true,
    sort_order: '0',
    photos: [],
    remove_photos: [],
};

export default function ProductsIndex({ products, categories, filters }: Props) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [categoryFilter, setCategoryFilter] = useState(filters?.category ?? 'all');
    const [availabilityFilter, setAvailabilityFilter] = useState(filters?.availability ?? 'all');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState<ProductFormData>(emptyForm);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            router.get(
                '/admin/menu',
                {
                    ...(search.trim() ? { search: search.trim() } : {}),
                    ...(categoryFilter !== 'all' ? { category: categoryFilter } : {}),
                    ...(availabilityFilter !== 'all' ? { availability: availabilityFilter } : {}),
                },
                {
                    preserveScroll: true,
                    preserveState: true,
                    replace: true,
                    only: ['products', 'filters'],
                },
            );
        }, 350);

        return () => window.clearTimeout(timer);
    }, [availabilityFilter, categoryFilter, search]);

    const availableCount = useMemo(() => products.filter((product) => product.is_available !== false).length, [products]);

    function resetForm() {
        setFormData(emptyForm);
        setErrors({});
    }

    function openCreate() {
        resetForm();
        setIsCreateOpen(true);
    }

    function openEdit(product: Product) {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            category_id: product.category_id,
            ingredients: product.ingredients ?? '',
            description: product.description ?? '',
            price: String(product.price ?? ''),
            is_available: product.is_available !== false,
            sort_order: String(product.sort_order ?? 0),
            photos: [],
            remove_photos: [],
        });
        setErrors({});
    }

    function updateField<K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) {
        setFormData((previous) => ({ ...previous, [field]: value }));
    }

    function appendPhotos(files: FileList | null) {
        if (!files) return;
        setFormData((previous) => ({ ...previous, photos: [...previous.photos, ...Array.from(files)] }));
    }

    function buildPayload() {
        const payload = new FormData();
        payload.append('name', formData.name);
        payload.append('category_id', String(formData.category_id));
        payload.append('ingredients', formData.ingredients);
        payload.append('description', formData.description);
        payload.append('price', formData.price);
        payload.append('sort_order', formData.sort_order || '0');
        payload.append('is_available', formData.is_available ? '1' : '0');

        formData.photos.forEach((photo, index) => payload.append(`photos[${index}]`, photo));
        formData.remove_photos.forEach((photoId, index) => payload.append(`remove_photos[${index}]`, String(photoId)));

        return payload;
    }

    function submitCreate() {
        setIsLoading(true);
        setErrors({});

        router.post('/admin/menu', buildPayload(), {
            forceFormData: true,
            onSuccess: () => {
                setIsCreateOpen(false);
                resetForm();
            },
            onError: setErrors,
            onFinish: () => setIsLoading(false),
        });
    }

    function submitEdit() {
        if (!editingProduct) return;
        setIsLoading(true);
        setErrors({});
        const payload = buildPayload();
        payload.append('_method', 'PUT');

        router.post(`/admin/menu/${editingProduct.id}`, payload, {
            forceFormData: true,
            onSuccess: () => {
                setEditingProduct(null);
                resetForm();
            },
            onError: setErrors,
            onFinish: () => setIsLoading(false),
        });
    }

    function toggleAvailability(product: Product) {
        router.patch(`/admin/menu/${product.id}/availability`, { is_available: product.is_available === false }, { preserveScroll: true });
    }

    function deleteProduct() {
        if (!deletingProduct) return;
        setIsLoading(true);
        router.delete(`/admin/menu/${deletingProduct.id}`, {
            onSuccess: () => setDeletingProduct(null),
            onFinish: () => setIsLoading(false),
        });
    }

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Menu" />

            <main className="admin-cms-surface flex min-h-full flex-1 flex-col gap-6 bg-[#f6efe4] p-4 sm:p-6 lg:p-8">
                <section className="flex flex-col gap-4 rounded-[1.75rem] bg-[#211812] px-5 py-6 text-[#fff7e9] shadow-[0_20px_48px_rgba(35,22,14,0.14)] sm:flex-row sm:items-center sm:justify-between sm:px-7">
                    <div>
                        <p className="text-xs font-black tracking-[0.18em] text-[#ef9367] uppercase">Carte digitale</p>
                        <h1 className="mt-2 text-3xl font-black tracking-[-0.035em]">Menu</h1>
                        <p className="mt-2 text-sm text-[#d8c7b4]">
                            Gérez les plats, images, ingrédients, prix et disponibilités affichés au public.
                        </p>
                    </div>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={openCreate} className="min-h-11 rounded-xl bg-[#d8562a] px-5 font-bold text-white hover:bg-[#ef6840]">
                                <PlusIcon className="size-4" aria-hidden="true" />
                                Ajouter un plat
                            </Button>
                        </DialogTrigger>
                        <ProductDialog
                            title="Ajouter un plat"
                            description="Créez une nouvelle entrée du menu."
                            formData={formData}
                            categories={categories}
                            errors={errors}
                            isLoading={isLoading}
                            onChange={updateField}
                            onPhotos={appendPhotos}
                            onSubmit={submitCreate}
                            onCancel={() => setIsCreateOpen(false)}
                            submitLabel="Enregistrer"
                        />
                    </Dialog>
                </section>

                <section className="grid gap-3 rounded-2xl border border-[#ddcfbd] bg-[#fffaf2] p-3 shadow-[0_8px_24px_rgba(64,39,23,0.04)] md:grid-cols-[minmax(0,1fr)_220px_190px]">
                    <label className="relative block">
                        <span className="sr-only">Rechercher un plat</span>
                        <SearchIcon
                            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#8a7869]"
                            aria-hidden="true"
                        />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Rechercher par nom, ingrédient, description..."
                            className="min-h-11 pl-10"
                        />
                    </label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="min-h-11">
                            <SelectValue placeholder="Catégorie" />
                        </SelectTrigger>
                        <SelectContent className="admin-select-content">
                            <SelectItem value="all">Toutes les catégories</SelectItem>
                            {categories.map((category) => (
                                <SelectItem key={category.id} value={String(category.id)}>
                                    {category.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                        <SelectTrigger className="min-h-11">
                            <SelectValue placeholder="Disponibilité" />
                        </SelectTrigger>
                        <SelectContent className="admin-select-content">
                            <SelectItem value="all">Tous</SelectItem>
                            <SelectItem value="available">Disponible</SelectItem>
                            <SelectItem value="unavailable">Indisponible</SelectItem>
                        </SelectContent>
                    </Select>
                </section>

                <div className="text-sm font-medium text-[#75675b]" aria-live="polite">
                    {products.length} plat{products.length > 1 ? 's' : ''} affiché{products.length > 1 ? 's' : ''} • {availableCount} disponible
                    {availableCount > 1 ? 's' : ''}
                </div>

                {products.length === 0 ? (
                    <Card className="rounded-2xl border-[#ddcfbd] bg-[#fffaf2]">
                        <CardContent className="grid min-h-72 place-items-center p-8 text-center">
                            <div>
                                <ImageIcon className="mx-auto size-10 text-[#b8a694]" aria-hidden="true" />
                                <h2 className="mt-3 text-lg font-black text-[#31241d]">Aucun plat trouvé</h2>
                                <p className="mt-2 text-sm text-[#75675b]">Modifiez vos filtres ou ajoutez un nouveau plat.</p>
                                <Button className="mt-5 min-h-11" onClick={openCreate}>
                                    Ajouter un plat
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                        {products.map((product) => (
                            <ProductAdminCard
                                key={product.id}
                                product={product}
                                onEdit={openEdit}
                                onToggle={toggleAvailability}
                                onDelete={setDeletingProduct}
                            />
                        ))}
                    </div>
                )}

                <Dialog open={Boolean(editingProduct)} onOpenChange={(open) => !open && setEditingProduct(null)}>
                    <ProductDialog
                        title="Modifier le plat"
                        description="Mettez à jour le texte, le prix, l’image ou la disponibilité."
                        formData={formData}
                        product={editingProduct}
                        categories={categories}
                        errors={errors}
                        isLoading={isLoading}
                        onChange={updateField}
                        onPhotos={appendPhotos}
                        onSubmit={submitEdit}
                        onCancel={() => setEditingProduct(null)}
                        submitLabel="Enregistrer"
                    />
                </Dialog>

                <Dialog open={Boolean(deletingProduct)} onOpenChange={(open) => !open && setDeletingProduct(null)}>
                    <DialogContent className="admin-cms-surface border-[#ddcfbd] bg-[#fffaf2]">
                        <DialogHeader>
                            <DialogTitle>Supprimer le plat</DialogTitle>
                            <DialogDescription>« {deletingProduct?.name} » sera retiré du menu public.</DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" className="min-h-11" onClick={() => setDeletingProduct(null)} disabled={isLoading}>
                                Annuler
                            </Button>
                            <Button variant="destructive" className="min-h-11" onClick={deleteProduct} disabled={isLoading}>
                                {isLoading ? 'Suppression…' : 'Supprimer'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </main>
        </AdminLayout>
    );
}

function ProductAdminCard({
    product,
    onEdit,
    onToggle,
    onDelete,
}: {
    product: Product;
    onEdit: (product: Product) => void;
    onToggle: (product: Product) => void;
    onDelete: (product: Product) => void;
}) {
    const image = getProductImage(product);

    return (
        <Card className="overflow-hidden rounded-2xl border-[#ddcfbd] bg-[#fffaf2] shadow-[0_10px_28px_rgba(64,39,23,0.05)]">
            <CardContent className="grid gap-4 p-4 sm:grid-cols-[8.5rem_minmax(0,1fr)]">
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#eadfce] sm:aspect-square">
                    {image ? (
                        <img src={image} alt={product.name} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                    ) : (
                        <div className="grid h-full place-items-center">
                            <ImageIcon className="size-9 text-[#b8a694]" aria-hidden="true" />
                        </div>
                    )}
                    {product.is_available === false && (
                        <span className="absolute inset-0 grid place-items-center bg-black/62 text-xs font-black tracking-[0.12em] text-white uppercase">
                            Indisponible
                        </span>
                    )}
                </div>

                <div className="min-w-0">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h2 className="truncate text-lg font-black text-[#2d211a]">{product.name}</h2>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                <Badge variant="secondary">{product.category?.name ?? 'Sans catégorie'}</Badge>
                                <Badge className={product.is_available === false ? 'bg-[#f3d4cd] text-[#8d2b1a]' : 'bg-[#dfeee3] text-[#31583e]'}>
                                    {product.is_available === false ? 'Indisponible' : 'Disponible'}
                                </Badge>
                            </div>
                        </div>
                        <strong className="shrink-0 text-lg font-black text-[#b84523] tabular-nums">
                            {formatMenuPrice(Number(product.price), euroSettings)}
                        </strong>
                    </div>
                    {product.ingredients && <p className="mt-3 line-clamp-2 text-sm leading-5 text-[#655348]">{product.ingredients}</p>}
                    {product.description && <p className="mt-2 line-clamp-2 text-sm leading-5 text-[#8a7869]">{product.description}</p>}
                    <div className="mt-4 flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" className="min-h-11 flex-1" onClick={() => onEdit(product)}>
                            Modifier
                        </Button>
                        <Button variant="outline" size="sm" className="min-h-11 flex-1" onClick={() => onToggle(product)}>
                            <EyeOff className="size-4" aria-hidden="true" />
                            {product.is_available === false ? 'Rendre dispo.' : 'Masquer'}
                        </Button>
                        <Button variant="destructive" size="sm" className="min-h-11 flex-1" onClick={() => onDelete(product)}>
                            <TrashIcon className="size-4" aria-hidden="true" />
                            Supprimer
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function ProductDialog({
    title,
    description,
    formData,
    product,
    categories,
    errors,
    isLoading,
    onChange,
    onPhotos,
    onSubmit,
    onCancel,
    submitLabel,
}: {
    title: string;
    description: string;
    formData: ProductFormData;
    product?: Product | null;
    categories: Category[];
    errors: Record<string, string>;
    isLoading: boolean;
    onChange: <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => void;
    onPhotos: (files: FileList | null) => void;
    onSubmit: () => void;
    onCancel: () => void;
    submitLabel: string;
}) {
    const visiblePhotos =
        product?.photos?.filter(
            (photo): photo is ProductPhoto & { id: number } => photo.id !== undefined && !formData.remove_photos.includes(photo.id),
        ) ?? [];

    return (
        <DialogContent className="admin-cms-surface max-h-[90vh] max-w-3xl overflow-y-auto border-[#ddcfbd] bg-[#fffaf2]">
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nom du plat" error={errors.name}>
                    <Input
                        value={formData.name}
                        onChange={(event) => onChange('name', event.target.value)}
                        placeholder="Ex. Marguarita"
                        className="min-h-11"
                    />
                </Field>

                <Field label="Catégorie" error={errors.category_id}>
                    <Select value={String(formData.category_id)} onValueChange={(value) => onChange('category_id', Number(value))}>
                        <SelectTrigger className="min-h-11">
                            <SelectValue placeholder="Sélectionner une catégorie" />
                        </SelectTrigger>
                        <SelectContent className="admin-select-content">
                            {categories.map((category) => (
                                <SelectItem key={category.id} value={String(category.id)}>
                                    {category.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>

                <Field label="Ingrédients" error={errors.ingredients} className="md:col-span-2">
                    <Textarea
                        value={formData.ingredients}
                        onChange={(event) => onChange('ingredients', event.target.value)}
                        placeholder="Emmental, Mozza, Champignons"
                        className="min-h-24"
                    />
                </Field>

                <Field label="Description optionnelle" error={errors.description} className="md:col-span-2">
                    <Textarea
                        value={formData.description}
                        onChange={(event) => onChange('description', event.target.value)}
                        placeholder="Texte libre pour les formules, gratins ou précisions."
                        className="min-h-24"
                    />
                </Field>

                <Field label="Prix" error={errors.price}>
                    <Input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={(event) => onChange('price', event.target.value)}
                        placeholder="10.50"
                        className="min-h-11"
                    />
                </Field>

                <Field label="Ordre d’affichage" error={errors.sort_order}>
                    <Input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        step="1"
                        value={formData.sort_order}
                        onChange={(event) => onChange('sort_order', event.target.value)}
                        className="min-h-11"
                    />
                </Field>

                <label className="flex min-h-12 items-center gap-3 rounded-xl border border-[#ddcfbd] bg-white/50 px-3 md:col-span-2">
                    <input
                        type="checkbox"
                        checked={formData.is_available}
                        onChange={(event) => onChange('is_available', event.target.checked)}
                        className="size-5 accent-[#d8562a]"
                    />
                    <span className="text-sm font-bold text-[#31241d]">Disponible sur le menu public</span>
                </label>

                <div className="space-y-3 md:col-span-2">
                    <Label>Image</Label>
                    <div className="rounded-xl border-2 border-dashed border-[#cfbda7] bg-[#f9efe2] p-5 text-center">
                        <UploadIcon className="mx-auto size-10 text-[#9f8d7c]" aria-hidden="true" />
                        <Input
                            type="file"
                            multiple
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={(event) => onPhotos(event.target.files)}
                            className="hidden"
                            id={`${title}-photos`}
                        />
                        <Label
                            htmlFor={`${title}-photos`}
                            className="mt-2 inline-flex min-h-11 cursor-pointer items-center rounded-lg px-3 text-sm font-bold text-[#b84523] hover:bg-[#f1dfca]"
                        >
                            Choisir une image
                        </Label>
                        <p className="mt-1 text-xs text-[#75675b]">JPG, PNG ou WebP. 4 Mo maximum par image.</p>
                    </div>
                    {errors.photos && <p className="text-sm font-medium text-red-600">{errors.photos}</p>}

                    {(visiblePhotos.length > 0 || formData.photos.length > 0) && (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {visiblePhotos.map((photo) => (
                                <div key={photo.id} className="relative aspect-square overflow-hidden rounded-xl border border-[#ddcfbd]">
                                    <img src={photo.url} alt={product?.name ?? 'Photo du plat'} className="h-full w-full object-cover" />
                                    <button
                                        type="button"
                                        className="absolute top-2 right-2 grid size-9 place-items-center rounded-full bg-[#991b1b] text-white"
                                        aria-label="Retirer cette image"
                                        onClick={() => onChange('remove_photos', [...formData.remove_photos, photo.id])}
                                    >
                                        <XIcon className="size-4" aria-hidden="true" />
                                    </button>
                                </div>
                            ))}
                            {formData.photos.map((photo, index) => (
                                <div
                                    key={`${photo.name}-${index}`}
                                    className="relative aspect-square overflow-hidden rounded-xl border border-[#ddcfbd]"
                                >
                                    <img
                                        src={URL.createObjectURL(photo)}
                                        alt={`Nouvelle image ${index + 1}`}
                                        className="h-full w-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        className="absolute top-2 right-2 grid size-9 place-items-center rounded-full bg-[#991b1b] text-white"
                                        aria-label="Retirer cette nouvelle image"
                                        onClick={() =>
                                            onChange(
                                                'photos',
                                                formData.photos.filter((_, photoIndex) => photoIndex !== index),
                                            )
                                        }
                                    >
                                        <XIcon className="size-4" aria-hidden="true" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <DialogFooter>
                <Button variant="outline" className="min-h-11" onClick={onCancel} disabled={isLoading}>
                    Annuler
                </Button>
                <Button
                    className="min-h-11"
                    onClick={onSubmit}
                    disabled={isLoading || !formData.name.trim() || !formData.category_id || !formData.price}
                >
                    {isLoading ? 'Enregistrement…' : submitLabel}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}

function Field({ label, error, className, children }: { label: string; error?: string; className?: string; children: ReactNode }) {
    return (
        <div className={className}>
            <Label className="mb-2 block">{label}</Label>
            {children}
            {error && <p className="mt-1 text-sm font-medium text-red-600">{error}</p>}
        </div>
    );
}
