import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { authButtonClass, authErrorClass, authFieldClass, authLabelClass, authLinkClass } from '@/pages/auth/auth-ui';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

export default function Register() {
    return (
        <AuthLayout title="Créer un accès" description="Ajoutez un membre autorisé à l’équipe Teisseire Pizza.">
            <Head title="Créer un accès" />

            <Form
                method="post"
                action={route('register')}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="space-y-5"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-2">
                            <Label htmlFor="name" className={authLabelClass}>
                                Nom complet
                            </Label>
                            <Input
                                id="name"
                                type="text"
                                required
                                autoFocus
                                autoComplete="name"
                                name="name"
                                placeholder="Prénom et nom"
                                className={authFieldClass}
                                aria-invalid={Boolean(errors.name)}
                                aria-describedby={errors.name ? 'name-error' : undefined}
                            />
                            <InputError id="name-error" role="alert" message={errors.name} className={authErrorClass} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email" className={authLabelClass}>
                                Adresse e-mail
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                required
                                autoComplete="email"
                                inputMode="email"
                                name="email"
                                placeholder="equipe@teisseire-pizza.fr"
                                className={authFieldClass}
                                aria-invalid={Boolean(errors.email)}
                                aria-describedby={errors.email ? 'email-error' : undefined}
                            />
                            <InputError id="email-error" role="alert" message={errors.email} className={authErrorClass} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password" className={authLabelClass}>
                                Mot de passe
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                autoComplete="new-password"
                                name="password"
                                placeholder="Choisissez un mot de passe robuste"
                                className={authFieldClass}
                                aria-invalid={Boolean(errors.password)}
                                aria-describedby={errors.password ? 'password-hint password-error' : 'password-hint'}
                            />
                            <p id="password-hint" className="text-xs leading-5 text-[#a99d8e]">
                                Utilisez une phrase longue et unique, facile à enregistrer dans votre gestionnaire de mots de passe.
                            </p>
                            <InputError id="password-error" role="alert" message={errors.password} className={authErrorClass} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation" className={authLabelClass}>
                                Confirmer le mot de passe
                            </Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                required
                                autoComplete="new-password"
                                name="password_confirmation"
                                placeholder="Saisissez-le une seconde fois"
                                className={authFieldClass}
                                aria-invalid={Boolean(errors.password_confirmation)}
                                aria-describedby={errors.password_confirmation ? 'password-confirmation-error' : undefined}
                            />
                            <InputError
                                id="password-confirmation-error"
                                role="alert"
                                message={errors.password_confirmation}
                                className={authErrorClass}
                            />
                        </div>

                        <Button type="submit" className={authButtonClass} disabled={processing} aria-busy={processing}>
                            {processing && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
                            {processing ? 'Création…' : 'Créer l’accès'}
                        </Button>

                        <p className="text-center text-sm text-[#a99d8e]">
                            Vous avez déjà un accès ?{' '}
                            <TextLink href={route('login')} className={authLinkClass}>
                                Se connecter
                            </TextLink>
                        </p>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
