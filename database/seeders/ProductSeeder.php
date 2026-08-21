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
            'Pizzas base tomate' => [
                ['Margherita', 'Emmental, mozzarella et sauce tomate.', 8.00],
                ['Romaine', 'Emmental, mozzarella, jambon et sauce tomate.', 10.00],
                ['Poulet', 'Emmental, mozzarella, poulet et sauce tomate.', 10.00],
                ['Bolognaise', 'Emmental, mozzarella, viande hachée et sauce tomate.', 10.00],
                ['Forestière', 'Emmental, mozzarella et champignons.', 10.00],
                ['Thon', 'Emmental, mozzarella et thon émietté.', 10.00],
                ['Chèvre', 'Emmental, mozzarella et chèvre.', 10.00],
                ['Turk', 'Emmental, mozzarella, sucuk et poivrons.', 10.00],
                ['Kebab', 'Emmental, mozzarella et kebab.', 10.00],
                ['Anchois', 'Emmental, mozzarella, anchois et câpres.', 10.50],
                ['Fruits de mer', 'Emmental, mozzarella, fruits de mer et persillade.', 10.50],
                ['Mexicaine', 'Emmental, mozzarella, viande hachée et poivrons.', 10.50],
                ['Kiri', 'Emmental, mozzarella, viande hachée et Kiri.', 10.50],
                ['Saumon', 'Emmental, mozzarella et saumon.', 10.50],
                ['Tunisienne', 'Emmental, mozzarella, merguez et méchouia.', 10.50],
                ['Orientale', 'Emmental, mozzarella, merguez, œuf et poivrons.', 10.50],
                ['Méchouia', 'Thon, méchouia, mozzarella et emmental.', 10.50],
                ['Végétarienne', 'Emmental, mozzarella, poivrons, oignons et champignons.', 10.50],
                ['Reine', 'Emmental, mozzarella, jambon et champignons.', 10.50],
                ['Chorizo', 'Emmental, mozzarella, poivrons et chorizo.', 10.50],
                ['4 Fromages', 'Emmental, mozzarella, bleu et chèvre.', 10.50],
                ['Crevettes', 'Emmental, mozzarella, crevettes et persillade.', 10.50],
                ['Texane', 'Emmental, mozzarella, viande hachée et poivrons.', 10.50],
                ['Océane', 'Emmental, mozzarella, thon, crevettes et saumon.', 11.00],
                ['Barbecue', 'Emmental, mozzarella, poulet, viande hachée et sauce barbecue.', 11.00],
                ['Burger', 'Emmental, mozzarella, viande hachée, cheddar et sauce burger.', 11.00],
                ['Algérienne', 'Emmental, poulet, viande hachée, kebab et sauce algérienne.', 11.00],
                ['Chili Thaï', 'Emmental, mozzarella, poulet ou crevettes et sauce chili thaï.', 11.00],
                ['Cannibale', 'Emmental, mozzarella, poulet, viande hachée et merguez.', 12.00],
                ['Teisseire', 'Emmental, mozzarella, bleu, chèvre, jambon et champignons.', 12.00],
            ],
            'Pizzas base crème' => [
                ['Norvégienne', 'Emmental, crème, mozzarella et saumon.', 11.00],
                ['Boisée', 'Emmental, sauce fromagère, mozzarella, poulet, poivrons ou champignons.', 11.00],
                ['Tartiflette', 'Emmental, crème, mozzarella, oignons, reblochon, pommes de terre et lardons.', 11.00],
                ['Savoyarde', 'Emmental, crème, mozzarella, jambon et reblochon.', 11.00],
                ['Boursin', 'Emmental, crème, mozzarella, poulet ou jambon ou viande hachée ou saumon et Boursin.', 11.00],
                ['Dijonnaise', 'Emmental, crème, mozzarella, poulet et moutarde.', 11.00],
                ['Ravioles', 'Emmental, crème, mozzarella, ravioles et saumon, poulet, jambon ou viande hachée.', 11.00],
                ['Chèvre Miel', 'Emmental, crème, mozzarella, chèvre et miel.', 11.00],
                ['Curry', 'Emmental, crème, mozzarella, sauce curry et poulet.', 11.00],
                ['Raclette', 'Emmental, crème, mozzarella, raclette, jambon et pommes de terre.', 11.00],
                ['Carbonara', 'Emmental, crème, mozzarella, lardons, œuf et olives.', 11.00],
            ],
            'Formules' => [
                ['Formule 3 pizzas + boisson', 'Trois pizzas au choix et une bouteille de 1,5 L.', 30.00],
                ['Formule 3 Margherita', 'Trois pizzas Margherita.', 20.00],
            ],
            'Gratins de ravioles' => [
                ['Gratin de ravioles au saumon', 'Gratin de ravioles généreux au saumon.', 9.00],
                ['Gratin de ravioles au poulet', 'Gratin de ravioles généreux au poulet.', 9.00],
                ['Gratin de ravioles aux lardons', 'Gratin de ravioles généreux aux lardons.', 9.00],
            ],
            'Paninis' => [
                ['Panini poulet', 'Panini chaud garni au poulet.', 5.00],
                ['Panini viande hachée', 'Panini chaud garni à la viande hachée.', 5.00],
            ],
            'Desserts' => [
                ['Tiramisu', 'Tiramisu maison.', 3.00],
            ],
            'Boissons' => [
                ['Bouteille 1,5 L', 'Boisson fraîche en bouteille de 1,5 L.', 3.00],
                ['Canette 33 cl', 'Boisson fraîche en canette de 33 cl.', 1.50],
                ['Eau + sirop', 'Eau fraîche avec sirop au choix.', 1.50],
            ],
            'Suppléments' => [
                ['Supplément au choix', 'Supplément hors viande.', 1.00],
                ['Supplément viande', 'Supplément viande au choix.', 1.50],
            ],
        ];

        $photos = [
            'Pizzas base tomate' => '/images/menu-pizza-tomate.webp',
            'Pizzas base crème' => '/images/menu-pizza-creme.webp',
            'Formules' => '/images/menu-pizza-tomate.webp',
            'Gratins de ravioles' => '/images/menu-gratin-ravioles.webp',
            'Paninis' => '/images/menu-panini-tiramisu.webp',
            'Desserts' => '/images/menu-panini-tiramisu.webp',
            'Boissons' => '/images/menu-boissons.webp',
            'Suppléments' => '/images/menu-pizza-tomate.webp',
        ];

        foreach ($menu as $categoryName => $products) {
            $category = Category::query()->where('name', $categoryName)->firstOrFail();

            foreach ($products as $sortOrder => [$name, $description, $price]) {
                $product = Product::withTrashed()->updateOrCreate(
                    ['name' => $name, 'category_id' => $category->id],
                    [
                        'description' => $description,
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
