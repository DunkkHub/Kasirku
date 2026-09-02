# Teisseire Pizza Digital Menu

Laravel + Inertia + React + TypeScript application for a QR-code restaurant menu and a small protected admin CMS.

Customers browse the menu only. Public routes do not mutate menu data or create customer transactions; all content management lives behind the administrator area.

## Features

- Public homepage is the menu at `/`.
- Mobile-first dark Teisseire Pizza design with sticky horizontal category navigation.
- Fast client-side search by dish name, ingredients, description, or category.
- Editable restaurant settings: logo, Halal indicator, tagline, description, phone, address, hours, currency symbol/position, pizza-size text, and social/map links.
- Editable categories: name, description, cover image, active/disabled status, and display position.
- Editable menu items through the existing `products` architecture: image uploads, ingredients, description, price, availability, and display position.
- Unavailable dishes remain visible on the public menu with an “Indisponible” state.
- Disabled categories are hidden from the public menu.
- Admin area is protected by a dedicated `/admin/login` flow, verified email, and the `is_admin` authorization gate.

## Stack

- Laravel 12
- Inertia 2
- React 19
- TypeScript
- Tailwind CSS 4
- Vite
- Pest
- Playwright smoke tests

## Local setup

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
```

For local development, change the copied `.env` to development-safe values:

```env
APP_ENV=local
APP_DEBUG=true
APP_URL=http://127.0.0.1:8000
DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite
SESSION_SECURE_COOKIE=false
MAIL_MAILER=log
```

Create the SQLite database:

```bash
php -r "file_exists('database/database.sqlite') || touch('database/database.sqlite');"
```

PowerShell equivalent:

```powershell
if (!(Test-Path database/database.sqlite)) { New-Item -ItemType File database/database.sqlite | Out-Null }
```

Then run:

```bash
php artisan migrate --seed
npm run build
php artisan serve
```

Open the public menu:

```text
http://127.0.0.1:8000/
```

## Create an admin account

Public registration is not exposed. Add one temporary admin seed profile to `.env`:

```env
ADMIN_NAME="Teisseire Admin"
ADMIN_EMAIL=admin@teisseire.local
ADMIN_PASSWORD="change-this-strong-16-chars"
```

Then run:

```bash
php artisan db:seed --class=UserSeeder --force
```

Remove `ADMIN_PASSWORD` from `.env` after the account exists.

Admin dashboard:

```text
http://127.0.0.1:8000/admin/login
http://127.0.0.1:8000/admin
```

## Admin CMS

Sidebar:

- Dashboard
- Menu
- Categories
- Restaurant Settings
- Logout

Canonical admin URLs:

- `/admin`
- `/admin/menu`
- `/admin/categories`
- `/admin/settings`

Dashboard shows menu counts only:

- Total Plats
- Total Catégories
- Plats Disponibles
- Plats Indisponibles

## Seeded menu data

The development seeders create editable starting data based on the provided physical Teisseire Pizza menu:

- Pizza Base Tomate
- Pizza Base Crème
- Panini
- Formules
- Boissons
- Gratins de Ravioles
- Desserts
- Suppléments

The seeders are idempotent for development setup. They do not hardcode the public frontend; all restaurant details, categories, and menu items are database records that can be edited in admin.

## Uploads

Images are stored on Laravel’s public disk. Link storage in deployments that need uploaded files:

```bash
php artisan storage:link
```

Allowed upload formats:

- JPG/JPEG
- PNG
- WEBP

Uploads are size- and dimension-limited by Laravel validation, decoded as real images, stripped of metadata by server-side re-encoding, resized when needed, and stored with generated filenames.

## Useful commands

```bash
php artisan test
php artisan migrate:fresh --seed
npm run types
npm run lint
npm run build
npx playwright install chromium
npm run e2e
composer validate --strict
composer audit --locked
npm audit --audit-level=high
```

## Deployment notes

- Full deployment guide: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
- Free Windows 11 self-hosting with FrankenPHP and Tailscale Funnel: [docs/WINDOWS_SELF_HOSTING.md](docs/WINDOWS_SELF_HOSTING.md).
- Serve only Laravel’s `public/` directory.
- Set `APP_ENV=production`, `APP_DEBUG=false`, a real HTTPS `APP_URL`, `SESSION_SECURE_COOKIE=true`, `SESSION_HTTP_ONLY=true`, and `SESSION_SAME_SITE=lax` or stricter.
- Keep `.env`, database files, uploaded storage internals, logs, and backups outside the public document root.
- Keep public registration disabled; create administrators through the controlled `ADMIN_*` seeder flow only.
- Keep `FILESYSTEM_SERVE_LOCAL=false` unless you intentionally need Laravel signed local-disk file serving.
- Back up the database and uploaded menu/category/restaurant images.
- Suggested GitHub About description: `Digital menu and protected menu-management CMS for Teisseire Pizza.`
