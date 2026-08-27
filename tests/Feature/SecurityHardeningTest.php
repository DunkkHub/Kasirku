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

test('an unverified admin must verify email before entering the administration area', function () {
    $user = User::factory()->admin()->unverified()->create();

    $this->actingAs($user)->get('/admin')->assertRedirect('/admin/verify-email');
});

test('anonymous visitors are redirected to the dedicated admin login for admin urls', function () {
    $product = Product::factory()->create();

    $this->get('/admin')->assertRedirect('/admin/login');
    $this->get('/admin/menu')->assertRedirect('/admin/login');
    $this->get('/admin/categories')->assertRedirect('/admin/login');
    $this->get('/admin/settings')->assertRedirect('/admin/login');
    $this->post('/admin/menu', [])->assertRedirect('/admin/login');
});

test('health endpoint is public and does not expose diagnostics', function () {
    $response = $this->get('/up')->assertOk();
    $content = strtolower($response->getContent());

    expect($content)
        ->not->toContain('app_key')
        ->not->toContain('database')
        ->not->toContain(strtolower(base_path()));
});

test('web responses include browser hardening headers', function () {
    $response = $this->get('/')
        ->assertOk()
        ->assertHeader('X-Content-Type-Options', 'nosniff')
        ->assertHeader('X-Frame-Options', 'DENY')
        ->assertHeader('X-Permitted-Cross-Domain-Policies', 'none')
        ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
        ->assertHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    $csp = (string) $response->headers->get('Content-Security-Policy');

    expect($csp)
        ->toContain("default-src 'self'")
        ->toContain("style-src 'self' 'unsafe-inline'")
        ->toContain("img-src 'self' data: blob:")
        ->toContain("font-src 'self' data:")
        ->toContain("connect-src 'self'")
        ->toContain("form-action 'self'")
        ->toContain("base-uri 'self'")
        ->toContain("frame-ancestors 'none'")
        ->toContain("object-src 'none'")
        ->not->toContain("'unsafe-eval'");

    expect(preg_match("/script-src 'self' 'nonce-([^']+)'/", $csp, $matches))->toBe(1);
    expect($matches[0])->not->toContain("'unsafe-inline'");
    $response->assertSee('nonce="'.$matches[1].'"', false);
});

test('production https responses include hsts', function () {
    $this->app->detectEnvironment(fn () => 'production');

    try {
        $this->get('https://localhost/')
            ->assertOk()
            ->assertHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    } finally {
        $this->app->detectEnvironment(fn () => 'testing');
    }
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
    $category = Category::factory()->create();
    $product = Product::factory()->create(['category_id' => $category->id]);

    $this->get('/admin/dashboard')->assertNotFound();
    $this->get('/admin/products')->assertNotFound();
    $this->get('/admin/restaurant-settings')->assertNotFound();
    $this->get('/admin/menu/create')->assertNotFound();
    $this->get("/admin/menu/{$product->id}")->assertMethodNotAllowed();
    $this->get("/admin/menu/{$product->id}/edit")->assertNotFound();
    $this->get('/admin/categories/create')->assertNotFound();
    $this->get("/admin/categories/{$category->id}")->assertMethodNotAllowed();
    $this->get("/admin/categories/{$category->id}/edit")->assertNotFound();
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
