import { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon({ alt = '', className, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            {...props}
            src="/images/teisseire-pizza-halal-logo.png"
            alt={alt}
            className={['object-contain', className].filter(Boolean).join(' ')}
            loading="eager"
            decoding="async"
        />
    );
}
