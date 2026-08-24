<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('guests cannot access category management', function () {
    $this->get('/admin/categories')->assertRedirect('/admin/login');
});

test('admin can list categories with product counts', function () {
    $this->actingAs(User::factory()->admin()->create());

    $category = Category::factory()->create(['name' => 'Pizza Base Tomate', 'sort_order' => 1]);
    Product::factory()->count(2)->create(['category_id' => $category->id]);

    $response = $this->get('/admin/categories');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/categories/index')
        ->where('categories.0.products_count', 2)
        ->where('categories.0.name', 'Pizza Base Tomate')
    );
});

test('admin can create a category with cms fields and image', function () {
    Storage::fake('public');
    $this->actingAs(User::factory()->admin()->create());

    $response = $this->post('/admin/categories', [
        'name' => 'Boissons',
        'description' => 'Boissons fraîches',
        'sort_order' => 5,
        'is_active' => true,
        'image' => UploadedFile::fake()->image('category.png'),
    ]);

    $response->assertRedirect(route('categories.index'));
    $this->assertDatabaseHas('categories', [
        'name' => 'Boissons',
        'description' => 'Boissons fraîches',
        'sort_order' => 5,
        'is_active' => true,
    ]);
    $image = Category::where('name', 'Boissons')->firstOrFail()->image;

    expect($image)->toStartWith('/storage/categories/')
        ->and($image)->toEndWith(function_exists('imagewebp') ? '.webp' : '.jpg');

    Storage::disk('public')->assertExists(str_replace('/storage/', '', $image));
});

test('category validation rejects unsafe image uploads and invalid sort order', function () {
    Storage::fake('public');
    $this->actingAs(User::factory()->admin()->create());

    $this->from('/admin/categories')->post('/admin/categories', [
        'name' => 'Unsafe image',
        'sort_order' => 1,
        'image' => UploadedFile::fake()->create('category.svg', 1, 'image/svg+xml'),
    ])->assertSessionHasErrors('image');

    $this->from('/admin/categories')->post('/admin/categories', [
        'name' => 'Bad order',
        'sort_order' => -1,
    ])->assertSessionHasErrors('sort_order');
});

test('category name must be unique', function () {
    $this->actingAs(User::factory()->admin()->create());
    Category::factory()->create(['name' => 'Boissons']);

    $response = $this->from('/admin/categories')->post('/admin/categories', ['name' => 'Boissons']);

    $response->assertSessionHasErrors('name');
    $this->assertDatabaseCount('categories', 1);
});

test('admin can update visibility and display order', function () {
    $this->actingAs(User::factory()->admin()->create());
    $category = Category::factory()->create(['name' => 'Old Name', 'is_active' => true, 'sort_order' => 1]);

    $response = $this->put("/admin/categories/{$category->id}", [
        'name' => 'New Name',
        'description' => 'Nouvelle description',
        'sort_order' => 9,
        'is_active' => false,
    ]);

    $response->assertRedirect(route('categories.index'));
    $this->assertDatabaseHas('categories', [
        'id' => $category->id,
        'name' => 'New Name',
        'description' => 'Nouvelle description',
        'sort_order' => 9,
        'is_active' => false,
    ]);
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
