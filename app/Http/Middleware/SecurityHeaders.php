<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\Vite;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $nonce = Vite::useCspNonce();
        View::share('cspNonce', $nonce);

        /** @var Response $response */
        $response = $next($request);
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-Permitted-Cross-Domain-Policies', 'none');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

        $scriptSrc = "'self' 'nonce-{$nonce}'";
        $connectSrc = "'self'";

        if (app()->environment('local')) {
            $scriptSrc .= " 'unsafe-eval' http://localhost:* http://127.0.0.1:*";
            $connectSrc .= ' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*';
        }

        $response->headers->set(
            'Content-Security-Policy',
            "default-src 'self'; script-src {$scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src {$connectSrc}; form-action 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'"
        );

        if ($request->user() || $request->is('admin', 'admin/*')) {
            $response->headers->set('Cache-Control', 'no-store, private');
        }

        if ($request->isSecure() && app()->isProduction()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        return $response;
    }
}
