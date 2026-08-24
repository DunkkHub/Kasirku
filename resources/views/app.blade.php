<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="theme-color" content="#0a0908">
        <meta name="color-scheme" content="light dark">
        <meta name="description" content="Menu digital de Teisseire Pizza : pizzas, formules, paninis, boissons et desserts.">
        @php($component = (string) ($page['component'] ?? ''))
        @if (str_starts_with($component, 'admin/') || str_starts_with($component, 'auth/'))
            <meta name="robots" content="noindex, nofollow">
        @else
            <link rel="canonical" href="{{ url()->current() }}">
        @endif

        <title inertia>{{ config('app.name', 'Teisseire Pizza') }}</title>

        <meta name="csrf-token" content="{{ csrf_token() }}">

        <link rel="icon" href="/favicon.svg" type="image/svg+xml">

        @routes(nonce: $cspNonce ?? '')
        @if (! app()->environment('testing'))
            @viteReactRefresh
            @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @endif
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
