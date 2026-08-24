import AppLogoIcon from './app-logo-icon';

export default function AppLogo({ variant = 'sidebar' }: { variant?: 'sidebar' | 'header' }) {
    return (
        <>
            <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded-xl border border-[#f3d8c6]/25 bg-black px-1 shadow-[0_8px_24px_rgba(0,0,0,0.22)]">
                <AppLogoIcon className="h-9 w-full" aria-hidden="true" />
            </div>
            <div className="ml-1.5 grid flex-1 text-left">
                <span
                    className={`truncate text-sm leading-tight font-extrabold tracking-[-0.02em] ${variant === 'header' ? 'text-[#2d211a]' : 'text-[#fff3df]'}`}
                >
                    Teisseire Pizza
                </span>
                <span
                    className={`mt-0.5 truncate text-[0.65rem] font-semibold tracking-[0.14em] uppercase ${variant === 'header' ? 'text-[#b84523]' : 'text-[#c9b59f]'}`}
                >
                    Administration
                </span>
            </div>
        </>
    );
}
