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

## Application boundaries

- `/` is a public, read-only menu.
- Customers cannot create carts, checkout sessions, payments, delivery requests, pickup requests, or orders through the website.
- `/admin/*` requires an authenticated, verified user that passes the administrator authorization gate.
- Public registration is not exposed.
- Menu, category, image, and restaurant-settings mutations require admin access and Laravel CSRF protection.
- Uploaded images are type-, size-, and dimension-limited and stored through Laravel’s public storage disk.
- Baseline response headers restrict framing, MIME sniffing, referrers, browser capabilities, and object embedding.

## Deployment security checklist

- Serve only the `public/` directory over HTTPS.
- Never expose the project root, `.env`, SQLite/database files, logs, source maps, backups, or storage internals.
- Set `APP_ENV=production`, `APP_DEBUG=false`, canonical HTTPS `APP_URL`, and secure session-cookie settings.
- Provision administrators through the `ADMIN_*` seeder flow, then remove `ADMIN_PASSWORD` from `.env`.
- Keep `FILESYSTEM_SERVE_LOCAL=false` unless Laravel signed local-disk file serving is intentionally needed.
- Use unique admin passwords and promptly disable accounts that no longer need access.
- Disable script execution in uploaded storage directories.
- Back up the database and uploaded images, encrypt backups, and test restoration.
- Run tests, lint, type checks, production build, and dependency audits before release.

## Dependency handling

Use committed lockfiles and review update diffs. At minimum, run:

```bash
composer audit --locked
npm audit --audit-level=high
```

Audits supplement, but do not replace, code review and application testing.
