import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';
import type { ReactNode } from 'react';

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    description: string;
}

export default function AuthLayout({ children, title, description }: AuthLayoutProps) {
    return (
        <AuthLayoutTemplate title={title} description={description}>
            {children}
        </AuthLayoutTemplate>
    );
}
