import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { authButtonClass, authErrorClass, authFieldClass, authLabelClass } from '@/pages/auth/auth-ui';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

interface ResetPasswordProps {
    token: string;
    email: string;
}

export default function ResetPassword({ token, email }: ResetPasswordProps) {
    return (
        <AuthLayout title="Nouveau mot de passe" description="Créez un nouveau mot de passe pour retrouver votre accès sécurisé.">
            <Head title="Réinitialiser le mot de passe" />

            <Form
                method="post"
                action={route('password.store')}
                transform={(data) => ({ ...data, token, email })}
                resetOnSuccess={['password', 'password_confirmation']}
                className="space-y-5"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-2">
                            <Label htmlFor="email" className={authLabelClass}>
                                Adresse e-mail
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                autoComplete="email"
                                value={email}
                                readOnly
                                className={`${authFieldClass} cursor-default opacity-75`}
                                aria-invalid={Boolean(errors.email)}
                                aria-describedby={errors.email ? 'email-error' : undefined}
                            />
                            <InputError id="email-error" role="alert" message={errors.email} className={authErrorClass} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password" className={authLabelClass}>
                                Nouveau mot de passe
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                name="password"
                                required
                                autoComplete="new-password"
                                autoFocus
                                placeholder="Choisissez un mot de passe robuste"
                                className={authFieldClass}
                                aria-invalid={Boolean(errors.password)}
                                aria-describedby={errors.password ? 'password-hint password-error' : 'password-hint'}
                            />
                            <p id="password-hint" className="text-xs leading-5 text-[#a99d8e]">
                                Votre gestionnaire de mots de passe peut en créer et l’enregistrer pour vous.
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
                                name="password_confirmation"
                                required
                                autoComplete="new-password"
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
                            {processing ? 'Mise à jour…' : 'Enregistrer le nouveau mot de passe'}
                        </Button>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
