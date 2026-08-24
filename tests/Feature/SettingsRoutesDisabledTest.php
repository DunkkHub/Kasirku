<?php

use App\Models\User;

test('legacy generic account settings routes are not exposed', function () {
    $user = User::factory()->admin()->create();

    $this->actingAs($user)->get('/settings')->assertNotFound();
    $this->actingAs($user)->get('/settings/profile')->assertNotFound();
    $this->actingAs($user)->patch('/settings/profile', [])->assertNotFound();
    $this->actingAs($user)->delete('/settings/profile', [])->assertNotFound();
    $this->actingAs($user)->get('/settings/password')->assertNotFound();
    $this->actingAs($user)->put('/settings/password', [])->assertNotFound();
    $this->actingAs($user)->get('/settings/appearance')->assertNotFound();
});
