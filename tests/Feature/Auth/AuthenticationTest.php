<?php

use App\Models\User;

test('login screen can be rendered', function () {
    $this->get('/login')->assertRedirect('/admin/login');

    $response = $this->get('/admin/login');

    $response->assertStatus(200);
});

test('non admin users cannot authenticate through the admin login screen', function () {
    $user = User::factory()->withTestPassword()->create();

    $this->post('/admin/login', [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $this->assertGuest();
});

test('users can not authenticate with invalid password', function () {
    $user = User::factory()->withTestPassword()->create();

    $this->post('/admin/login', [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $this->assertGuest();
});

test('users can logout', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('logout'));

    $this->assertGuest();
    $response->assertRedirect('/');
});

test('administrators are redirected to the dashboard after login', function () {
    $user = User::factory()->admin()->withTestPassword()->create();

    $response = $this->post('/admin/login', ['email' => $user->email, 'password' => 'password']);

    $response->assertRedirect(route('admin.dashboard', absolute: false));
});
