<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductPhotos;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('guests cannot access product management', function () {
    $this->get('/admin/products')->assertRedirect('/login');
});

test('admin can list products with category and photos', function () {
    $this->actingAs(User::factory()->admin()->create());

    $category = Category::factory()->create();
    Product::factory()->count(3)->create(['category_id' => $category->id]);

    $response = $this->get('/admin/products');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/products/index')
        ->has('products', 3)
    );
});

test('product search filters by name', function () {
    $this->actingAs(User::factory()->admin()->create());

    Product::factory()->create(['name' => 'Margherita']);
    Product::factory()->create(['name' => 'Tiramisu']);

    $response = $this->get('/admin/products?search=Margherita');

    $response->assertInertia(fn ($page) => $page
        ->has('products', 1)
        ->where('products.0.name', 'Margherita')
    );
});

test('admin can create a product with a photo', function () {
    Storage::fake('public');
    $this->actingAs(User::factory()->admin()->create());
    $category = Category::factory()->create();

    $response = $this->post('/admin/products', [
        'name' => 'Pizza test',
        'category_id' => $category->id,
        'price' => 22,
        'photos' => [UploadedFile::fake()->createWithContent(
            'food.png',
            base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=')
        )],
    ]);

    $response->assertRedirect(route('products.index'));
    $this->assertDatabaseHas('products', ['name' => 'Pizza test', 'price' => 22]);

    $product = Product::where('name', 'Pizza test')->firstOrFail();
    expect($product->photos)->toHaveCount(1);
    expect($product->photos->first()->is_primary)->toBeTrue();
});

test('admin can remove a product photo on update', function () {
    Storage::fake('public');
    $this->actingAs(User::factory()->admin()->create());
    $product = Product::factory()->create();
    $photo = ProductPhotos::factory()->create(['product_id' => $product->id, 'url' => Storage::url('products/existing.jpg')]);
    Storage::disk('public')->put('products/existing.jpg', 'fake-content');

    $response = $this->put("/admin/products/{$product->id}", [
        'name' => $product->name,
        'category_id' => $product->category_id,
        'price' => $product->price,
        'remove_photos' => [$photo->id],
    ]);

    $response->assertRedirect(route('products.index'));
    $this->assertDatabaseMissing('product_photos', ['id' => $photo->id]);
});

test('admin can delete a product', function () {
    $this->actingAs(User::factory()->admin()->create());
    $product = Product::factory()->create();

    $response = $this->delete("/admin/products/{$product->id}");

    $response->assertRedirect(route('products.index'));
    $this->assertSoftDeleted('products', ['id' => $product->id]);
    expect($product->fresh()->is_available)->toBeFalse();
});
