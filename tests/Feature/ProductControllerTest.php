<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductPhotos;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

function tinyPng(string $name = 'food.png'): UploadedFile
{
    return UploadedFile::fake()->createWithContent(
        $name,
        base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=')
    );
}

test('guests cannot access product management', function () {
    $this->get('/admin/menu')->assertRedirect('/admin/login');
});

test('admin can list menu items with category and photos', function () {
    $this->actingAs(User::factory()->admin()->create());

    $category = Category::factory()->create();
    Product::factory()->count(3)->create(['category_id' => $category->id]);

    $response = $this->get('/admin/menu');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/products/index')
        ->has('products', 3)
    );
});

test('product search filters by name ingredient and description', function () {
    $this->actingAs(User::factory()->admin()->create());

    Product::factory()->create(['name' => 'Saumon', 'ingredients' => 'Mozza, saumon', 'description' => null]);
    Product::factory()->create(['name' => 'Tiramisu', 'ingredients' => null, 'description' => 'Dessert café']);

    $this->get('/admin/menu?search=saumon')
        ->assertInertia(fn ($page) => $page
            ->has('products', 1)
            ->where('products.0.name', 'Saumon')
        );

    $this->get('/admin/menu?search=café')
        ->assertInertia(fn ($page) => $page
            ->has('products', 1)
            ->where('products.0.name', 'Tiramisu')
        );
});

test('admin can create a menu item with ingredients order availability and photo', function () {
    Storage::fake('public');
    $this->actingAs(User::factory()->admin()->create());
    $category = Category::factory()->create();

    $response = $this->post('/admin/menu', [
        'name' => 'Pizza test',
        'category_id' => $category->id,
        'ingredients' => 'Emmental, Mozza',
        'description' => 'Recette test',
        'price' => 22,
        'sort_order' => 7,
        'is_available' => true,
        'photos' => [tinyPng()],
    ]);

    $response->assertRedirect(route('products.index'));
    $this->assertDatabaseHas('products', [
        'name' => 'Pizza test',
        'ingredients' => 'Emmental, Mozza',
        'description' => 'Recette test',
        'price' => 22,
        'sort_order' => 7,
        'is_available' => true,
    ]);

    $product = Product::where('name', 'Pizza test')->firstOrFail();
    expect($product->photos)->toHaveCount(1);
    expect($product->photos->first()->is_primary)->toBeTrue();
    expect($product->photos->first()->url)->toStartWith('/storage/products/')
        ->and($product->photos->first()->url)->toEndWith(function_exists('imagewebp') ? '.webp' : '.jpg');

    Storage::disk('public')->assertExists(str_replace('/storage/', '', $product->photos->first()->url));
});

test('product validation rejects invalid category price and unsafe uploads', function () {
    Storage::fake('public');
    $this->actingAs(User::factory()->admin()->create());
    $category = Category::factory()->create();

    $this->from('/admin/menu')->post('/admin/menu', [
        'name' => 'Invalid category',
        'category_id' => 999999,
        'price' => 10,
    ])->assertSessionHasErrors('category_id');

    $this->from('/admin/menu')->post('/admin/menu', [
        'name' => 'Invalid price',
        'category_id' => $category->id,
        'price' => -1,
    ])->assertSessionHasErrors('price');

    $this->from('/admin/menu')->post('/admin/menu', [
        'name' => 'Bad upload',
        'category_id' => $category->id,
        'price' => 10,
        'photos' => [UploadedFile::fake()->create('shell.php.jpg', 1, 'application/x-php')],
    ])->assertSessionHasErrors('photos.0');

    $this->from('/admin/menu')->post('/admin/menu', [
        'name' => 'Too large upload',
        'category_id' => $category->id,
        'price' => 10,
        'photos' => [UploadedFile::fake()->image('large.png')->size(5000)],
    ])->assertSessionHasErrors('photos.0');
});

test('admin can remove and replace a product photo on update', function () {
    Storage::fake('public');
    $this->actingAs(User::factory()->admin()->create());
    $product = Product::factory()->create(['is_available' => true]);
    $photo = ProductPhotos::factory()->create(['product_id' => $product->id, 'url' => Storage::url('products/existing.jpg')]);
    Storage::disk('public')->put('products/existing.jpg', 'fake-content');

    $response = $this->post("/admin/menu/{$product->id}", [
        '_method' => 'PUT',
        'name' => $product->name,
        'category_id' => $product->category_id,
        'ingredients' => 'Emmental, Mozza, Champignons',
        'description' => 'Mise à jour',
        'price' => $product->price,
        'sort_order' => 3,
        'is_available' => true,
        'remove_photos' => [$photo->id],
        'photos' => [tinyPng('replacement.png')],
    ]);

    $response->assertRedirect(route('products.index'));
    $this->assertDatabaseMissing('product_photos', ['id' => $photo->id]);
    Storage::disk('public')->assertMissing('products/existing.jpg');
    $this->assertDatabaseHas('products', [
        'id' => $product->id,
        'ingredients' => 'Emmental, Mozza, Champignons',
        'description' => 'Mise à jour',
        'sort_order' => 3,
    ]);
    $replacement = $product->fresh()->photos->firstOrFail();
    expect($product->fresh()->photos)->toHaveCount(1)
        ->and($replacement->url)->toStartWith('/storage/products/')
        ->and($replacement->url)->toEndWith(function_exists('imagewebp') ? '.webp' : '.jpg');
});

test('admin can toggle product availability', function () {
    $this->actingAs(User::factory()->admin()->create());
    $product = Product::factory()->create(['is_available' => true]);

    $this->patch("/admin/menu/{$product->id}/availability", ['is_available' => false])
        ->assertRedirect();

    expect($product->fresh()->is_available)->toBeFalse();
});

test('admin can delete a menu item', function () {
    $this->actingAs(User::factory()->admin()->create());
    $product = Product::factory()->create();

    $response = $this->delete("/admin/menu/{$product->id}");

    $response->assertRedirect(route('products.index'));
    $this->assertSoftDeleted('products', ['id' => $product->id]);
    expect($product->fresh()->is_available)->toBeFalse();
});
