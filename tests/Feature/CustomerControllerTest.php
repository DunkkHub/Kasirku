<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\RestaurantSetting;

test('customer menu renders restaurant settings, products, and categories', function () {
    RestaurantSetting::current()->update([
        'restaurant_name' => 'Teisseire Pizza',
        'tagline' => 'Nouvelle équipe, nouvelles recettes !',
    ]);
    $category = Category::factory()->create();
    Product::factory()->count(3)->create(['category_id' => $category->id]);

    $response = $this->get('/');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('customer/index')
        ->has('products', 3)
        ->has('categories', 1)
        ->where('settings.restaurant_name', 'Teisseire Pizza')
        ->where('settings.tagline', 'Nouvelle équipe, nouvelles recettes !')
    );
});

test('public menu search is client side and does not create an order endpoint', function () {
    Product::factory()->create(['name' => 'Pizza Margherita']);
    Product::factory()->create(['name' => 'Tiramisu']);

    $response = $this->get('/?search=Margherita');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('products', 2)
    );
});

test('public menu always returns the read only menu page', function () {
    Product::factory()->count(15)->create();

    $response = $this->get('/?page=2', ['X-Requested-With' => 'XMLHttpRequest']);

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('customer/index')
        ->has('products', 15)
    );
});
