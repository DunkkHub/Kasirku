# Teisseire Pizza POS

Teisseire Pizza POS is a French-language restaurant digital menu and point-of-sale application. It combines a read-only customer menu with a protected administration area for products, categories, orders, payments, delivery operations, and ESC/POS receipt printing.

The application defaults to the restaurant's EUR workflow. Midtrans support is retained for deployments that operate entirely in IDR; it cannot be enabled while EUR pricing is active.

## Capabilities

- Read-only customer menu with categories, search, product images, prices, formules, address, hours, and phone contact.
- Public cart, checkout, website delivery requests, and website order creation are disabled.
- Dine-in, pickup, and delivery order management remains available inside the protected admin panel.
- Pay-at-counter and cash-on-delivery flows in the default EUR admin workflow.
- Private order tracking through a non-sequential UUID link for existing or admin-created orders.
- Explicit order workflow: `pending`, `preparing`, `ready`, `out_for_delivery`, `delivered`, `completed`, or `cancelled`. Invalid transitions are rejected server-side.
- French admin dashboard with product, category, order, fulfillment, and payment management.
- Server-authoritative prices, tax, delivery fee, totals, and receipt data.
- Optional authenticated Midtrans callback processing for IDR deployments that explicitly integrate online payments.
- Optional ESC/POS receipt printing to an explicitly configured local device.

## Technology and requirements

- PHP 8.2 or newer, Composer 2, and the PHP extensions required by Laravel, the selected database driver, cURL/Midtrans, and image uploads.
- Node.js 20.19 or newer and npm. Use the committed `package-lock.json` with `npm ci`.
- SQLite for local development, or a Laravel-supported production database such as MySQL or PostgreSQL.
- A web server whose document root is this project's `public/` directory.

The application uses Laravel 12, Inertia 2, React 19, TypeScript, Tailwind CSS 4, Vite 7, Pest, Midtrans PHP, and `mike42/escpos-php`.

## Local installation

Clone the repository and install the locked dependencies:

```bash
git clone https://github.com/rezadrian01/Kasirku.git
cd Kasirku
composer install
npm ci
```

Create the local environment file. On macOS or Linux:

```bash
cp .env.example .env
touch database/database.sqlite
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
if (-not (Test-Path database/database.sqlite)) {
    New-Item database/database.sqlite -ItemType File
}
```

Then initialize the application:

```bash
php artisan key:generate
php artisan migrate
php artisan storage:link
php artisan db:seed
```

With no `ADMIN_*` values set, local seeding skips the administrator and loads the Teisseire Pizza categories and products. Create the administrator separately as described below.

Start Laravel, the queue listener, application logs, and Vite together:

```bash
composer run dev
```

The Laravel development server normally listens on `http://127.0.0.1:8000`; use the address printed in the terminal. The public digital menu is `/`, login is `/login`, and the admin dashboard is `/admin/dashboard`.

## Environment configuration

Start from `.env.example`; do not commit `.env`. These are the application-specific settings:

| Variable | Default | Purpose |
| --- | --- | --- |
| `APP_LOCALE` / `APP_FALLBACK_LOCALE` | `fr` | Server-side language |
| `APP_TIMEZONE` | `Europe/Paris` | Restaurant dates and times |
| `AUTH_REGISTRATION_ENABLED` | `false` | Controls public account registration; keep disabled for a private POS |
| `POS_CURRENCY` | `EUR` | Three-letter order and receipt currency |
| `POS_CURRENCY_PRECISION` | `2` | Decimal places, limited to 0–2 by the application |
| `POS_LOCALE` | `fr-FR` | Browser-side number and currency formatting |
| `POS_TAX_RATE` | `0` | Tax as a decimal fraction; for example, `0.1` means 10% |
| `POS_DELIVERY_FEE` | `3.00` | Admin delivery charge and public informational delivery fee |
| `POS_PRINTER_DEVICE` | empty | Optional allow-listed ESC/POS device |
| `MIDTRANS_*` | empty / sandbox | Optional IDR-only online-payment configuration |

After changing cached environment values, run `php artisan config:clear` during development or rebuild the production configuration cache. Values prefixed with `VITE_` are compiled into browser assets and require `npm run build` after a change.

## Provision the administrator

Public registration is disabled by default and does not create an administrator. Provision one account from server-side environment values:

1. Set `ADMIN_NAME`, `ADMIN_EMAIL`, and a unique `ADMIN_PASSWORD` of at least 16 characters in `.env`. Do not reuse a personal password or commit these values.
2. Clear any old cached values and run the dedicated seeder:

   ```bash
   php artisan config:clear
   php artisan db:seed --class=UserSeeder --force
   ```

3. Immediately remove or blank `ADMIN_PASSWORD` in `.env` and in the deployment secret store.
4. In production, rebuild the cache with `php artisan config:cache` (or run `php artisan optimize` as part of the deployment).
5. Sign in at `/login`; the seeded account is verified and authorized for `/admin/*`.

The seeder refuses malformed email addresses, passwords shorter than 16 characters, and missing `ADMIN_*` values in production. Running the seeder again for the same normalized email updates that administrator instead of creating a duplicate.

To load only the restaurant menu in production, without retaining administrator secrets during that command, run:

```bash
php artisan db:seed --class=CategorySeeder --force
php artisan db:seed --class=ProductSeeder --force
```

## Payments and currency

The public digital menu does not start website orders or browser payment sessions. The default `EUR` deployment deliberately exposes only offline payment flows inside the protected admin workflow. Midtrans is an Indonesian IDR gateway in this application and should only be used by deployments that explicitly re-enable or integrate an IDR online payment flow where all of the following are true:

```env
POS_CURRENCY=IDR
POS_CURRENCY_PRECISION=0
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
MIDTRANS_MERCHANT_ID=
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_IS_SANITIZED=true
MIDTRANS_IS_3DS=true
```

Populate the blank key fields through the deployment's secret manager. Never prefix the server key with `VITE_`: `MIDTRANS_SERVER_KEY` must remain server-side. `VITE_MIDTRANS_CLIENT_KEY` is intentionally browser-visible and is derived from `MIDTRANS_CLIENT_KEY` by `.env.example`.

For Midtrans:

1. Use sandbox credentials while `MIDTRANS_IS_PRODUCTION=false`.
2. Configure the provider callback as `https://your-host.example/checkout/notification`.
3. Ensure the callback is reachable over HTTPS, then test settlement, rejection, cancellation, expiry, duplicated notifications, and delayed notifications.
4. Rebuild frontend assets after changing the client key or production flag.

The callback signature must be valid and its amount and currency must match the stored payment. Row locking and idempotent event handling prevent duplicated notifications from applying the same transition twice. Browser redirects are not treated as proof of payment. Do not mix an IDR gateway with EUR menu prices: the request validator rejects that configuration to prevent incorrect amounts.

## Receipt printer

Printing is optional. Set `POS_PRINTER_DEVICE` only on the application host to one of the accepted connector names:

- Linux USB printer: `/dev/usb/lp0` through `/dev/usb/lp99`
- Windows serial device: `COM1` through `COM99`

The PHP/web-server user must be allowed to open the device. When the setting is blank or invalid, the admin print endpoint returns `503` without attempting arbitrary file or network access. Receipts are always rebuilt from the stored order; totals sent by a browser are ignored.

## Production deployment

Before the first release, create a database backup plan and persistent storage for both the database and `storage/app/public`. For concurrent production traffic, prefer MySQL or PostgreSQL and Redis-backed cache, sessions, and queues over SQLite.

Set production configuration through environment variables or a secret manager. At minimum:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-host.example
APP_LOCALE=fr
APP_TIMEZONE=Europe/Paris
AUTH_REGISTRATION_ENABLED=false
POS_CURRENCY=EUR
POS_CURRENCY_PRECISION=2
POS_LOCALE=fr-FR
SESSION_SECURE_COOKIE=true
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE=lax
```

Keep the original `APP_KEY` stable after the first deployment; rotating it invalidates encrypted application data and sessions. Keep `.env`, database files, logs, backups, upload storage, and payment secrets outside the public document root.

A typical immutable release runs:

```bash
composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction
npm ci
npm run build
php artisan storage:link
php artisan migrate --force
php artisan optimize
```

Provision the administrator with the one-time procedure above, either before `php artisan optimize` or followed by a fresh configuration cache. On the first production deployment, load the menu with the two dedicated seed commands if the database is empty.

Also:

- Make `storage/` and `bootstrap/cache/` writable by the application user, but not publicly browsable.
- Terminate TLS correctly and configure trusted proxies so Laravel sees HTTPS.
- Run a supervised queue worker if this deployment uses queued jobs or mail.
- Restart long-running PHP and queue processes after each release.
- Confirm `GET /up`, the read-only customer menu, disabled public checkout, admin authorization, uploads, and printer behavior after deployment.
- Back up before migrations and never use destructive migration rollback as a routine production deploy step.

## Security model

The application includes CSRF protection, request validation, disabled public checkout, rate limits on checkout attempts, tracking, callbacks, and printing, server-side price calculation, UUID customer order links, restricted product uploads, guarded order transitions, admin authentication plus verified-email and authorization checks, and baseline browser security headers. The Midtrans callback is the only checkout route exempted from CSRF because it is authenticated through the provider workflow.

These controls do not replace secure operations. Enforce HTTPS, protect secrets and backups, review uploaded content, limit administrator accounts, monitor logs, and keep dependencies patched. A customer order URL acts as a bearer credential and must not be posted publicly.

See [SECURITY.md](SECURITY.md) for the reporting process and production security checklist.

## Testing and release checks

Run the non-mutating quality checks before a release:

```bash
composer validate --strict
composer test
vendor/bin/pint --test
npm run format:check
npx eslint . --max-warnings=0
npm run types
npm run build
composer audit --locked
npm audit --audit-level=high
```

`npm run lint` uses ESLint's `--fix` mode and may modify files; the explicit `npx eslint` command above is suitable for CI verification. The repository has no JavaScript unit-test script; frontend release confidence currently comes from TypeScript, formatting, linting, production build checks, and the Laravel/Pest feature suite.

For payment changes, additionally test signed sandbox callbacks, duplicate notifications, admin delivery settlement, and every supported payment-state transition. For database changes, test against the same database engine used in production.

## License

This project is distributed under the [MIT License](LICENSE.md).
