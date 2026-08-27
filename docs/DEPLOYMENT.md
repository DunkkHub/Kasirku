# Production Deployment Guide

This application is a public digital restaurant menu plus a protected admin CMS for restaurant settings, categories, dishes, and menu images.

The examples below assume a standard Ubuntu/Debian VPS with Nginx, PHP-FPM, MySQL or PostgreSQL, HTTPS via Let’s Encrypt, and Node.js available only during the build step.

## 1. Server prerequisites

- PHP 8.2+ with common Laravel extensions: `bcmath`, `ctype`, `curl`, `dom`, `fileinfo`, `gd`, `mbstring`, `openssl`, `pdo`, `tokenizer`, `xml`, `zip`.
- Composer 2.
- Node.js 22 LTS or another version satisfying `package.json`.
- MySQL/MariaDB or PostgreSQL.
- Nginx.
- Certbot or another ACME client for HTTPS.

## 2. Before deployment

- Identify the exact Git commit SHA or release tag that will be deployed.
- Confirm the release gate passes locally or in CI: Composer validation, Laravel tests, Pint, frontend formatting, ESLint, TypeScript, production build, dependency audits, and Playwright.
- Confirm `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL` is the canonical HTTPS URL, and `SESSION_SECURE_COOKIE=true`.
- Back up the production database.
- Back up uploaded menu/category/restaurant images or verify the persistent volume/object-storage disk that contains them.
- Confirm the web server document root is the repository `public/` directory.
- Plan a short maintenance window if the migration or asset switch could affect visitors.

## 3. Clone and install

```bash
cd /var/www
git clone https://github.com/DunkkHub/Kasirku.git teisseire-menu
cd /var/www/teisseire-menu
git fetch --all --tags
git switch --detach <intended-commit-sha>

composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction
npm ci
npm run build
```

Node is not required at runtime after assets are built.

## 4. Environment file

```bash
cp .env.example .env
php artisan key:generate
```

Set production values:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.example

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=teisseire_menu
DB_USERNAME=teisseire_menu
DB_PASSWORD=change-this-database-password

SESSION_DRIVER=database
SESSION_SECURE_COOKIE=true
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE=lax

CACHE_STORE=database
QUEUE_CONNECTION=database
FILESYSTEM_DISK=public
FILESYSTEM_SERVE_LOCAL=false
MAIL_MAILER=smtp
```

If the app is behind a trusted reverse proxy/CDN/load balancer, set only the exact trusted proxy IPs or CIDR ranges:

```env
TRUSTED_PROXIES=127.0.0.1,10.0.0.0/8
```

Do not set `TRUSTED_PROXIES=*` unless the network path is fully controlled.

## 5. Database

Create a dedicated database and a least-privilege user. The app does not need root database access.

Example MySQL:

```sql
CREATE DATABASE teisseire_menu CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'teisseire_menu'@'localhost' IDENTIFIED BY 'change-this-database-password';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP ON teisseire_menu.* TO 'teisseire_menu'@'localhost';
FLUSH PRIVILEGES;
```

Then run:

```bash
php artisan migrate --force
php artisan db:seed --class=RestaurantSettingSeeder --force
php artisan db:seed --class=CategorySeeder --force
php artisan db:seed --class=ProductSeeder --force
```

## 6. Create the first administrator

Public registration is not exposed. Create an admin through one-time environment variables:

```env
ADMIN_NAME="Teisseire Admin"
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD="use-a-unique-password-with-16-plus-characters"
```

Then run:

```bash
php artisan db:seed --class=UserSeeder --force
```

Immediately remove `ADMIN_PASSWORD` from `.env` after the account exists.

## 7. Storage

Uploaded restaurant/category/product images use Laravel’s public disk.

```bash
php artisan storage:link
```

Make `storage/` and `bootstrap/cache/` writable by the PHP-FPM user:

```bash
sudo chown -R www-data:www-data storage bootstrap/cache
sudo find storage bootstrap/cache -type d -exec chmod 775 {} \;
sudo find storage bootstrap/cache -type f -exec chmod 664 {} \;
```

For ephemeral infrastructure, use persistent attached storage or an S3-compatible disk for uploaded menu images.

## 8. Deployment sequence

For an already configured server, use this sequence from the intended release directory:

```bash
php artisan down
git fetch --all --tags
git switch --detach <intended-commit-sha>
composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction
npm ci
npm run build
php artisan migrate --force
php artisan storage:link
php artisan optimize
sudo systemctl reload php8.2-fpm
sudo systemctl reload nginx
php artisan up
```

`php artisan storage:link` is normally a one-time setup command. It is safe to include in a deployment runbook, but persistent uploaded files must live in `storage/app/public` or an equivalent configured persistent disk.

## 9. Laravel optimization

After `.env`, dependencies, migrations, seeders, and build assets are ready:

```bash
php artisan optimize
```

For deploys that update routes/config/views:

```bash
php artisan optimize:clear
php artisan migrate --force
npm ci
npm run build
php artisan optimize
```

Verify:

```bash
php artisan route:list
curl -I https://your-domain.example/up
```

The health endpoint must return success without exposing secrets.

## 10. Nginx example

Replace `your-domain.example`, PHP-FPM socket/version, and paths for your server.

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.example www.your-domain.example;

    location /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.example www.your-domain.example;

    root /var/www/teisseire-menu/public;
    index index.php;

    client_max_body_size 8m;

    ssl_certificate /etc/letsencrypt/live/your-domain.example/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.example/privkey.pem;

    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~* \.(?:css|js|woff2?|png|jpg|jpeg|webp|svg|ico)$ {
        try_files $uri =404;
        access_log off;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        fastcgi_param DOCUMENT_ROOT $realpath_root;
    }

    location ~ /\.(?!well-known) {
        deny all;
    }

    location ~* ^/(app|bootstrap|config|database|resources|routes|storage|tests|vendor|node_modules)/ {
        deny all;
    }
}
```

The document root must be `public/`, never the repository root.

## 11. Backups

Back up both database data and uploaded images.

Example daily MySQL backup:

```bash
mkdir -p /var/backups/teisseire-menu
mysqldump --single-transaction --routines --triggers teisseire_menu \
  | gzip > "/var/backups/teisseire-menu/db-$(date +%F).sql.gz"
```

Example uploaded image backup:

```bash
tar -C /var/www/teisseire-menu/storage/app/public \
  -czf "/var/backups/teisseire-menu/uploads-$(date +%F).tar.gz" .
```

Recommended policy:

- daily backups;
- at least 14–30 days retention;
- one encrypted off-server copy;
- test restore on a non-production database before trusting the backup plan.

Restore outline:

```bash
php artisan down
gunzip -c db-YYYY-MM-DD.sql.gz | mysql teisseire_menu
tar -C storage/app/public -xzf uploads-YYYY-MM-DD.tar.gz
php artisan optimize:clear
php artisan optimize
php artisan up
```

## 12. Post-deploy smoke tests

Check after every deployment:

- `GET /up` returns a success status without exposing diagnostics.
- Public menu loads at `/`.
- Built CSS/JS assets load without 404s.
- Seeded and uploaded images render.
- Admin login loads and accepts a real administrator account.
- Menu/category create, update, validation error, and delete flows work.
- Restaurant settings save successfully.
- Logout invalidates the admin session.
- Application logs contain no new unexpected errors.

## 13. Rollback

Keep the previous known-good release commit and matching backups available. Restoring older application files does not automatically restore an older database schema or data.

```bash
php artisan down
git fetch --all
git switch --detach <previous-known-good-commit>
composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction
npm ci
npm run build
php artisan optimize
sudo systemctl reload php8.2-fpm
sudo systemctl reload nginx
php artisan up
```

Safe rollback process:

1. Identify the previous known-good application release.
2. Restore that application release.
3. If database schema/data changed incompatibly, restore the pre-deploy database backup or use an explicitly tested reversible migration strategy.
4. Restore or verify uploaded assets if required.
5. Clear and rebuild Laravel caches.
6. Perform the post-deploy smoke tests again.

Tie every backup and release artifact to the Git commit SHA or release identifier so the application files, database, and uploaded images can be matched during recovery.

## 14. Pre-release verification

Run these before promoting a release:

```bash
composer validate --strict
composer install
php artisan migrate:fresh --seed
php artisan test
vendor/bin/pint --test
composer audit --locked
npm ci
npm run format:check
npm run lint
npm run types
npm run build
npx playwright install chromium
npm audit --audit-level=high
npm run e2e:ci
php artisan route:list
php artisan optimize
```

Use a throwaway database for `migrate:fresh --seed`; it deletes existing data.
