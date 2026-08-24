import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/admin/admin-layout';
import type { BreadcrumbItem } from '@/types';
import type { Category } from '@/types/models';
import { Head, router } from '@inertiajs/react';
import { AlertTriangle, FolderIcon, ImageIcon, PlusIcon, SearchIcon, TrashIcon, UploadIcon, XIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

type CategoryWithCount = Category & { products_count: number };

interface CategoryFormData {
    name: string;
    description: string;
    sort_order: string;
    is_active: boolean;
    image: File | null;
    remove_image: boolean;
}

interface Props {
    categories: CategoryWithCount[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tableau de bord', href: '/admin' },
    { title: 'Catégories', href: '/admin/categories' },
];

const emptyForm: CategoryFormData = {
    name: '',
    description: '',
    sort_order: '0',
    is_active: true,
    image: null,
    remove_image: false,
};

export default function CategoriesIndex({ categories }: Props) {
    const [search, setSearch] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryWithCount | null>(null);
    const [deletingCategory, setDeletingCategory] = useState<CategoryWithCount | null>(null);
    const [formData, setFormData] = useState<CategoryFormData>(emptyForm);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    const filteredCategories = useMemo(() => {
        const normalized = search.trim().toLocaleLowerCase('fr-FR');
        if (!normalized) return categories;

        return categories.filter((category) =>
            [category.name, category.description].filter(Boolean).join(' ').toLocaleLowerCase('fr-FR').includes(normalized),
        );
    }, [categories, search]);

    function resetForm() {
        setFormData(emptyForm);
        setErrors({});
    }

    function openCreate() {
        resetForm();
        setIsCreateOpen(true);
    }

    function openEdit(category: CategoryWithCount) {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            description: category.description ?? '',
            sort_order: String(category.sort_order ?? 0),
            is_active: category.is_active !== false,
            image: null,
            remove_image: false,
        });
        setErrors({});
    }

    function updateField<K extends keyof CategoryFormData>(field: K, value: CategoryFormData[K]) {
        setFormData((previous) => ({ ...previous, [field]: value }));
    }

    function buildPayload() {
        const payload = new FormData();
        payload.append('name', formData.name);
        payload.append('description', formData.description);
        payload.append('sort_order', formData.sort_order || '0');
        payload.append('is_active', formData.is_active ? '1' : '0');
        payload.append('remove_image', formData.remove_image ? '1' : '0');
        if (formData.image) {
            payload.append('image', formData.image);
        }

        return payload;
    }

    function submitCreate() {
        setIsLoading(true);
        setErrors({});

        router.post('/admin/categories', buildPayload(), {
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
        if (!editingCategory) return;

        const payload = buildPayload();
        payload.append('_method', 'PUT');
        setIsLoading(true);
        setErrors({});

        router.post(`/admin/categories/${editingCategory.id}`, payload, {
            forceFormData: true,
            onSuccess: () => {
                setEditingCategory(null);
                resetForm();
            },
            onError: setErrors,
            onFinish: () => setIsLoading(false),
        });
    }

    function deleteCategory() {
        if (!deletingCategory) return;
        setIsLoading(true);
        router.delete(`/admin/categories/${deletingCategory.id}`, {
            onSuccess: () => setDeletingCategory(null),
            onFinish: () => setIsLoading(false),
        });
    }

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Catégories" />

            <main className="admin-cms-surface flex min-h-full flex-1 flex-col gap-6 bg-[#f6efe4] p-4 sm:p-6 lg:p-8">
                <section className="flex flex-col gap-4 rounded-[1.75rem] bg-[#211812] px-5 py-6 text-[#fff7e9] shadow-[0_20px_48px_rgba(35,22,14,0.14)] sm:flex-row sm:items-center sm:justify-between sm:px-7">
                    <div>
                        <p className="text-xs font-black tracking-[0.18em] text-[#ef9367] uppercase">Structure de la carte</p>
                        <h1 className="mt-2 text-3xl font-black tracking-[-0.035em]">Catégories</h1>
                        <p className="mt-2 text-sm text-[#d8c7b4]">Ajoutez, renommez, désactivez et réordonnez les sections du menu public.</p>
                    </div>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={openCreate} className="min-h-11 rounded-xl bg-[#d8562a] px-5 font-bold text-white hover:bg-[#ef6840]">
                                <PlusIcon className="size-4" aria-hidden="true" />
                                Ajouter une catégorie
                            </Button>
                        </DialogTrigger>
                        <CategoryDialog
                            title="Ajouter une catégorie"
                            description="Créez une nouvelle section du menu."
                            formData={formData}
                            errors={errors}
                            isLoading={isLoading}
                            onChange={updateField}
                            onSubmit={submitCreate}
                            onCancel={() => setIsCreateOpen(false)}
                            submitLabel="Enregistrer"
                        />
                    </Dialog>
                </section>

                <div className="relative max-w-xl rounded-2xl border border-[#ddcfbd] bg-[#fffaf2] p-2 shadow-[0_8px_24px_rgba(64,39,23,0.04)]">
                    <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[#8a7869]" aria-hidden="true" />
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Rechercher une catégorie..."
                        className="min-h-11 border-transparent bg-transparent pl-10 shadow-none focus-visible:border-[#d8562a]"
                    />
                </div>

                {filteredCategories.length === 0 ? (
                    <Card className="rounded-2xl border-[#ddcfbd] bg-[#fffaf2]">
                        <CardContent className="grid min-h-72 place-items-center p-8 text-center">
                            <div>
                                <FolderIcon className="mx-auto size-10 text-[#b8a694]" aria-hidden="true" />
                                <h2 className="mt-3 text-lg font-black text-[#31241d]">Aucune catégorie trouvée</h2>
                                <p className="mt-2 text-sm text-[#75675b]">Modifiez votre recherche ou créez une section.</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {filteredCategories.map((category) => (
                            <Card
                                key={category.id}
                                className="overflow-hidden rounded-2xl border-[#ddcfbd] bg-[#fffaf2] shadow-[0_10px_28px_rgba(64,39,23,0.05)]"
                            >
                                <div className="relative aspect-[16/9] bg-[#eadfce]">
                                    {category.image ? (
                                        <img
                                            src={category.image}
                                            alt={category.name}
                                            className="h-full w-full object-cover"
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    ) : (
                                        <div className="grid h-full place-items-center">
                                            <ImageIcon className="size-10 text-[#b8a694]" aria-hidden="true" />
                                        </div>
                                    )}
                                </div>
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h2 className="truncate text-lg font-black text-[#2d211a]">{category.name}</h2>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                <Badge variant="secondary">{category.products_count} plat(s)</Badge>
                                                <Badge
                                                    className={
                                                        category.is_active === false ? 'bg-[#f3d4cd] text-[#8d2b1a]' : 'bg-[#dfeee3] text-[#31583e]'
                                                    }
                                                >
                                                    {category.is_active === false ? 'Désactivée' : 'Active'}
                                                </Badge>
                                                <Badge variant="outline">Ordre {category.sort_order ?? 0}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                    {category.description && (
                                        <p className="mt-3 line-clamp-2 text-sm leading-5 text-[#75675b]">{category.description}</p>
                                    )}
                                    {category.products_count > 0 && (
                                        <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#d59b3f]/30 bg-[#fff1cc] p-2.5 text-xs font-medium text-[#80560e]">
                                            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                            Déplacez les plats avant de supprimer cette catégorie.
                                        </div>
                                    )}
                                    <div className="mt-4 flex gap-2">
                                        <Button variant="outline" size="sm" className="min-h-11 flex-1" onClick={() => openEdit(category)}>
                                            Modifier
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="min-h-11 flex-1"
                                            onClick={() => setDeletingCategory(category)}
                                            disabled={category.products_count > 0}
                                        >
                                            <TrashIcon className="size-4" aria-hidden="true" />
                                            Supprimer
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                <Dialog open={Boolean(editingCategory)} onOpenChange={(open) => !open && setEditingCategory(null)}>
                    <CategoryDialog
                        title="Modifier la catégorie"
                        description="Mettez à jour le nom, l’image, l’ordre ou la visibilité."
                        formData={formData}
                        currentImage={editingCategory?.image}
                        errors={errors}
                        isLoading={isLoading}
                        onChange={updateField}
                        onSubmit={submitEdit}
                        onCancel={() => setEditingCategory(null)}
                        submitLabel="Enregistrer"
                    />
                </Dialog>

                <Dialog open={Boolean(deletingCategory)} onOpenChange={(open) => !open && setDeletingCategory(null)}>
                    <DialogContent className="admin-cms-surface border-[#ddcfbd] bg-[#fffaf2]">
                        <DialogHeader>
                            <DialogTitle>Supprimer la catégorie</DialogTitle>
                            <DialogDescription>Confirmez-vous la suppression de « {deletingCategory?.name} » ?</DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" className="min-h-11" onClick={() => setDeletingCategory(null)} disabled={isLoading}>
                                Annuler
                            </Button>
                            <Button
                                variant="destructive"
                                className="min-h-11"
                                onClick={deleteCategory}
                                disabled={isLoading || Boolean(deletingCategory?.products_count)}
                            >
                                {isLoading ? 'Suppression…' : 'Supprimer'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </main>
        </AdminLayout>
    );
}

function CategoryDialog({
    title,
    description,
    formData,
    currentImage,
    errors,
    isLoading,
    onChange,
    onSubmit,
    onCancel,
    submitLabel,
}: {
    title: string;
    description: string;
    formData: CategoryFormData;
    currentImage?: string | null;
    errors: Record<string, string>;
    isLoading: boolean;
    onChange: <K extends keyof CategoryFormData>(field: K, value: CategoryFormData[K]) => void;
    onSubmit: () => void;
    onCancel: () => void;
    submitLabel: string;
}) {
    return (
        <DialogContent className="admin-cms-surface max-h-[90vh] max-w-2xl overflow-y-auto border-[#ddcfbd] bg-[#fffaf2]">
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
                <Field label="Nom de la catégorie" error={errors.name}>
                    <Input
                        value={formData.name}
                        onChange={(event) => onChange('name', event.target.value)}
                        placeholder="Pizza Base Tomate"
                        className="min-h-11"
                    />
                </Field>

                <Field label="Description" error={errors.description}>
                    <Textarea
                        value={formData.description}
                        onChange={(event) => onChange('description', event.target.value)}
                        placeholder="Nos pizzas artisanales Ø33cm..."
                        className="min-h-24"
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

                <label className="flex min-h-12 items-center gap-3 rounded-xl border border-[#ddcfbd] bg-white/50 px-3">
                    <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(event) => onChange('is_active', event.target.checked)}
                        className="size-5 accent-[#d8562a]"
                    />
                    <span className="text-sm font-bold text-[#31241d]">Catégorie visible sur le menu public</span>
                </label>

                <div className="space-y-3">
                    <Label>Image de couverture</Label>
                    <div className="rounded-xl border-2 border-dashed border-[#cfbda7] bg-[#f9efe2] p-5 text-center">
                        <UploadIcon className="mx-auto size-10 text-[#9f8d7c]" aria-hidden="true" />
                        <Input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={(event) => onChange('image', event.target.files?.[0] ?? null)}
                            className="hidden"
                            id={`${title}-image`}
                        />
                        <Label
                            htmlFor={`${title}-image`}
                            className="mt-2 inline-flex min-h-11 cursor-pointer items-center rounded-lg px-3 text-sm font-bold text-[#b84523] hover:bg-[#f1dfca]"
                        >
                            Choisir une image
                        </Label>
                        <p className="mt-1 text-xs text-[#75675b]">JPG, PNG ou WebP. 4 Mo maximum.</p>
                    </div>
                    {errors.image && <p className="text-sm font-medium text-red-600">{errors.image}</p>}

                    {(currentImage || formData.image) && !formData.remove_image && (
                        <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-[#ddcfbd]">
                            <img
                                src={formData.image ? URL.createObjectURL(formData.image) : (currentImage ?? '')}
                                alt="Aperçu catégorie"
                                className="h-full w-full object-cover"
                            />
                            <button
                                type="button"
                                className="absolute top-2 right-2 grid size-9 place-items-center rounded-full bg-[#991b1b] text-white"
                                aria-label="Retirer l’image"
                                onClick={() => {
                                    onChange('image', null);
                                    onChange('remove_image', true);
                                }}
                            >
                                <XIcon className="size-4" aria-hidden="true" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <DialogFooter>
                <Button variant="outline" className="min-h-11" onClick={onCancel} disabled={isLoading}>
                    Annuler
                </Button>
                <Button className="min-h-11" onClick={onSubmit} disabled={isLoading || !formData.name.trim()}>
                    {isLoading ? 'Enregistrement…' : submitLabel}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
    return (
        <div>
            <Label className="mb-2 block">{label}</Label>
            {children}
            {error && <p className="mt-1 text-sm font-medium text-red-600">{error}</p>}
        </div>
    );
}
