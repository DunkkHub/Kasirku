import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/layouts/auth-layout';
import { authLinkClass, authSecondaryButtonClass, AuthStatus } from '@/pages/auth/auth-ui';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <AuthLayout
            title="Vérifiez votre e-mail"
            description="Ouvrez le message que nous venons d’envoyer, puis cliquez sur le lien de vérification."
        >
            <Head title="Vérification de l’e-mail" />

            {status === 'verification-link-sent' && (
                <AuthStatus>Un nouveau lien de vérification a été envoyé à l’adresse indiquée lors de votre inscription.</AuthStatus>
            )}

            <Form method="post" action={route('verification.send')} className="space-y-5 text-center">
                {({ processing }) => (
                    <>
                        <Button type="submit" className={authSecondaryButtonClass} disabled={processing} aria-busy={processing}>
                            {processing && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
                            {processing ? 'Envoi…' : 'Renvoyer l’e-mail de vérification'}
                        </Button>

                        <TextLink href={route('logout')} method="post" as="button" className={`${authLinkClass} min-h-11 px-3 text-sm`}>
                            Se déconnecter
                        </TextLink>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
