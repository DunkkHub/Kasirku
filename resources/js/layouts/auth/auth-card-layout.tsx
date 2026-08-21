import AuthSimpleLayout from '@/layouts/auth/auth-simple-layout';
import { type PropsWithChildren } from 'react';

export default function AuthCardLayout({
    children,
    title,
    description,
}: PropsWithChildren<{
    name?: string;
    title?: string;
    description?: string;
}>) {
    return (
        <AuthSimpleLayout title={title} description={description}>
            {children}
        </AuthSimpleLayout>
    );
}
