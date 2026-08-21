<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductPhotos;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductPhotos>
 */
class ProductPhotosFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'url' => '/images/menu-pizza-tomate.webp',
            'is_primary' => true,
        ];
    }
}
