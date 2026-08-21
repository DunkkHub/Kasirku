import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="18" fill="#FFF4DF" />
            <path d="M24 9.5a14.5 14.5 0 0 0-13.9 10.35L37.9 28.1A14.5 14.5 0 0 0 24 9.5Z" fill="#F3B548" />
            <path d="M10.1 19.85 37.9 28.1" stroke="#9F351B" strokeWidth="3.25" strokeLinecap="round" />
            <circle cx="20" cy="18" r="2.4" fill="#D8562A" />
            <circle cx="29.8" cy="21.4" r="2.4" fill="#D8562A" />
            <path d="m17.4 25.1 3.8 7.9 4.1-5.55 3.2 7.65 3.9-6.9" stroke="#E7A637" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14.2 15.6c2.8-5.4 8.5-8.2 14.3-6.7" stroke="#FFF4DF" strokeWidth="1.7" strokeLinecap="round" opacity=".75" />
        </svg>
    );
}
