<!DOCTYPE html>
<html lang="fr">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="robots" content="noindex, nofollow">
        <title>@yield('title') | Teisseire Pizza</title>
        <style>
            :root {
                color-scheme: dark;
                font-family:
                    ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                background: #090807;
                color: #fff6e8;
            }

            body {
                min-height: 100vh;
                margin: 0;
                display: grid;
                place-items: center;
                background:
                    radial-gradient(circle at top right, rgba(216, 86, 42, 0.22), transparent 32rem),
                    linear-gradient(135deg, #090807, #170f0a);
            }

            main {
                width: min(36rem, calc(100% - 2rem));
                border: 1px solid rgba(255, 246, 232, 0.14);
                border-radius: 1.5rem;
                padding: 2rem;
                background: rgba(14, 10, 7, 0.86);
                box-shadow: 0 24px 80px rgba(0, 0, 0, 0.36);
            }

            a {
                color: #ff9c62;
                font-weight: 800;
            }

            .code {
                color: #ff7a30;
                font-size: 0.8rem;
                font-weight: 900;
                letter-spacing: 0.18em;
                text-transform: uppercase;
            }

            h1 {
                margin: 0.75rem 0;
                font-size: clamp(2rem, 8vw, 4rem);
                line-height: 0.95;
            }

            p {
                color: #d2c7b8;
                line-height: 1.7;
            }
        </style>
    </head>
    <body>
        <main>
            <div class="code">@yield('code')</div>
            <h1>@yield('title')</h1>
            <p>@yield('message')</p>
            <p><a href="{{ route('home') }}">Retour au menu</a></p>
        </main>
    </body>
</html>
