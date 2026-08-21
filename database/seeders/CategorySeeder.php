<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            'Pizzas base tomate',
            'Pizzas base crème',
            'Formules',
            'Gratins de ravioles',
            'Paninis',
            'Desserts',
            'Boissons',
            'Suppléments',
        ] as $sortOrder => $name) {
            Category::updateOrCreate(
                ['name' => $name],
                ['sort_order' => $sortOrder + 1],
            );
        }
    }
}
