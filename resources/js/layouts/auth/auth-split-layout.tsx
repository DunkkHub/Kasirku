import AuthSimpleLayout from '@/layouts/auth/auth-simple-layout';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    title?: string;
    description?: string;
}

export default function AuthSplitLayout({ children, title, description }: PropsWithChildren<AuthLayoutProps>) {
    return (
        <AuthSimpleLayout title={title} description={description}>
            {children}
        </AuthSimpleLayout>
    );
}
