# Free Windows self-hosting with FrankenPHP and Tailscale Funnel

This guide hosts the Teisseire Pizza digital menu from one Windows 11 PC without paid hosting, a business domain, router port forwarding, a public static IP, Docker, Render, Railway, or Supabase.

Architecture:

```text
Internet visitor
  -> https://<your-pc>.<your-tailnet>.ts.net
  -> Tailscale Funnel TLS reverse proxy
  -> http://127.0.0.1:8000 on the Windows PC
  -> FrankenPHP
  -> Laravel public/ front controller
  -> local MySQL/MariaDB database + local uploaded images
```

Why this setup:

- Tailscale Funnel gives a free HTTPS `.ts.net` URL and avoids router port forwarding.
- FrankenPHP is a production-capable Laravel server, unlike `php artisan serve`.
- The server binds to `127.0.0.1` only; public traffic enters through Tailscale Funnel.
- The app keeps all writes in admin; the public site remains a digital menu only.

## 1. Install required software

Open PowerShell as your normal Windows user.

```powershell
winget install --id Git.Git -e
winget install --id PHP.PHP.8.4 -e
winget install --id Composer.Composer -e
winget install --id OpenJS.NodeJS.LTS -e
winget install --id Tailscale.Tailscale -e
```

Install FrankenPHP:

```powershell
irm https://frankenphp.dev/install.ps1 | iex
```

Install MySQL or MariaDB locally. MariaDB is fine for this Laravel app:

```powershell
winget install --id MariaDB.Server -e
```

If `winget` cannot find that package, install the MariaDB or MySQL Windows MSI from the official website, then open a new PowerShell window so `mysql` and `mysqldump` are on `PATH`.

Verify the tools:

```powershell
git --version
php --version
composer --version
node --version
npm --version
frankenphp version
tailscale version
mysql --version
mysqldump --version
```

Required PHP extensions for this project include PDO MySQL, SQLite for tests/local fallback, fileinfo, DOM/XML, GD, and EXIF.

## 2. Clone and install the app

```powershell
cd $env:USERPROFILE\Documents
git clone https://github.com/DunkkHub/Kasirku.git
cd Kasirku

composer install --no-dev --prefer-dist --optimize-autoloader
npm ci
npm run build
copy .env.example .env
php artisan key:generate
```

## 3. Create the local database

Choose a strong database password and save it somewhere private.

```powershell
mysql -u root -p
```

Run this SQL inside the MySQL/MariaDB prompt. Replace the password first.

```sql
CREATE DATABASE teisseire_menu CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'teisseire_menu'@'localhost' IDENTIFIED BY 'REPLACE_WITH_A_LONG_RANDOM_PASSWORD';
GRANT ALL PRIVILEGES ON teisseire_menu.* TO 'teisseire_menu'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 4. Configure `.env`

Open `.env` and set these values:

```env
APP_NAME="Teisseire Pizza"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://example.com

AUTH_REGISTRATION_ENABLED=false

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=teisseire_menu
DB_USERNAME=teisseire_menu
DB_PASSWORD=REPLACE_WITH_A_LONG_RANDOM_PASSWORD

SESSION_DRIVER=database
SESSION_SECURE_COOKIE=true
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE=lax

CACHE_STORE=database
QUEUE_CONNECTION=sync
FILESYSTEM_DISK=public
FILESYSTEM_SERVE_LOCAL=false

TRUSTED_PROXIES=127.0.0.1,::1
MAIL_MAILER=log
```

`APP_URL` will be updated after Tailscale Funnel shows the real `.ts.net` URL.

Do not put secrets in startup task command-line arguments. Keep them in `.env`.

## 5. Create database tables and the storage link

```powershell
php artisan migrate --force
php artisan storage:link
php artisan optimize
```

If `storage:link` fails on Windows, the production start script will create a Windows junction for `public/storage`.

## 6. Create or confirm the admin account

Public registration is disabled. To create one admin account, temporarily add this to `.env`:

```env
ADMIN_NAME="Teisseire Admin"
ADMIN_EMAIL=admin@teisseire.local
ADMIN_PASSWORD="REPLACE_WITH_A_UNIQUE_PASSWORD_OF_AT_LEAST_16_CHARACTERS"
```

Then run:

```powershell
php artisan db:seed --class=UserSeeder --force
```

After the account exists, remove `ADMIN_PASSWORD` from `.env`.

Admin login:

```text
http://127.0.0.1:8000/admin/login
```

## 7. Start the local production server

This script checks the production `.env`, runs safe Laravel maintenance commands, starts FrankenPHP, and starts or refreshes Tailscale Funnel if Tailscale is installed and logged in.

```powershell
.\scripts\windows\start-production.ps1
```

Local health check:

```powershell
.\scripts\windows\health-check.ps1 -SkipPublic
```

Stop the local server:

```powershell
.\scripts\windows\stop-production.ps1
```

Stop the local server and disable the Funnel mapping:

```powershell
.\scripts\windows\stop-production.ps1 -StopFunnel
```

## 8. Configure Tailscale Funnel

Install and log in:

```powershell
tailscale up
```

If the CLI asks you to log in, follow the browser prompt.

In the Tailscale admin console:

1. Enable MagicDNS.
2. Enable HTTPS certificates.
3. Enable Funnel for this device or approve the Funnel node attribute when prompted.

Start Funnel to the local FrankenPHP server:

```powershell
tailscale funnel --bg 8000
tailscale funnel status
```

The status command prints a public URL like:

```text
https://your-pc.your-tailnet.ts.net
```

Update `.env`:

```env
APP_URL=https://your-pc.your-tailnet.ts.net
```

Then refresh Laravel caches:

```powershell
php artisan optimize:clear
php artisan optimize
```

Run the full health check:

```powershell
.\scripts\windows\health-check.ps1
```

Also test from a phone on mobile data, not Wi-Fi:

```text
https://your-pc.your-tailnet.ts.net/
https://your-pc.your-tailnet.ts.net/admin/login
```

## 9. Start automatically after reboot

Install a Windows Task Scheduler task:

```powershell
.\scripts\windows\install-startup-task.ps1
```

The task runs at Windows logon, waits briefly for networking, starts FrankenPHP, and refreshes Tailscale Funnel. It does not put database passwords or app secrets in the scheduled command.

Remove it:

```powershell
.\scripts\windows\remove-startup-task.ps1
```

Manual task controls:

```powershell
Get-ScheduledTask -TaskName "Teisseire Pizza Menu"
Start-ScheduledTask -TaskName "Teisseire Pizza Menu"
Stop-ScheduledTask -TaskName "Teisseire Pizza Menu"
```

## 10. Backups

Create a backup of the database and uploaded public images:

```powershell
.\scripts\windows\backup.ps1
```

Backups are written to:

```text
backups\<date_time>\
```

Copy the backup folder to another drive or cloud storage. A backup that only stays on the same PC is not safe if the disk dies.

## 11. Windows power and reliability settings

For the menu to stay online, the PC must stay awake and connected.

Recommended Windows settings:

- Settings → System → Power: set sleep to Never while plugged in.
- Keep Tailscale signed in.
- Keep MySQL/MariaDB service set to Automatic startup.
- Reboot after Windows updates, then run `.\scripts\windows\health-check.ps1`.

## 12. Updating the website later

```powershell
cd $env:USERPROFILE\Documents\Kasirku
git pull origin master
composer install --no-dev --prefer-dist --optimize-autoloader
npm ci
npm run build
php artisan migrate --force
php artisan optimize:clear
php artisan optimize
.\scripts\windows\start-production.ps1
.\scripts\windows\health-check.ps1
```

## 13. Troubleshooting

If the public URL does not load:

```powershell
tailscale status
tailscale funnel status
.\scripts\windows\health-check.ps1 -SkipPublic
```

If local works but public does not, the issue is usually Tailscale login, Funnel approval, HTTPS certificate settings, or the `.ts.net` URL.

If images do not show:

```powershell
php artisan storage:link
dir public\storage
```

If the admin panel logs you out or browser security looks wrong, confirm:

```env
APP_URL=https://your-pc.your-tailnet.ts.net
SESSION_SECURE_COOKIE=true
TRUSTED_PROXIES=127.0.0.1,::1
```

Useful official docs:

- Tailscale Funnel: https://tailscale.com/docs/features/tailscale-funnel
- Tailscale Funnel CLI: https://tailscale.com/docs/reference/tailscale-cli/funnel
- Tailscale Windows install: https://tailscale.com/docs/install/windows
- Tailscale HTTPS certificates: https://tailscale.com/docs/how-to/set-up-https-certificates
- FrankenPHP: https://frankenphp.dev/
- FrankenPHP configuration: https://frankenphp.dev/docs/config/
