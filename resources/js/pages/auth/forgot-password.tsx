import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { authButtonClass, authErrorClass, authFieldClass, authLabelClass, authLinkClass, AuthStatus } from '@/pages/auth/auth-ui';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <AuthLayout title="Mot de passe oublié ?" description="Indiquez votre e-mail et nous vous enverrons un lien de réinitialisation.">
            <Head title="Mot de passe oublié" />

            {status && <AuthStatus>{status}</AuthStatus>}

            <Form method="post" action={route('password.email')} className="space-y-5">
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
                                required
                                autoComplete="email"
                                inputMode="email"
                                autoFocus
                                placeholder="equipe@teisseire-pizza.fr"
                                className={authFieldClass}
                                aria-invalid={Boolean(errors.email)}
                                aria-describedby={errors.email ? 'email-error' : undefined}
                            />
                            <InputError id="email-error" role="alert" message={errors.email} className={authErrorClass} />
                        </div>

                        <Button type="submit" className={authButtonClass} disabled={processing} aria-busy={processing}>
                            {processing && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
                            {processing ? 'Envoi…' : 'Envoyer le lien sécurisé'}
                        </Button>
                    </>
                )}
            </Form>

            <p className="mt-5 text-center text-sm text-[#a99d8e]">
                Vous vous souvenez du mot de passe ?{' '}
                <TextLink href={route('login')} className={authLinkClass}>
                    Revenir à la connexion
                </TextLink>
            </p>
        </AuthLayout>
    );
}
