<?php

use App\Models\Order;
use App\Models\User;
use App\Services\MidtransService;
use Midtrans\Config as MidtransConfig;

test('a verified non-admin account cannot enter the administration area', function () {
    $user = User::factory()->create();
    $order = Order::factory()->create();

    $this->actingAs($user)->get('/admin/dashboard')->assertForbidden();
    $this->actingAs($user)->get('/admin/orders')->assertForbidden();
    $this->actingAs($user)->get('/admin/products')->assertForbidden();
    $this->actingAs($user)->get('/admin/categories')->assertForbidden();
    $this->actingAs($user)->post("/admin/orders/{$order->id}/print")->assertForbidden();
});

test('web responses include browser hardening headers', function () {
    $this->get('/')
        ->assertOk()
        ->assertHeader('X-Content-Type-Options', 'nosniff')
        ->assertHeader('X-Frame-Options', 'DENY')
        ->assertHeader('X-Permitted-Cross-Domain-Policies', 'none')
        ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
        ->assertHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
        ->assertHeader('Content-Security-Policy', "base-uri 'self'; frame-ancestors 'none'; object-src 'none'");
});

test('authenticated and disabled checkout responses are not browser cached', function () {
    $this->actingAs(User::factory()->admin()->create())
        ->get('/admin/dashboard')
        ->assertOk()
        ->assertHeader('Cache-Control', 'no-store, private');

    $this->get('/checkout')
        ->assertRedirect('/')
        ->assertHeader('Cache-Control', 'no-store, private');
});

test('Midtrans timeout options preserve the SDK request headers', function () {
    new MidtransService;

    expect(MidtransConfig::$curlOptions[CURLOPT_HTTPHEADER] ?? [])
        ->toContain('User-Agent: Teisseire-Pizza-POS/1.0')
        ->and(MidtransConfig::$curlOptions[CURLOPT_CONNECTTIMEOUT] ?? null)->toBe(5)
        ->and(MidtransConfig::$curlOptions[CURLOPT_TIMEOUT] ?? null)->toBe(15);
});
