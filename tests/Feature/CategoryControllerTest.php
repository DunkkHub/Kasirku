<?php

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItems;
use App\Models\Product;
use App\Models\User;

test('guests cannot access category management', function () {
    $this->get('/admin/categories')->assertRedirect('/login');
});

test('admin can list categories with product counts', function () {
    $this->actingAs(User::factory()->admin()->create());

    $category = Category::factory()->create(['name' => 'Pizzas']);
    Product::factory()->count(2)->create(['category_id' => $category->id]);

    $response = $this->get('/admin/categories');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/categories/index')
        ->where('categories.0.products_count', 2)
    );
});

test('admin can create a category', function () {
    $this->actingAs(User::factory()->admin()->create());

    $response = $this->post('/admin/categories', ['name' => 'Boissons']);

    $response->assertRedirect(route('categories.index'));
    $this->assertDatabaseHas('categories', ['name' => 'Boissons']);
});

test('category name must be unique', function () {
    $this->actingAs(User::factory()->admin()->create());
    Category::factory()->create(['name' => 'Boissons']);

    $response = $this->from('/admin/categories')->post('/admin/categories', ['name' => 'Boissons']);

    $response->assertSessionHasErrors('name');
    $this->assertDatabaseCount('categories', 1);
});

test('admin can update a category', function () {
    $this->actingAs(User::factory()->admin()->create());
    $category = Category::factory()->create(['name' => 'Old Name']);

    $response = $this->put("/admin/categories/{$category->id}", ['name' => 'New Name']);

    $response->assertRedirect(route('categories.index'));
    $this->assertDatabaseHas('categories', ['id' => $category->id, 'name' => 'New Name']);
});

test('deleting a category without products succeeds', function () {
    $this->actingAs(User::factory()->admin()->create());
    $category = Category::factory()->create();

    $response = $this->delete("/admin/categories/{$category->id}");

    $response->assertRedirect(route('categories.index'));
    $this->assertDatabaseMissing('categories', ['id' => $category->id]);
});

test('deleting a category with products fails', function () {
    $this->actingAs(User::factory()->admin()->create());
    $category = Category::factory()->create();
    Product::factory()->create(['category_id' => $category->id]);

    $response = $this->from('/admin/categories')->delete("/admin/categories/{$category->id}");

    $response->assertSessionHasErrors('error');
    $this->assertDatabaseHas('categories', ['id' => $category->id]);
});

test('archiving a sold product cannot cascade-delete its category or order history', function () {
    $this->actingAs(User::factory()->admin()->create());
    $category = Category::factory()->create();
    $product = Product::factory()->create(['category_id' => $category->id]);
    $order = Order::factory()->create();
    $item = OrderItems::factory()->create([
        'order_id' => $order->id,
        'product_id' => $product->id,
    ]);

    $this->delete("/admin/products/{$product->id}")->assertRedirect(route('products.index'));
    $this->from('/admin/categories')->delete("/admin/categories/{$category->id}")
        ->assertSessionHasErrors('error');

    $this->assertDatabaseHas('categories', ['id' => $category->id]);
    $this->assertSoftDeleted('products', ['id' => $product->id]);
    $this->assertDatabaseHas('order_items', ['id' => $item->id, 'order_id' => $order->id]);
});
