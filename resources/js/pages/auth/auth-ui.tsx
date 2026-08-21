import { CheckCircle2 } from 'lucide-react';
import type { PropsWithChildren } from 'react';

export const authFieldClass = 'customer-field h-12';
export const authButtonClass = 'customer-primary-button mt-1 h-12 w-full rounded-full text-base';
export const authSecondaryButtonClass = 'customer-secondary-button h-12 w-full rounded-full text-base';
export const authLabelClass = 'text-sm font-semibold text-[#fff6e8]';
export const authErrorClass = '!mt-0 !text-[#ff9f95]';
export const authLinkClass =
    'rounded-sm font-semibold text-[var(--customer-ember-light)] decoration-[rgba(255,156,98,0.45)] transition-colors duration-200 hover:text-[#ffc09b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--customer-ember-light)]';

export function AuthStatus({ children }: PropsWithChildren) {
    return (
        <div
            role="status"
            className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm leading-5 text-emerald-200"
        >
            <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>{children}</span>
        </div>
    );
}
