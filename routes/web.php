<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PrintController;
use App\Http\Controllers\ProductController;
use Illuminate\Support\Facades\Route;

Route::get('/', [CustomerController::class, 'index'])->name('home');

// Checkout routes
Route::prefix('checkout')->group(function () {
    Route::get('/', [CheckoutController::class, 'index'])->name('checkout.index');
    Route::post('/process', [CheckoutController::class, 'processCheckout'])->middleware('throttle:10,1')->name('checkout.process');
    Route::get('/finish', [CheckoutController::class, 'paymentFinish'])->name('checkout.finish');
    Route::get('/unfinish', [CheckoutController::class, 'paymentUnfinish'])->name('checkout.unfinish');
    Route::get('/error', [CheckoutController::class, 'paymentError'])->name('checkout.error');
    Route::post('/notification', [CheckoutController::class, 'paymentNotification'])->middleware('throttle:120,1')->name('checkout.notification');
});

// Order routes
Route::prefix('order')->group(function () {
    Route::get('/{publicId}/status', [CheckoutController::class, 'orderStatus'])->whereUuid('publicId')->middleware('throttle:60,1')->name('order.status');
    Route::get('/{publicId}/check', [CheckoutController::class, 'checkOrderStatus'])->whereUuid('publicId')->middleware('throttle:60,1')->name('order.check');
});

Route::prefix('admin')->middleware(['auth', 'verified', 'can:access-admin'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('admin.dashboard');

    // Resource route for CategoryController
    Route::resource('categories', CategoryController::class);

    // Resource route for ProductController
    Route::resource('products', ProductController::class);

    // Order routes (using modals, so only need index, store, update, destroy)
    Route::get('orders', [OrderController::class, 'index'])->name('orders.index');
    Route::post('orders', [OrderController::class, 'store'])->name('orders.store');
    Route::put('orders/{order}', [OrderController::class, 'update'])->name('orders.update');
    Route::delete('orders/{order}', [OrderController::class, 'destroy'])->name('orders.destroy');
    Route::post('orders/{order}/update-status', [OrderController::class, 'updateStatus'])->name('orders.update-status');
    Route::post('orders/{order}/print', [PrintController::class, 'printOrder'])->middleware('throttle:10,1')->name('orders.print');
});
require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
