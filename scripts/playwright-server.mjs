import { spawn, spawnSync } from 'node:child_process';
import { closeSync, existsSync, mkdirSync, openSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = process.env.E2E_PORT ?? '8010';
const databasePath = resolve(root, 'database', 'e2e.sqlite');
const publicStoragePath = resolve(root, 'public', 'storage');
const appKey = 'base64:MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTI=';
const isWindows = process.platform === 'win32';

const env = {
    ...process.env,
    APP_NAME: 'Teisseire Pizza E2E',
    APP_ENV: 'e2e',
    APP_KEY: appKey,
    APP_DEBUG: 'false',
    APP_URL: `http://127.0.0.1:${port}`,
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
    FILESYSTEM_DISK: 'public',
    FILESYSTEM_SERVE_LOCAL: 'false',
};

function run(command, args) {
    const result = spawnSync(command, args, {
        cwd: root,
        env,
        stdio: 'inherit',
        shell: isWindows,
    });

    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

mkdirSync(dirname(databasePath), { recursive: true });
rmSync(databasePath, { force: true });
closeSync(openSync(databasePath, 'w'));

run('php', ['artisan', 'config:clear']);

if (!existsSync(publicStoragePath)) {
    run('php', ['artisan', 'storage:link']);
}

run('php', ['artisan', 'migrate:fresh', '--seed', '--force']);

const server = spawn('php', ['artisan', 'serve', '--host=127.0.0.1', `--port=${port}`, '--no-reload'], {
    cwd: root,
    env,
    stdio: 'inherit',
    shell: isWindows,
});

const stop = () => {
    if (!server.killed) {
        server.kill('SIGTERM');
    }
};

process.on('SIGINT', stop);
process.on('SIGTERM', stop);
process.on('exit', stop);

server.on('exit', (code) => {
    process.exit(code ?? 0);
});
