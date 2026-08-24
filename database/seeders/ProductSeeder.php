<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductPhotos;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $menu = [
            'Pizza Base Tomate' => [
                ['Marguarita', 'Emmental, Mozza', null, 8.00],
                ['Romaine', 'Emmental, Mozza, Jambon', null, 10.00],
                ['Poulet Merguez', 'Emmental, Mozza, Merguez', 'Le menu imprimé affiche « Poule » ; corrigez le nom dans l’admin si besoin.', 10.00],
                ['Bolognaise', 'Emmental, Mozza, Viande hachée', null, 10.00],
                ['Forestière', 'Emmental, Mozza, Champignons', null, 10.00],
                ['Thon', 'Emmental, Mozza, Thon émietté', null, 10.00],
                ['Poulet', 'Emmental, Mozza, Poulet', null, 10.00],
                ['Chèvre', 'Emmental, Mozza, Chèvre', null, 10.00],
                ['Turk', 'Emmental, Mozza, Sucuk, Poivrons', null, 10.00],
                ['Kebab', 'Emmental, Mozza, Kebab', null, 10.00],
                ['Anchois', 'Emmental, Mozza, Anchois, Câpres', null, 10.50],
                ['Fruit de Mer', 'Emmental, Mozza, Fruits de mer, Persillade', null, 10.50],
                ['Mexicaine', 'Emmental, Mozza, Viande hachée, Poivron', null, 10.50],
                ['Kiri', 'Emmental, Mozza, Viande hachée, Kiri', null, 10.50],
                ['Saumon', 'Emmental, Mozza, Saumon', null, 10.50],
                ['Tunisienne', 'Emmental, Mozza, Merguez, Mechouia', null, 10.50],
                ['Orientale', 'Emmental, Mozza, Merguez, Œuf, Poivrons', null, 10.50],
                ['Mechouia', 'Thon, Mechouia, Mozza, Emmental', null, 10.50],
                ['Végétarienne', 'Emmental, Mozza, Poivron, Oignons, Champignons', null, 10.50],
                ['Reine', 'Emmental, Mozza, Jambon, Champignons', null, 10.50],
                ['Chorizo', 'Emmental, Poivron, Mozza, Chorizo', null, 10.50],
                ['4 Fromages', 'Emmental, Mozza, Bleu, Chèvre', null, 10.50],
                ['Crevettes', 'Emmental, Mozza, Crevette, Persillade', null, 10.50],
                ['Texane', 'Emmental, Mozza, Viande hachée, Poivrons', null, 10.50],
                ['Océane', 'Emmental, Mozza, Thon, Crevette, Saumon', null, 11.00],
                ['Barbecue', 'Emmental, Mozza, Poulet, Viande hachée, Sauce barbecue', null, 11.00],
                ['Burger', 'Emmental, Mozza, Viande hachée, Cheddar, Sauce Biggy Burger', null, 11.00],
                ['Algérienne', 'Emmental, Poulet, Viande hachée, Kebab, Sauce Algérienne', null, 11.00],
                ['Chili Thaï', 'Emmental, Mozza, Poulet ou crevette, Sauce chili thaï', null, 11.00],
                ['Cannibale', 'Emmental, Mozza, Poulet, Viande hachée, Merguez', null, 12.00],
                ['Teisseire', 'Emmental, Mozza, Bleu, Chèvre, Jambon, Champignons', null, 12.00],
            ],
            'Pizza Base Crème' => [
                ['Norvégienne', 'Emmental, Crème, Mozza, Saumon', null, 11.00],
                ['Boisée', 'Emmental, Sauce Fromagère, Mozza, Poulet, Poivrons ou Champignons', null, 11.00],
                ['Tartiflette', 'Emmental, Crème, Mozza, Oignons, Reblochon, Pomme de terre, Lardons', null, 11.00],
                ['Savoyarde', 'Emmental, Crème, Mozza, Jambon, Reblochon', null, 11.00],
                ['Boursin', 'Emmental, Crème, Mozza, Poulet ou Jambon ou Viande hachée ou Saumon, Boursin', null, 11.00],
                ['Dijonnaise', 'Emmental, Crème, Mozza, Poulet, Moutarde', null, 11.00],
                ['Ravioles', 'Emmental, Crème, Mozza, Ravioles, Saumon ou Poulet ou Jambon ou Viande hachée', null, 11.00],
                ['Chèvre Miel', 'Emmental, Crème, Mozza, Chèvre, Miel', null, 11.00],
                ['Curry', 'Emmental, Crème, Mozza, Sauce Curry, Poulet', null, 11.00],
                ['Raclette', 'Emmental, Crème, Mozza, Raclette, Jambon, Pomme de terre', null, 11.00],
                ['Carbonara', 'Emmental, Crème, Mozza, Lardon, Œuf, Olive', null, 11.00],
            ],
            'Formules' => [
                ['Formule 3 pizzas + boisson', null, '3 pizzas au choix + 1 bouteille 1,5 L.', 30.00],
                ['Formule 3 Marguarita', null, '3 pizzas Marguarita.', 20.00],
            ],
            'Gratins de Ravioles' => [
                ['Gratin de Ravioles', null, 'Au choix : saumon, poulet ou lardons.', 9.00],
            ],
            'Panini' => [
                ['Panini Poulet', 'Poulet', null, 5.00],
                ['Panini Viande hachée', 'Viande hachée', null, 5.00],
            ],
            'Desserts' => [
                ['Tiramisu', null, 'Dessert maison.', 3.00],
            ],
            'Boissons' => [
                ['Bouteille 1,5 L', null, 'Boisson fraîche en bouteille.', 3.00],
                ['Canette 33 cl', null, 'Boisson fraîche en canette.', 1.50],
                ['Eau + Sirop', null, 'Eau fraîche avec sirop.', 1.50],
            ],
            'Suppléments' => [
                ['Supplément autres', null, 'Supplément hors viande.', 1.00],
                ['Supplément viande', null, 'Supplément viande.', 1.50],
            ],
        ];

        $photos = [
            'Pizza Base Tomate' => '/images/menu-pizza-tomate.webp',
            'Pizza Base Crème' => '/images/menu-pizza-creme.webp',
            'Formules' => '/images/menu-pizza-tomate.webp',
            'Gratins de Ravioles' => '/images/menu-gratin-ravioles.webp',
            'Panini' => '/images/menu-panini-tiramisu.webp',
            'Desserts' => '/images/menu-panini-tiramisu.webp',
            'Boissons' => '/images/menu-boissons.webp',
            'Suppléments' => '/images/menu-pizza-tomate.webp',
        ];

        foreach ($menu as $categoryName => $products) {
            $category = Category::query()->where('name', $categoryName)->firstOrFail();
            $expectedNames = array_map(static fn (array $product): string => $product[0], $products);
            $staleProductIds = Product::query()
                ->where('category_id', $category->id)
                ->whereNotIn('name', $expectedNames)
                ->pluck('id');

            if ($staleProductIds->isNotEmpty()) {
                ProductPhotos::query()->whereIn('product_id', $staleProductIds)->delete();
                Product::query()->whereKey($staleProductIds)->delete();
            }

            foreach ($products as $sortOrder => [$name, $ingredients, $description, $price]) {
                $product = Product::withTrashed()->updateOrCreate(
                    ['name' => $name, 'category_id' => $category->id],
                    [
                        'description' => $description,
                        'ingredients' => $ingredients,
                        'price' => $price,
                        'is_available' => true,
                        'sort_order' => $sortOrder + 1,
                    ],
                );

                if ($product->trashed()) {
                    $product->restore();
                }

                ProductPhotos::updateOrCreate(
                    ['product_id' => $product->id, 'is_primary' => true],
                    ['url' => $photos[$categoryName]],
                );
            }
        }
    }
}
