<?php

use App\Models\User;

test('public registration is disabled by default', function () {
    $this->get('/register')->assertNotFound();
    $this->post('/register', [])->assertNotFound();
});

test('registration can be explicitly enabled and creates a non-admin account', function () {
    config()->set('auth.registration_enabled', true);

    $this->get('/register')->assertOk();
    $response = $this->post('/register', [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('home', absolute: false));
    expect(User::where('email', 'test@example.com')->firstOrFail()->is_admin)->toBeFalse();
});
