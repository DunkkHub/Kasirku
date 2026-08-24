<?php

use App\Models\RestaurantSetting;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('guests cannot access restaurant settings', function () {
    $this->get('/admin/settings')->assertRedirect('/admin/login');
});

test('admin can view restaurant settings', function () {
    $this->actingAs(User::factory()->admin()->create());
    RestaurantSetting::current()->update(['restaurant_name' => 'Teisseire Pizza']);

    $this->get('/admin/settings')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/restaurant-settings/edit')
            ->where('settings.restaurant_name', 'Teisseire Pizza')
        );
});

test('admin can update restaurant settings and upload a logo', function () {
    Storage::fake('public');
    $this->actingAs(User::factory()->admin()->create());

    $response = $this->post('/admin/settings', [
        '_method' => 'PUT',
        'restaurant_name' => 'Teisseire Pizza Grenoble',
        'tagline' => 'Nouvelle équipe, nouvelles recettes !',
        'description' => 'Menu digital',
        'phone' => '06 34 61 40 47',
        'address' => '75 rue Léon Jouhaux',
        'opening_hours' => "Lundi au Dimanche\n18h00 à 22h30",
        'currency_code' => 'EUR',
        'currency_symbol' => '€',
        'currency_symbol_position' => 'after',
        'pizza_size_text' => 'Pizza Ø 33 cm',
        'instagram_url' => 'https://instagram.com/teisseirepizza',
        'facebook_url' => 'https://facebook.com/teisseirepizza',
        'google_maps_url' => 'https://maps.google.com/?q=75+rue+Leon+Jouhaux',
        'show_halal_badge' => true,
        'logo' => UploadedFile::fake()->image('logo.png'),
    ]);

    $response->assertRedirect(route('restaurant-settings.edit'));
    $settings = RestaurantSetting::current();

    expect($settings->restaurant_name)->toBe('Teisseire Pizza Grenoble')
        ->and($settings->currency_symbol_position)->toBe('after')
        ->and($settings->show_halal_badge)->toBeTrue()
        ->and($settings->logo_path)->toStartWith('/storage/restaurant/');
});

test('restaurant settings reject unsafe urls and unsafe logo uploads', function () {
    Storage::fake('public');
    $this->actingAs(User::factory()->admin()->create());

    $payload = [
        'restaurant_name' => 'Teisseire Pizza',
        'currency_code' => 'EUR',
        'currency_symbol' => '€',
        'currency_symbol_position' => 'after',
    ];

    $this->from('/admin/settings')->post('/admin/settings', [
        ...$payload,
        '_method' => 'PUT',
        'instagram_url' => 'javascript:alert(1)',
    ])->assertSessionHasErrors('instagram_url');

    $this->from('/admin/settings')->post('/admin/settings', [
        ...$payload,
        '_method' => 'PUT',
        'logo' => UploadedFile::fake()->create('logo.php.jpg', 1, 'application/x-php'),
    ])->assertSessionHasErrors('logo');
});
