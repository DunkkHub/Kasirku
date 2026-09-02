import { expect, type Page, test } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const databasePath = resolve(root, 'database', 'e2e.sqlite');
const appKey = 'base64:MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTI=';
const adminEmail = `admin-${Date.now()}@e2e.test`;
const adminPassword = `E2e-${randomBytes(14).toString('hex')}!`;
const normalEmail = `user-${Date.now()}@e2e.test`;
const normalPassword = `User-${randomBytes(14).toString('hex')}!`;
const isWindows = process.platform === 'win32';

const tinyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');

function seedE2EUsers() {
    const result = spawnSync('php', ['artisan', 'db:seed', '--class=E2ETestUserSeeder', '--force'], {
        cwd: root,
        env: {
            ...process.env,
            APP_ENV: 'e2e',
            APP_KEY: appKey,
            APP_DEBUG: 'false',
            APP_LOCALE: 'fr',
            APP_FALLBACK_LOCALE: 'fr',
            APP_FAKER_LOCALE: 'fr_FR',
            APP_TIMEZONE: 'Europe/Paris',
            DB_CONNECTION: 'sqlite',
            DB_DATABASE: databasePath,
            CACHE_STORE: 'array',
            SESSION_DRIVER: 'file',
            QUEUE_CONNECTION: 'sync',
            MAIL_MAILER: 'array',
            E2E_ADMIN_EMAIL: adminEmail,
            E2E_ADMIN_PASSWORD: adminPassword,
            E2E_USER_EMAIL: normalEmail,
            E2E_USER_PASSWORD: normalPassword,
        },
        stdio: 'inherit',
        shell: isWindows,
    });

    if (result.status !== 0) {
        throw new Error(`Artisan command failed with status ${result.status ?? 'unknown'}`);
    }
}

async function login(page: Page, email: string, password: string) {
    await page.goto('/admin/login');
    await page.getByLabel('Adresse e-mail').fill(email);
    await page.getByLabel('Mot de passe').fill(password);
    await page.getByRole('button', { name: 'Se connecter' }).click();
}

test.beforeAll(() => {
    seedE2EUsers();
});

test('public digital menu loads, filters products, and stays mobile-friendly', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /Menu digital/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Marguarita', exact: true })).toBeVisible();
    await expect(page.getByText('Emmental, Mozza', { exact: true })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Catégories du menu' })).toBeVisible();

    await page.getByRole('searchbox', { name: 'Rechercher un plat' }).fill('tiramisu');
    await expect(page.getByText('Tiramisu')).toBeVisible();
    await expect(page.getByText('Marguarita')).toBeHidden();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const hasNoHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    expect(hasNoHorizontalOverflow).toBeTruthy();
});

test('admin authentication rejects invalid and non-admin users', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login$/);

    await login(page, normalEmail, normalPassword);
    await expect(page.getByText('Ces identifiants ne correspondent pas à nos enregistrements.')).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/login$/);

    await page.getByLabel('Adresse e-mail').fill(adminEmail);
    await page.getByLabel('Mot de passe').fill('wrong-password');
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page.getByText('Ces identifiants ne correspondent pas à nos enregistrements.')).toBeVisible();
});

test('admin can manage categories, products, images, price, availability, and logout', async ({ page }, testInfo) => {
    const runSuffix = `${Date.now()}-${testInfo.retry}`;
    const categoryName = `E2E Catégorie ${runSuffix}`;
    const productName = `Pizza E2E ${runSuffix}`;
    const productCardName = `Plat ${productName}`;

    await login(page, adminEmail, adminPassword);
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole('heading', { name: 'Gérez simplement la carte de Teisseire Pizza.' })).toBeVisible();

    await page.goto('/admin/categories');
    await page.getByRole('button', { name: 'Ajouter une catégorie' }).click();
    const categoryDialog = page.getByRole('dialog', { name: 'Ajouter une catégorie' });
    await categoryDialog.getByPlaceholder('Pizza Base Tomate').fill(categoryName);
    await categoryDialog.getByPlaceholder('Nos pizzas artisanales Ø33cm...').fill('Catégorie créée par Playwright');
    await categoryDialog.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(categoryDialog).toBeHidden();
    await expect(page.getByText(categoryName)).toBeVisible();

    await page.goto('/admin/menu');
    await page.getByRole('button', { name: 'Ajouter un plat' }).click();
    const productDialog = page.getByRole('dialog', { name: 'Ajouter un plat' });
    await productDialog.getByPlaceholder('Ex. Marguarita').fill(productName);
    await productDialog.getByText('Sélectionner une catégorie').click();
    await page.getByRole('option', { name: categoryName, exact: true }).click();
    await productDialog.getByPlaceholder('Emmental, Mozza, Champignons').fill('Mozza, Basilic');
    await productDialog.getByPlaceholder('Texte libre pour les formules, gratins ou précisions.').fill('Créée par le test E2E');
    await productDialog.getByPlaceholder('10.50').fill('12.50');
    await productDialog.locator('input[type="file"]').setInputFiles({
        name: 'pizza-e2e.png',
        mimeType: 'image/png',
        buffer: tinyPng,
    });
    await productDialog.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(productDialog).toBeHidden();
    let productCard = page.getByRole('article', { name: productCardName, exact: true });
    await expect(productCard).toHaveCount(1);
    await expect(productCard).toBeVisible();
    await expect(productCard.getByText('12,50 €')).toBeVisible();

    await page.getByPlaceholder('Rechercher par nom, ingrédient, description...').fill(productName);
    productCard = page.getByRole('article', { name: productCardName, exact: true });
    await expect(productCard).toHaveCount(1);
    await expect(productCard).toBeVisible();
    await productCard.getByRole('button', { name: 'Modifier' }).click();
    const editDialog = page.getByRole('dialog', { name: 'Modifier le plat' });
    await expect(editDialog).toBeVisible();
    await editDialog.getByPlaceholder('10.50').fill('13.50');
    await editDialog.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(editDialog).toBeHidden();
    productCard = page.getByRole('article', { name: productCardName, exact: true });
    await expect(productCard).toHaveCount(1);
    await expect(productCard.getByText('13,50 €')).toBeVisible();

    await productCard.getByRole('button', { name: /Masquer/ }).click();
    await expect(productCard.getByText('Indisponible').first()).toBeVisible();

    await page.getByRole('button', { name: 'Ouvrir le menu du compte' }).click();
    await page.getByRole('menuitem', { name: 'Se déconnecter' }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login$/);
});
