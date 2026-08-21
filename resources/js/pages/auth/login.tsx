import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { authButtonClass, authErrorClass, authFieldClass, authLabelClass, authLinkClass, AuthStatus } from '@/pages/auth/auth-ui';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    return (
        <AuthLayout title="Connexion" description="Connectez-vous pour gérer les commandes et le service.">
            <Head title="Connexion" />

            {status && <AuthStatus>{status}</AuthStatus>}

            <Form method="post" action={route('login')} resetOnSuccess={['password']} className="space-y-5">
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
                                autoFocus
                                autoComplete="email"
                                inputMode="email"
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
                                name="password"
                                required
                                autoComplete="current-password"
                                placeholder="Votre mot de passe"
                                className={authFieldClass}
                                aria-invalid={Boolean(errors.password)}
                                aria-describedby={errors.password ? 'password-error' : undefined}
                            />
                            <div className="flex min-h-6 items-start justify-between gap-3">
                                <InputError id="password-error" role="alert" message={errors.password} className={authErrorClass} />
                                {canResetPassword && (
                                    <TextLink
                                        href={route('password.request')}
                                        className={`${authLinkClass} ml-auto inline-flex min-h-6 shrink-0 items-center text-sm`}
                                    >
                                        Mot de passe oublié ?
                                    </TextLink>
                                )}
                            </div>
                        </div>

                        <div className="flex min-h-11 items-center gap-3">
                            <Checkbox
                                id="remember"
                                name="remember"
                                className="size-5 border-[#6d6257] bg-[#0d0b09] focus-visible:border-[var(--customer-ember-light)] focus-visible:ring-[var(--customer-ember)]/30 data-[state=checked]:border-[var(--customer-ember)] data-[state=checked]:bg-[var(--customer-ember)] data-[state=checked]:text-[#170b05]"
                            />
                            <Label htmlFor="remember" className="cursor-pointer py-3 text-sm text-[#ded3c4]">
                                Rester connecté sur cet appareil
                            </Label>
                        </div>

                        <Button type="submit" className={authButtonClass} disabled={processing} aria-busy={processing}>
                            {processing && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
                            {processing ? 'Connexion…' : 'Se connecter'}
                        </Button>

                        <p className="text-center text-sm leading-5 text-[#a99d8e]">Accès réservé aux membres autorisés de l’équipe.</p>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
