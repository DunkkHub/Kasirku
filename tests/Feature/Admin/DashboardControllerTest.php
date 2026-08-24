<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\RestaurantSetting;
use App\Models\User;

test('guests cannot access the dashboard', function () {
    $this->get('/admin')->assertRedirect('/admin/login');
});

test('dashboard reports digital menu counts only', function () {
    $this->actingAs(User::factory()->admin()->create());

    $active = Category::factory()->create(['is_active' => true]);
    Category::factory()->create(['is_active' => false]);
    Product::factory()->count(2)->create(['category_id' => $active->id, 'is_available' => true]);
    Product::factory()->create(['category_id' => $active->id, 'is_available' => false]);

    $response = $this->get('/admin');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/dashboard/index')
        ->where('stats.total_products', 3)
        ->where('stats.total_categories', 2)
        ->where('stats.available_products', 2)
        ->where('stats.unavailable_products', 1)
        ->where('stats.active_categories', 1)
        ->where('stats.disabled_categories', 1)
        ->where('settings.restaurant_name', RestaurantSetting::current()->restaurant_name)
        ->missing('topProducts')
        ->missing('recentOrders')
        ->missing('revenueTrend')
        ->missing('ordersByStatus')
    );
});
