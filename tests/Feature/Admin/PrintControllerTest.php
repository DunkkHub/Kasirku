<?php

use App\Models\Order;
use App\Models\User;

test('receipt printing requires an administrator and an authoritative order route', function () {
    $order = Order::factory()->create();

    $this->post("/admin/orders/{$order->id}/print")->assertRedirect('/login');

    $this->actingAs(User::factory()->create())
        ->post("/admin/orders/{$order->id}/print")
        ->assertForbidden();
});

test('legacy client-supplied print payload endpoint is unavailable', function () {
    $this->actingAs(User::factory()->admin()->create())
        ->postJson('/admin/print', [
            'items' => [['name' => 'Injected', 'price' => 0.01]],
            'text' => "\x1b@raw printer controls",
        ])
        ->assertNotFound();
});

test('printing fails safely when no allowlisted printer is configured', function () {
    config()->set('pos.printer_device', null);
    $order = Order::factory()->create();

    $this->actingAs(User::factory()->admin()->create())
        ->postJson("/admin/orders/{$order->id}/print", [
            'items' => [['name' => 'Ignored client item', 'price' => 0.01]],
        ])
        ->assertStatus(503)
        ->assertJsonMissing(['message' => 'Ignored client item']);
});
