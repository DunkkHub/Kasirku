# Security Policy

## Supported code

Security fixes are applied to the current default branch. This repository does not currently publish a versioned long-term-support matrix; deployments should track reviewed releases from the default branch and keep both Composer and npm dependencies current.

## Report a vulnerability privately

Do not open a public issue, discussion, pull request, or social-media post for a vulnerability that has not been fixed.

Use GitHub's **Security** tab and select **Report a vulnerability** to open a private security advisory for this repository. If private reporting is not available, ask the repository owner for a private contact channel without including exploit details in the public request.

Include only the information needed to reproduce and assess the issue:

- the affected commit or release and deployment configuration;
- the affected route, component, or feature;
- concise reproduction steps or a minimal proof of concept;
- the security impact and any conditions required for exploitation;
- a suggested remediation, if known; and
- sanitized logs or screenshots where useful.

Never include live credentials, Midtrans keys, session cookies, customer names, phone numbers, addresses, order-tracking URLs, payment data, or production database contents. Revoke any secret that was accidentally disclosed.

Reports are reviewed on a best-effort basis. The maintainers will use the private advisory to clarify the report, coordinate a fix, and agree on disclosure timing. No fixed response or remediation SLA is promised.

## Safe research expectations

- Test only an instance and data you own or have explicit permission to use.
- Prefer a local installation and Midtrans sandbox credentials.
- Do not access, alter, retain, or disclose another person's data.
- Do not perform denial-of-service, destructive, high-volume automated, social-engineering, or physical attacks.
- Stop testing and report privately if you encounter real personal, order, or payment information.
- Give maintainers a reasonable opportunity to investigate and release a fix before public disclosure.

## Application security boundaries

- `/admin/*` requires an authenticated, verified user that passes the administrator authorization gate. Public registration is disabled by default.
- Customer order status pages use unguessable UUID links. Each link is a bearer credential: possession grants access to the limited status view, so it must not be shared or logged unnecessarily.
- Order prices, tax, delivery charges, totals, payment state, and receipt contents are calculated or loaded on the server. Client totals are not authoritative.
- Checkout, status polling, Midtrans notifications, and printer requests are rate-limited. Laravel CSRF protection covers browser-originated state changes; the Midtrans notification endpoint is the narrow exception.
- Midtrans notifications require a valid signature and must match the stored payment amount and currency. State changes use row locking and idempotent event handling. A return-page redirect is not evidence of payment.
- Product uploads are type-, size-, and dimension-limited and stored through Laravel's public storage disk. The web server must still prevent script execution from upload directories.
- Receipt printing accepts only configured local `/dev/usb/lpN` or `COMN` device names and rebuilds the receipt from the database.
- Baseline response headers restrict framing, MIME sniffing, referrers, browser capabilities, and object embedding. HSTS is sent only for secure production requests.

These controls reduce risk but do not make an unsafe deployment secure.

## Deployment security checklist

- Serve only the `public/` directory over HTTPS; never expose the project root, `.env`, SQLite files, logs, source maps, backups, or storage internals.
- Set `APP_ENV=production`, `APP_DEBUG=false`, a canonical HTTPS `APP_URL`, and `SESSION_SECURE_COOKIE=true`. Retain HTTP-only and SameSite cookie protection.
- Generate a strong `APP_KEY` once, store it as a secret, and plan carefully before rotation.
- Leave `AUTH_REGISTRATION_ENABLED=false` unless public accounts are an intentional, reviewed feature.
- Provision administrators through the documented one-time `ADMIN_*` seeder flow. Remove `ADMIN_PASSWORD` immediately after seeding, use unique passwords, and promptly disable accounts that no longer require access.
- Keep `MIDTRANS_SERVER_KEY` server-side. Never expose it through a `VITE_*` variable, browser bundle, log, repository, ticket, or screenshot. Treat the client key as public but environment-specific.
- Do not enable Midtrans unless `POS_CURRENCY=IDR` and `POS_CURRENCY_PRECISION=0`. Keep the default EUR deployment on offline payment methods.
- Configure the Midtrans callback with HTTPS, verify sandbox behavior before production, and monitor rejected or repeatedly failing notifications.
- Restrict database, Redis, printer-device, upload, log, and backup permissions to the application and operations users that need them.
- Disable script execution in `storage/app/public`; apply conservative upload/body limits at the reverse proxy as defense in depth.
- Use a production database and queue/cache topology appropriate for expected concurrency. Back up the database and uploaded product images, encrypt backups, test restoration, and define retention.
- Review application and reverse-proxy logs without recording secrets, payment payloads, customer contact details, or full order-tracking URLs.
- Run the test, build, static-quality, and dependency-audit commands documented in `README.md` before deployment.
- Apply framework, Composer, npm, operating-system, PHP, database, and web-server security updates promptly.

## Secret or data exposure response

If a key, credential, order link, or customer record is exposed:

1. Contain access and preserve sanitized evidence.
2. Revoke or rotate the affected credential at its source. For Midtrans, rotate the compromised environment's key and rebuild assets if the client key changed.
3. Invalidate affected sessions or links where technically possible and restrict the exposed storage or log location.
4. Review audit, application, provider, and infrastructure logs for misuse.
5. Restore from a known-good state when integrity is uncertain.
6. Notify affected parties and authorities when applicable law, contract, or payment-provider policy requires it.
7. Patch the root cause, add a regression test, and document the incident without publishing reusable exploit details or personal data.

## Dependency handling

Use the committed lockfiles and review update diffs. At minimum, run `composer audit --locked` and `npm audit --audit-level=high` in CI and before production releases. An audit result is one input to risk assessment; it does not replace code review, application testing, signed callback and payment-transition tests, or infrastructure hardening.
