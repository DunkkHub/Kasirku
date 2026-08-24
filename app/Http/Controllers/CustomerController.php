<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\RestaurantSetting;
use Inertia\Inertia;

class CustomerController extends Controller
{
    public function index()
    {
        $settings = RestaurantSetting::current();

        $categories = Category::query()
            ->where('is_active', true)
            ->withCount(['activeProducts as products_count'])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (Category $category): array => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
                'description' => $category->description,
                'image' => $category->image,
                'products_count' => $category->products_count,
            ]);

        $products = Product::query()
            ->with(['category', 'photos'])
            ->whereHas('category', fn ($query) => $query->where('is_active', true))
            ->orderBy(
                Category::query()
                    ->select('sort_order')
                    ->whereColumn('categories.id', 'products.category_id')
                    ->limit(1)
            )
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (Product $product): array => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'category_id' => $product->category_id,
                'price' => $product->price,
                'description' => $product->description,
                'ingredients' => $product->ingredients,
                'is_available' => $product->is_available,
                'category' => $product->category ? [
                    'id' => $product->category->id,
                    'name' => $product->category->name,
                    'slug' => $product->category->slug,
                ] : null,
                'photos' => $product->photos
                    ->map(fn ($photo): array => [
                        'url' => $photo->url,
                        'is_primary' => $photo->is_primary,
                    ])
                    ->values(),
            ]);

        return Inertia::render('customer/index', [
            'settings' => $settings->publicPayload(),
            'products' => $products,
            'categories' => $categories,
        ]);
    }
}
