<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $name = (string) config('admin.name');
        $email = (string) config('admin.email');
        $password = (string) config('admin.password');

        if ($name === '' || $email === '' || $password === '') {
            if (app()->isProduction()) {
                throw new RuntimeException('ADMIN_NAME, ADMIN_EMAIL et ADMIN_PASSWORD sont requis pour créer un administrateur.');
            }

            $this->command?->warn('Création de l’administrateur ignorée : les variables ADMIN_* ne sont pas toutes renseignées.');

            return;
        }

        if (! filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 16 || strtolower($password) === 'password') {
            throw new RuntimeException('ADMIN_EMAIL doit être valide et ADMIN_PASSWORD doit être un mot de passe unique d’au moins 16 caractères.');
        }

        $user = User::query()->firstOrNew(['email' => strtolower($email)]);
        $user->forceFill([
            'name' => $name,
            'password' => Hash::make($password),
            'is_admin' => true,
            'email_verified_at' => now(),
        ])->save();
    }
}
