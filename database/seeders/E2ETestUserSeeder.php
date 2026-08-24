<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class E2ETestUserSeeder extends Seeder
{
    /**
     * Seed deterministic browser-test users from environment variables.
     */
    public function run(): void
    {
        if (! app()->environment('e2e', 'testing', 'local')) {
            throw new RuntimeException('The E2E test users seeder may only run in local, testing, or e2e environments.');
        }

        $adminEmail = (string) env('E2E_ADMIN_EMAIL');
        $adminPassword = (string) env('E2E_ADMIN_PASSWORD');
        $normalEmail = (string) env('E2E_USER_EMAIL');
        $normalPassword = (string) env('E2E_USER_PASSWORD');

        foreach ([
            'E2E_ADMIN_EMAIL' => $adminEmail,
            'E2E_ADMIN_PASSWORD' => $adminPassword,
            'E2E_USER_EMAIL' => $normalEmail,
            'E2E_USER_PASSWORD' => $normalPassword,
        ] as $key => $value) {
            if ($value === '') {
                throw new RuntimeException("Missing required {$key} value for E2E user seeding.");
            }
        }

        $this->upsertUser('E2E Admin', $adminEmail, $adminPassword, true);
        $this->upsertUser('E2E User', $normalEmail, $normalPassword, false);
    }

    private function upsertUser(string $name, string $email, string $password, bool $isAdmin): void
    {
        $user = User::query()->firstOrNew(['email' => $email]);

        $user->forceFill([
            'name' => $name,
            'password' => Hash::make($password),
            'is_admin' => $isAdmin,
            'email_verified_at' => now(),
        ])->save();
    }
}
