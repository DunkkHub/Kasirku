import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { type Category } from '@/types/models';
import { Head, router } from '@inertiajs/react';
import { AlertTriangle, CalendarIcon, EditIcon, FolderIcon, PlusIcon, SearchIcon, TrashIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

// This page's controller always eager-loads the count via withCount('products').
type CategoryWithCount = Category & { products_count: number };

interface CategoryFormData {
    name: string;
}

interface Props {
    categories: CategoryWithCount[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Vue d’ensemble',
        href: '/admin/dashboard',
    },
    {
        title: 'Catégories',
        href: '/admin/categories',
    },
];

export default function CategoriesIndex({ categories: initialCategories }: Props) {
    // State
    const [categories, setCategories] = useState<CategoryWithCount[]>(initialCategories);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<CategoryWithCount | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState<CategoryFormData>({
        name: '',
    });

    // Update categories when props change
    useEffect(() => {
        setCategories(initialCategories);
    }, [initialCategories]);

    // Filter categories based on search term
    const filteredCategories = categories.filter((category) => category.name.toLowerCase().includes(searchTerm.toLowerCase()));

    // Reset form
    const resetForm = () => {
        setFormData({
            name: '',
        });
    };

    // Handle form input changes
    const handleInputChange = (field: keyof CategoryFormData, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // Handle create category
    const handleCreate = async () => {
        setIsLoading(true);

        router.post(
            '/admin/categories',
            {
                name: formData.name,
            },
            {
                onSuccess: () => {
                    setIsCreateModalOpen(false);
                    resetForm();
                },
                onFinish: () => {
                    setIsLoading(false);
                },
            },
        );
    };

    // Handle edit category
    const handleEdit = async () => {
        if (!selectedCategory) return;

        setIsLoading(true);

        router.put(
            `/admin/categories/${selectedCategory.id}`,
            {
                name: formData.name,
            },
            {
                onSuccess: () => {
                    setIsEditModalOpen(false);
                    setSelectedCategory(null);
                    resetForm();
                },
                onFinish: () => {
                    setIsLoading(false);
                },
            },
        );
    };

    // Handle delete category
    const handleDelete = async () => {
        if (!selectedCategory) return;

        setIsLoading(true);

        router.delete(`/admin/categories/${selectedCategory.id}`, {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setSelectedCategory(null);
            },
            onFinish: () => {
                setIsLoading(false);
            },
        });
    };

    // Open edit modal with selected category data
    const openEditModal = (category: CategoryWithCount) => {
        setSelectedCategory(category);
        setFormData({
            name: category.name,
        });
        setIsEditModalOpen(true);
    };

    // Open delete modal
    const openDeleteModal = (category: CategoryWithCount) => {
        setSelectedCategory(category);
        setIsDeleteModalOpen(true);
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestion des catégories" />

            <main className="flex min-h-full flex-1 flex-col gap-6 bg-[#f6efe4] p-4 sm:p-6 lg:p-8">
                {/* Header */}
                <div className="flex flex-col gap-4 rounded-[1.75rem] bg-[#211812] px-5 py-6 text-[#fff7e9] shadow-[0_20px_48px_rgba(35,22,14,0.14)] sm:flex-row sm:items-center sm:justify-between sm:px-7">
                    <div>
                        <p className="text-xs font-black tracking-[0.18em] text-[#ef9367] uppercase">Organisation de la carte</p>
                        <h1 className="mt-2 text-3xl font-black tracking-[-0.035em]">Catégories</h1>
                        <p className="mt-2 text-sm text-[#d8c7b4]">Structurez le menu pour aider l’équipe et les clients à trouver chaque produit.</p>
                    </div>

                    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                        <DialogTrigger asChild>
                            <Button
                                onClick={() => resetForm()}
                                className="min-h-11 rounded-xl bg-[#d8562a] px-5 font-bold text-white hover:bg-[#ef6840] focus-visible:ring-2 focus-visible:ring-[#ffd6bc]"
                            >
                                <PlusIcon />
                                Ajouter une catégorie
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md border-[#ddcfbd] bg-[#fffaf2]">
                            <DialogHeader>
                                <DialogTitle>Ajouter une catégorie</DialogTitle>
                                <DialogDescription>Créez une section claire pour organiser les produits de la carte.</DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                                {/* Category Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nom de la catégorie</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        placeholder="Ex. Pizza base tomate"
                                        className="min-h-11"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" className="min-h-11" onClick={() => setIsCreateModalOpen(false)} disabled={isLoading}>
                                    Annuler
                                </Button>
                                <Button className="min-h-11" onClick={handleCreate} disabled={isLoading || !formData.name.trim()}>
                                    {isLoading ? 'Création…' : 'Créer la catégorie'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Search */}
                <div className="relative max-w-md rounded-2xl border border-[#ddcfbd] bg-[#fffaf2] p-2 shadow-[0_8px_24px_rgba(64,39,23,0.04)]">
                    <SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                    <Input
                        aria-label="Rechercher une catégorie"
                        placeholder="Rechercher une catégorie…"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="min-h-11 border-transparent bg-transparent pl-10 shadow-none focus-visible:border-[#d8562a]"
                    />
                </div>

                {/* Categories Grid */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {filteredCategories.map((category) => (
                        <Card
                            key={category.id}
                            className="overflow-hidden rounded-2xl border-[#ddcfbd] bg-[#fffaf2] shadow-[0_10px_28px_rgba(64,39,23,0.05)] transition-transform hover:-translate-y-0.5 motion-reduce:transform-none"
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-12 items-center justify-center rounded-xl bg-[#f3e4d2]">
                                        <FolderIcon className="size-6 text-[#c94720]" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <CardTitle className="truncate text-lg">{category.name}</CardTitle>
                                        <div className="mt-1 flex items-center gap-2">
                                            <Badge variant="secondary" className="text-xs">
                                                {category.products_count} produit(s)
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="pt-0">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <CalendarIcon className="h-4 w-4" />
                                        <span>Créée le {formatDate(category.created_at)}</span>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="min-h-11 flex-1" onClick={() => openEditModal(category)}>
                                            <EditIcon className="h-4 w-4" />
                                            Modifier
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="min-h-11 flex-1"
                                            onClick={() => openDeleteModal(category)}
                                            disabled={category.products_count > 0}
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                            Supprimer
                                        </Button>
                                    </div>

                                    {category.products_count > 0 && (
                                        <div className="flex items-start gap-2 rounded-xl border border-[#d59b3f]/30 bg-[#fff1cc] p-2.5 text-xs font-medium text-[#80560e]">
                                            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                            Déplacez les produits avant de supprimer cette catégorie.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Empty state */}
                {filteredCategories.length === 0 && (
                    <div className="py-12 text-center">
                        <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-bold text-[#31241d]">Aucune catégorie trouvée</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {searchTerm ? 'Modifiez votre recherche.' : 'Ajoutez la première catégorie de la carte.'}
                        </p>
                        {!searchTerm && (
                            <div className="mt-6">
                                <Button className="min-h-11" onClick={() => setIsCreateModalOpen(true)}>
                                    <PlusIcon />
                                    Ajouter la première catégorie
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Statistics */}
                {categories.length > 0 && (
                    <div className="border-t pt-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <Card>
                                <CardContent className="p-4">
                                    <div className="text-2xl font-bold text-primary">{categories.length}</div>
                                    <p className="text-sm text-muted-foreground">Catégories au total</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4">
                                    <div className="text-2xl font-bold text-green-600">
                                        {categories.filter((cat) => cat.products_count > 0).length}
                                    </div>
                                    <p className="text-sm text-muted-foreground">Catégories utilisées</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {categories.reduce((total, cat) => total + cat.products_count, 0)}
                                    </div>
                                    <p className="text-sm text-muted-foreground">Produits classés</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* Edit Modal */}
                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogContent className="max-w-md border-[#ddcfbd] bg-[#fffaf2]">
                        <DialogHeader>
                            <DialogTitle>Modifier la catégorie</DialogTitle>
                            <DialogDescription>Mettez à jour son nom dans la carte.</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            {/* Category Name */}
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">Nom de la catégorie</Label>
                                <Input
                                    id="edit-name"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    placeholder="Ex. Pizza base tomate"
                                    className="min-h-11"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" className="min-h-11" onClick={() => setIsEditModalOpen(false)} disabled={isLoading}>
                                Annuler
                            </Button>
                            <Button className="min-h-11" onClick={handleEdit} disabled={isLoading || !formData.name.trim()}>
                                {isLoading ? 'Enregistrement…' : 'Enregistrer'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Modal */}
                <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Supprimer la catégorie</DialogTitle>
                            <DialogDescription>
                                Confirmez-vous la suppression de « {selectedCategory?.name} » ? Cette action est définitive.
                                {selectedCategory?.products_count && selectedCategory.products_count > 0 && (
                                    <span className="mt-2 block font-medium text-amber-600">
                                        Cette catégorie contient {selectedCategory.products_count} produit(s). Déplacez-les avant de continuer.
                                    </span>
                                )}
                            </DialogDescription>
                        </DialogHeader>

                        <DialogFooter>
                            <Button variant="outline" className="min-h-11" onClick={() => setIsDeleteModalOpen(false)} disabled={isLoading}>
                                Annuler
                            </Button>
                            <Button
                                variant="destructive"
                                className="min-h-11"
                                onClick={handleDelete}
                                disabled={isLoading || (selectedCategory ? selectedCategory.products_count > 0 : false)}
                            >
                                {isLoading ? 'Suppression…' : 'Supprimer la catégorie'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </main>
        </AppLayout>
    );
}
