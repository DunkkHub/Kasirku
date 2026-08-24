<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductPhotos;
use App\Models\RestaurantSetting;
use Database\Seeders\CategorySeeder;
use Database\Seeders\ProductSeeder;
use Database\Seeders\RestaurantSettingSeeder;

test('the French Teisseire menu seeds completely and idempotently', function () {
    $this->seed([RestaurantSettingSeeder::class, CategorySeeder::class, ProductSeeder::class]);
    $this->seed([RestaurantSettingSeeder::class, CategorySeeder::class, ProductSeeder::class]);

    expect(Category::count())->toBe(8)
        ->and(Product::count())->toBe(53)
        ->and(ProductPhotos::count())->toBe(53)
        ->and(RestaurantSetting::current()->restaurant_name)->toBe('Teisseire Pizza')
        ->and((float) Product::where('name', 'Marguarita')->firstOrFail()->price)->toBe(8.0)
        ->and((float) Product::where('name', 'Teisseire')->firstOrFail()->price)->toBe(12.0)
        ->and((float) Product::where('name', 'Tiramisu')->firstOrFail()->price)->toBe(3.0)
        ->and(ProductPhotos::where('url', 'like', '/images/%')->count())->toBe(53);

    ProductPhotos::query()->pluck('url')->each(function (string $url): void {
        expect($url)->toStartWith('/images/');
        $this->assertFileExists(public_path(ltrim($url, '/')), "Image de menu introuvable : {$url}");
    });
});
