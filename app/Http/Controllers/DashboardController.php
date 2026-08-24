<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\RestaurantSetting;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $settings = RestaurantSetting::current();
        $totalProducts = Product::count();
        $availableProducts = Product::where('is_available', true)->count();
        $activeCategories = Category::where('is_active', true)->count();

        return Inertia::render('admin/dashboard/index', [
            'stats' => [
                'total_products' => $totalProducts,
                'total_categories' => Category::count(),
                'available_products' => $availableProducts,
                'unavailable_products' => max(0, $totalProducts - $availableProducts),
                'active_categories' => $activeCategories,
                'disabled_categories' => max(0, Category::count() - $activeCategories),
            ],
            'settings' => $settings->publicPayload(),
        ]);
    }
}
