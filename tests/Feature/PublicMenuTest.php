<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\RestaurantSetting;

test('public homepage loads the digital menu without authentication', function () {
    $settings = RestaurantSetting::current();
    $category = Category::factory()->create(['name' => 'Pizza Base Tomate', 'is_active' => true, 'sort_order' => 1]);
    Product::factory()->create([
        'category_id' => $category->id,
        'name' => 'Saumon',
        'ingredients' => 'Emmental, Mozza, Saumon',
        'price' => 10.50,
        'is_available' => true,
    ]);

    $response = $this->get('/');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('customer/index')
        ->where('settings.restaurant_name', $settings->restaurant_name)
        ->where('categories.0.name', 'Pizza Base Tomate')
        ->where('products.0.name', 'Saumon')
        ->where('products.0.ingredients', 'Emmental, Mozza, Saumon')
    );
});

test('public menu keeps unavailable dishes visible and hides disabled categories', function () {
    $active = Category::factory()->create(['name' => 'Desserts', 'is_active' => true]);
    $disabled = Category::factory()->create(['name' => 'Secret', 'is_active' => false]);
    Product::factory()->create(['category_id' => $active->id, 'name' => 'Tiramisu', 'is_available' => false]);
    Product::factory()->create(['category_id' => $disabled->id, 'name' => 'Hidden item']);

    $response = $this->get('/');

    $response->assertInertia(fn ($page) => $page
        ->has('products', 1)
        ->where('products.0.name', 'Tiramisu')
        ->where('products.0.is_available', false)
        ->has('categories', 1)
        ->where('categories.0.name', 'Desserts')
    );
});

test('public menu props do not include cart checkout order or payment controls', function () {
    Category::factory()->create(['is_active' => true]);

    $response = $this->get('/');

    $response->assertInertia(fn ($page) => $page
        ->component('customer/index')
        ->missing('cart')
        ->missing('checkout')
        ->missing('orders')
        ->missing('payments')
        ->missing('delivery_fee')
        ->missing('midtrans_enabled')
    );
});
