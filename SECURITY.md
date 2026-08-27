# Security Policy

## Supported code

Security fixes are applied to the current default branch. This project does not publish a versioned long-term-support matrix.

## Report a vulnerability privately

Do not open a public issue, discussion, pull request, or social-media post for an unfixed vulnerability.

Use GitHub's **Security** tab and select **Report a vulnerability**. If private reporting is not available, ask the repository owner for a private contact channel without including exploit details in the public request.

Useful report details:

- affected commit or deployment configuration;
- affected route, component, or feature;
- concise reproduction steps;
- impact and required conditions;
- suggested remediation, if known; and
- sanitized logs or screenshots.

Never include live credentials, session cookies, admin account details, production database contents, private backups, or uploaded files that are not safe to share.

## Current application boundaries

- `/` and `/menu` expose the public, read-only digital menu.
- `/up` is the lightweight framework health endpoint and is unauthenticated by design.
- `/admin/*` is the protected CMS for restaurant settings, categories, dishes, and menu images.
- Public registration is disabled. Administrators are provisioned through the controlled `ADMIN_*` seeder flow.
- Administrator access requires authentication, verified email, and the `access-admin` authorization gate.
- Menu, category, image, and restaurant-settings mutations require admin authorization and Laravel CSRF protection.

## Security controls

- Passwords are hashed through Laravel framework defaults.
- Login, password reset, email-verification notification, confirmation, and admin CMS routes are throttled.
- Successful login regenerates the session; logout invalidates the session and regenerates the CSRF token.
- Form requests enforce server-side authorization and strict validation for CMS writes.
- User-managed CMS text is passed through React/Inertia as text data and is not rendered as raw HTML.
- Query filtering uses Eloquent/query-builder APIs with validated filter inputs.
- Uploaded images are extension-, MIME-, size-, and dimension-limited, decoded server-side, stripped of metadata through re-encoding, resized if needed, renamed with generated filenames, and stored through Laravel’s configured public disk.
- Failed image writes are treated as validation failures, are logged with safe operational context, and must not persist missing image paths.
- Baseline response headers restrict framing, MIME sniffing, referrers, browser capabilities, object embedding, and form targets.
- Content Security Policy uses nonce-based scripts. Production should not include local Vite development allowances.
- Authenticated/admin responses use no-store caching.
- HSTS is sent only for HTTPS production requests.

## Deployment security checklist

- Serve only the `public/` directory over HTTPS.
- Never expose the project root, `.env`, SQLite/database files, logs, source maps, backups, or storage internals.
- Set `APP_ENV=production`, `APP_DEBUG=false`, canonical HTTPS `APP_URL`, `SESSION_SECURE_COOKIE=true`, `SESSION_HTTP_ONLY=true`, and `SESSION_SAME_SITE=lax` or stricter.
- Use least-privilege database credentials and rotate any credential that was ever exposed.
- Provision administrators through the `ADMIN_*` seeder flow, then remove `ADMIN_PASSWORD` from `.env`.
- Keep `AUTH_REGISTRATION_ENABLED=false`.
- Keep `FILESYSTEM_SERVE_LOCAL=false` unless Laravel signed local-disk file serving is intentionally needed.
- Disable script execution in uploaded storage directories.
- Back up the database and uploaded images, encrypt backups, and test restoration.
- Run tests, lint, type checks, production build, and dependency audits before release.
- Review [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) before production release, especially HTTPS, Nginx `public/` document root, storage persistence, and backup/rollback steps.

## Dependency handling

Use committed lockfiles and review update diffs. At minimum, run:

```bash
composer audit --locked
npm audit --audit-level=high
```

Audits supplement, but do not replace, code review and application testing.
