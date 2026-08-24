import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/admin/admin-layout';
import type { BreadcrumbItem } from '@/types';
import type { RestaurantSettings } from '@/types/models';
import { Head, router } from '@inertiajs/react';
import { ImageIcon, Save, UploadIcon, XIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';

interface SettingsFormData {
    restaurant_name: string;
    tagline: string;
    description: string;
    phone: string;
    address: string;
    opening_hours: string;
    currency_code: string;
    currency_symbol: string;
    currency_symbol_position: 'before' | 'after';
    pizza_size_text: string;
    instagram_url: string;
    facebook_url: string;
    google_maps_url: string;
    show_halal_badge: boolean;
    logo: File | null;
    halal_badge: File | null;
    remove_logo: boolean;
    remove_halal_badge: boolean;
}

interface Props {
    settings: RestaurantSettings;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tableau de bord', href: '/admin' },
    { title: 'Paramètres restaurant', href: '/admin/settings' },
];

export default function RestaurantSettingsEdit({ settings }: Props) {
    const [formData, setFormData] = useState<SettingsFormData>({
        restaurant_name: settings.restaurant_name ?? '',
        tagline: settings.tagline ?? '',
        description: settings.description ?? '',
        phone: settings.phone ?? '',
        address: settings.address ?? '',
        opening_hours: settings.opening_hours ?? '',
        currency_code: settings.currency_code ?? 'EUR',
        currency_symbol: settings.currency_symbol ?? '€',
        currency_symbol_position: settings.currency_symbol_position ?? 'after',
        pizza_size_text: settings.pizza_size_text ?? '',
        instagram_url: settings.instagram_url ?? '',
        facebook_url: settings.facebook_url ?? '',
        google_maps_url: settings.google_maps_url ?? '',
        show_halal_badge: settings.show_halal_badge,
        logo: null,
        halal_badge: null,
        remove_logo: false,
        remove_halal_badge: false,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    function updateField<K extends keyof SettingsFormData>(field: K, value: SettingsFormData[K]) {
        setFormData((previous) => ({ ...previous, [field]: value }));
        setSuccessMessage('');
    }

    function submit() {
        const payload = new FormData();
        payload.append('_method', 'PUT');
        payload.append('restaurant_name', formData.restaurant_name);
        payload.append('tagline', formData.tagline);
        payload.append('description', formData.description);
        payload.append('phone', formData.phone);
        payload.append('address', formData.address);
        payload.append('opening_hours', formData.opening_hours);
        payload.append('currency_code', formData.currency_code);
        payload.append('currency_symbol', formData.currency_symbol);
        payload.append('currency_symbol_position', formData.currency_symbol_position);
        payload.append('pizza_size_text', formData.pizza_size_text);
        payload.append('instagram_url', formData.instagram_url);
        payload.append('facebook_url', formData.facebook_url);
        payload.append('google_maps_url', formData.google_maps_url);
        payload.append('show_halal_badge', formData.show_halal_badge ? '1' : '0');
        payload.append('remove_logo', formData.remove_logo ? '1' : '0');
        payload.append('remove_halal_badge', formData.remove_halal_badge ? '1' : '0');

        if (formData.logo) {
            payload.append('logo', formData.logo);
        }

        if (formData.halal_badge) {
            payload.append('halal_badge', formData.halal_badge);
        }

        setIsLoading(true);
        setErrors({});
        setSuccessMessage('');

        router.post('/admin/settings', payload, {
            forceFormData: true,
            onSuccess: () => setSuccessMessage('Paramètres enregistrés. Le menu public est à jour.'),
            onError: setErrors,
            onFinish: () => setIsLoading(false),
        });
    }

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Paramètres restaurant" />

            <main className="admin-cms-surface flex min-h-full flex-1 flex-col gap-6 bg-[#f6efe4] p-4 sm:p-6 lg:p-8">
                <section className="rounded-[1.75rem] bg-[#211812] px-5 py-6 text-[#fff7e9] shadow-[0_20px_48px_rgba(35,22,14,0.14)] sm:px-7">
                    <p className="text-xs font-black tracking-[0.18em] text-[#ef9367] uppercase">Informations publiques</p>
                    <h1 className="mt-2 text-3xl font-black tracking-[-0.035em]">Paramètres restaurant</h1>
                    <p className="mt-2 max-w-2xl text-sm text-[#d8c7b4]">
                        Ces champs alimentent directement le menu public : logo, texte, horaires, téléphone, adresse, devise et liens sociaux.
                    </p>
                </section>

                <Card className="rounded-2xl border-[#ddcfbd] bg-[#fffaf2] shadow-[0_10px_30px_rgba(64,39,23,0.05)]">
                    <CardContent className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:p-7">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Nom du restaurant" error={errors.restaurant_name}>
                                <Input
                                    value={formData.restaurant_name}
                                    onChange={(event) => updateField('restaurant_name', event.target.value)}
                                    className="min-h-11"
                                />
                            </Field>

                            <Field label="Tagline" error={errors.tagline}>
                                <Input
                                    value={formData.tagline}
                                    onChange={(event) => updateField('tagline', event.target.value)}
                                    className="min-h-11"
                                />
                            </Field>

                            <Field label="Description" error={errors.description} className="md:col-span-2">
                                <Textarea
                                    value={formData.description}
                                    onChange={(event) => updateField('description', event.target.value)}
                                    className="min-h-28"
                                />
                            </Field>

                            <Field label="Téléphone" error={errors.phone}>
                                <Input value={formData.phone} onChange={(event) => updateField('phone', event.target.value)} className="min-h-11" />
                            </Field>

                            <Field label="Adresse" error={errors.address}>
                                <Input
                                    value={formData.address}
                                    onChange={(event) => updateField('address', event.target.value)}
                                    className="min-h-11"
                                />
                            </Field>

                            <Field label="Horaires d’ouverture" error={errors.opening_hours} className="md:col-span-2">
                                <Textarea
                                    value={formData.opening_hours}
                                    onChange={(event) => updateField('opening_hours', event.target.value)}
                                    className="min-h-24"
                                />
                            </Field>

                            <Field label="Texte taille pizza" error={errors.pizza_size_text}>
                                <Input
                                    value={formData.pizza_size_text}
                                    onChange={(event) => updateField('pizza_size_text', event.target.value)}
                                    className="min-h-11"
                                />
                            </Field>

                            <Field label="Code devise" error={errors.currency_code}>
                                <Input
                                    value={formData.currency_code}
                                    onChange={(event) => updateField('currency_code', event.target.value.toUpperCase())}
                                    maxLength={3}
                                    className="min-h-11"
                                />
                            </Field>

                            <Field label="Symbole devise" error={errors.currency_symbol}>
                                <Input
                                    value={formData.currency_symbol}
                                    onChange={(event) => updateField('currency_symbol', event.target.value)}
                                    className="min-h-11"
                                />
                            </Field>

                            <Field label="Position du symbole" error={errors.currency_symbol_position}>
                                <Select
                                    value={formData.currency_symbol_position}
                                    onValueChange={(value) => updateField('currency_symbol_position', value as 'before' | 'after')}
                                >
                                    <SelectTrigger className="min-h-11">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="admin-select-content">
                                        <SelectItem value="after">Après le prix — 10 €</SelectItem>
                                        <SelectItem value="before">Avant le prix — €10</SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>

                            <Field label="Instagram" error={errors.instagram_url}>
                                <Input
                                    value={formData.instagram_url}
                                    onChange={(event) => updateField('instagram_url', event.target.value)}
                                    placeholder="https://instagram.com/..."
                                    className="min-h-11"
                                />
                            </Field>

                            <Field label="Facebook" error={errors.facebook_url}>
                                <Input
                                    value={formData.facebook_url}
                                    onChange={(event) => updateField('facebook_url', event.target.value)}
                                    placeholder="https://facebook.com/..."
                                    className="min-h-11"
                                />
                            </Field>

                            <Field label="Lien Google Maps" error={errors.google_maps_url} className="md:col-span-2">
                                <Input
                                    value={formData.google_maps_url}
                                    onChange={(event) => updateField('google_maps_url', event.target.value)}
                                    placeholder="https://maps.google.com/..."
                                    className="min-h-11"
                                />
                            </Field>

                            <label className="flex min-h-12 items-center gap-3 rounded-xl border border-[#ddcfbd] bg-white/50 px-3 md:col-span-2">
                                <input
                                    type="checkbox"
                                    checked={formData.show_halal_badge}
                                    onChange={(event) => updateField('show_halal_badge', event.target.checked)}
                                    className="size-5 accent-[#d8562a]"
                                />
                                <span className="text-sm font-bold text-[#31241d]">Afficher l’indicateur Halal sur le menu public</span>
                            </label>
                        </div>

                        <aside className="space-y-4">
                            <ImageUploader
                                label="Logo"
                                currentImage={settings.logo_path}
                                file={formData.logo}
                                remove={formData.remove_logo}
                                onChange={(file) => {
                                    updateField('logo', file);
                                    updateField('remove_logo', false);
                                }}
                                onRemove={() => {
                                    updateField('logo', null);
                                    updateField('remove_logo', true);
                                }}
                                error={errors.logo}
                            />

                            <ImageUploader
                                label="Logo/badge Halal optionnel"
                                currentImage={settings.halal_badge_path}
                                file={formData.halal_badge}
                                remove={formData.remove_halal_badge}
                                onChange={(file) => {
                                    updateField('halal_badge', file);
                                    updateField('remove_halal_badge', false);
                                }}
                                onRemove={() => {
                                    updateField('halal_badge', null);
                                    updateField('remove_halal_badge', true);
                                }}
                                error={errors.halal_badge}
                            />

                            {successMessage && (
                                <p
                                    role="status"
                                    className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800"
                                >
                                    {successMessage}
                                </p>
                            )}

                            <Button
                                className="min-h-12 w-full rounded-xl bg-[#d8562a] font-black text-white hover:bg-[#ef6840]"
                                onClick={submit}
                                disabled={isLoading}
                            >
                                <Save className="size-4" aria-hidden="true" />
                                {isLoading ? 'Enregistrement…' : 'Enregistrer les paramètres'}
                            </Button>
                        </aside>
                    </CardContent>
                </Card>
            </main>
        </AdminLayout>
    );
}

function ImageUploader({
    label,
    currentImage,
    file,
    remove,
    onChange,
    onRemove,
    error,
}: {
    label: string;
    currentImage?: string | null;
    file: File | null;
    remove: boolean;
    onChange: (file: File | null) => void;
    onRemove: () => void;
    error?: string;
}) {
    const preview = file ? URL.createObjectURL(file) : remove ? null : currentImage;

    return (
        <div className="rounded-2xl border border-[#ddcfbd] bg-[#f9efe2] p-4">
            <Label className="font-black text-[#31241d]">{label}</Label>
            <div className="mt-3 overflow-hidden rounded-xl border border-[#ddcfbd] bg-[#eadfce]">
                {preview ? (
                    <img src={preview} alt={`${label} preview`} className="h-44 w-full object-contain p-3" />
                ) : (
                    <div className="grid h-44 place-items-center">
                        <ImageIcon className="size-10 text-[#b8a694]" aria-hidden="true" />
                    </div>
                )}
            </div>
            <div className="mt-3 flex gap-2">
                <Input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="hidden"
                    id={`${label}-upload`}
                    onChange={(event) => onChange(event.target.files?.[0] ?? null)}
                />
                <Label
                    htmlFor={`${label}-upload`}
                    className="inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-white px-3 text-sm font-bold text-[#b84523] hover:bg-[#f1dfca]"
                >
                    <UploadIcon className="size-4" aria-hidden="true" />
                    Choisir
                </Label>
                {preview && (
                    <Button type="button" variant="destructive" className="min-h-11" onClick={onRemove}>
                        <XIcon className="size-4" aria-hidden="true" />
                        Retirer
                    </Button>
                )}
            </div>
            {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
        </div>
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
