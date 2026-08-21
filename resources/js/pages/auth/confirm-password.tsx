import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { authButtonClass, authErrorClass, authFieldClass, authLabelClass } from '@/pages/auth/auth-ui';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

export default function ConfirmPassword() {
    return (
        <AuthLayout
            title="Confirmez votre mot de passe"
            description="Cette zone est protégée. Confirmez votre identité pour continuer en toute sécurité."
        >
            <Head title="Confirmer le mot de passe" />

            <Form method="post" action={route('password.confirm')} resetOnSuccess={['password']} className="space-y-5">
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-2">
                            <Label htmlFor="password" className={authLabelClass}>
                                Mot de passe
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                name="password"
                                required
                                placeholder="Votre mot de passe"
                                autoComplete="current-password"
                                autoFocus
                                className={authFieldClass}
                                aria-invalid={Boolean(errors.password)}
                                aria-describedby={errors.password ? 'password-error' : undefined}
                            />
                            <InputError id="password-error" role="alert" message={errors.password} className={authErrorClass} />
                        </div>

                        <Button type="submit" className={authButtonClass} disabled={processing} aria-busy={processing}>
                            {processing && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
                            {processing ? 'Vérification…' : 'Confirmer et continuer'}
                        </Button>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
