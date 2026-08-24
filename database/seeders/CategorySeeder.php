<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            'Pizzas base tomate' => 'Pizza Base Tomate',
            'Pizzas base crème' => 'Pizza Base Crème',
            'Paninis' => 'Panini',
            'Gratins de ravioles' => 'Gratins de Ravioles',
        ] as $oldName => $newName) {
            $oldCategory = Category::query()->where('name', $oldName)->first();
            if ($oldCategory && ! Category::query()->where('name', $newName)->exists()) {
                $oldCategory->update(['name' => $newName]);
            }
        }

        $categories = [
            ['Pizza Base Tomate', 'Nos pizzas artisanales sur base tomate.', '/images/menu-pizza-tomate.webp'],
            ['Pizza Base Crème', 'Recettes généreuses sur base crème ou fromagère.', '/images/menu-pizza-creme.webp'],
            ['Panini', 'Paninis chauds à consulter sur la carte.', '/images/menu-panini-tiramisu.webp'],
            ['Formules', 'Offres à partager avec pizzas et boissons.', '/images/menu-pizza-tomate.webp'],
            ['Boissons', 'Bouteilles, canettes et boissons fraîches.', '/images/menu-boissons.webp'],
            ['Gratins de Ravioles', 'Gratins de ravioles au choix.', '/images/menu-gratin-ravioles.webp'],
            ['Desserts', 'Desserts maison et douceurs.', '/images/menu-panini-tiramisu.webp'],
            ['Suppléments', 'Suppléments simples affichés à titre informatif.', '/images/menu-pizza-tomate.webp'],
        ];

        foreach ($categories as $sortOrder => [$name, $description, $image]) {
            Category::updateOrCreate(
                ['name' => $name],
                [
                    'description' => $description,
                    'image' => $image,
                    'is_active' => true,
                    'sort_order' => $sortOrder + 1,
                ],
            );
        }
    }
}
