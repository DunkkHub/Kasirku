<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Collection;

test('a verified non-admin account cannot enter the administration area', function () {
    $user = User::factory()->create();
    $category = Category::factory()->create();
    $product = Product::factory()->create(['category_id' => $category->id]);

    $this->actingAs($user)->get('/admin')->assertForbidden();
    $this->actingAs($user)->get('/admin/menu')->assertForbidden();
    $this->actingAs($user)->get("/admin/menu/{$product->id}/edit")->assertForbidden();
    $this->actingAs($user)->post('/admin/menu', [])->assertForbidden();
    $this->actingAs($user)->patch("/admin/menu/{$product->id}/availability", ['is_available' => false])->assertForbidden();
    $this->actingAs($user)->patch("/admin/menu/{$product->id}", [])->assertForbidden();
    $this->actingAs($user)->delete("/admin/menu/{$product->id}")->assertForbidden();
    $this->actingAs($user)->get('/admin/categories')->assertForbidden();
    $this->actingAs($user)->put("/admin/categories/{$category->id}", [])->assertForbidden();
    $this->actingAs($user)->delete("/admin/categories/{$category->id}")->assertForbidden();
    $this->actingAs($user)->get('/admin/settings')->assertForbidden();
    $this->actingAs($user)->put('/admin/settings', [])->assertForbidden();
});

test('anonymous visitors are redirected to the dedicated admin login for admin urls', function () {
    $product = Product::factory()->create();

    $this->get('/admin')->assertRedirect('/admin/login');
    $this->get('/admin/menu')->assertRedirect('/admin/login');
    $this->get("/admin/menu/{$product->id}/edit")->assertRedirect('/admin/login');
    $this->get('/admin/categories')->assertRedirect('/admin/login');
    $this->get('/admin/settings')->assertRedirect('/admin/login');
    $this->post('/admin/menu', [])->assertRedirect('/admin/login');
});

test('web responses include browser hardening headers', function () {
    $this->get('/')
        ->assertOk()
        ->assertHeader('X-Content-Type-Options', 'nosniff')
        ->assertHeader('X-Frame-Options', 'DENY')
        ->assertHeader('X-Permitted-Cross-Domain-Policies', 'none')
        ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
        ->assertHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
        ->assertHeader(
            'Content-Security-Policy',
            "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; form-action 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'"
        );
});

test('authenticated admin responses are not browser cached', function () {
    $this->actingAs(User::factory()->admin()->create())
        ->get('/admin')
        ->assertOk()
        ->assertHeader('Cache-Control', 'no-store, private');
});

test('public checkout and order urls do not expose ordering endpoints', function () {
    $this->get('/checkout')->assertNotFound();
    $this->get('/checkout/finish')->assertNotFound();
    $this->get('/order/not-a-real-order/status')->assertNotFound();
    $this->postJson('/checkout/process', [])->assertNotFound();
});

test('obsolete admin aliases are not exposed', function () {
    $this->actingAs(User::factory()->admin()->create());

    $this->get('/admin/dashboard')->assertNotFound();
    $this->get('/admin/products')->assertNotFound();
    $this->get('/admin/restaurant-settings')->assertNotFound();
});

test('generic auth urls do not expose old application auth screens', function () {
    $this->get('/login')->assertRedirect('/admin/login');
    $this->post('/login', [])->assertMethodNotAllowed();
    $this->get('/forgot-password')->assertNotFound();
    $this->post('/forgot-password', [])->assertNotFound();
    $this->get('/reset-password/token')->assertNotFound();
    $this->post('/reset-password', [])->assertNotFound();
    $this->get('/verify-email')->assertNotFound();
    $this->get('/confirm-password')->assertNotFound();
    $this->post('/logout')->assertNotFound();
});

test('public inertia route metadata does not expose admin route names', function () {
    $this->get('/')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('ziggy.routes', function (mixed $routes): bool {
                $routes = $routes instanceof Collection ? $routes->all() : (array) $routes;

                return isset($routes['home'], $routes['menu'])
                && ! isset($routes['admin.dashboard'])
                && ! isset($routes['products.index'])
                && ! isset($routes['categories.index'])
                && ! isset($routes['restaurant-settings.edit']);
            })
        );
});
