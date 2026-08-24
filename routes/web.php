<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\RestaurantSettingsController;
use Illuminate\Support\Facades\Route;

Route::get('/', [CustomerController::class, 'index'])->name('home');
Route::get('/menu', [CustomerController::class, 'index'])->name('menu');

Route::prefix('admin')->middleware(['auth', 'verified', 'can:access-admin'])->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('admin.dashboard');

    Route::patch('menu/{product}/availability', [ProductController::class, 'toggleAvailability'])->name('products.availability');
    Route::resource('menu', ProductController::class)
        ->parameters(['menu' => 'product'])
        ->names('products');

    Route::resource('categories', CategoryController::class);

    Route::get('settings', [RestaurantSettingsController::class, 'edit'])->name('restaurant-settings.edit');
    Route::put('settings', [RestaurantSettingsController::class, 'update'])->name('restaurant-settings.update');
});

require __DIR__.'/auth.php';
