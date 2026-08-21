<?php

use App\Http\Controllers\CheckoutController;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentWebhookEvent;
use App\Models\Product;

function signedMidtransPayload(Payment $payment, array $overrides = []): array
{
    $payload = array_merge([
        'order_id' => $payment->transaction_id,
        'status_code' => '200',
        'gross_amount' => number_format((float) $payment->amount, 2, '.', ''),
        'transaction_status' => 'settlement',
        'payment_type' => 'bank_transfer',
        'fraud_status' => 'accept',
    ], $overrides);
    $payload['signature_key'] = hash(
        'sha512',
        $payload['order_id'].$payload['status_code'].$payload['gross_amount'].config('services.midtrans.server_key')
    );

    return $payload;
}

test('public website checkout is disabled and cannot create orders', function () {
    $product = Product::factory()->create(['name' => 'Margherita', 'price' => 10.50]);

    $this->get('/checkout')->assertRedirect('/');

    $this->postJson('/checkout/process', [
        'customer_name' => 'Camille',
        'fulfillment_type' => 'delivery',
        'delivery_phone' => '+33 6 12 34 56 78',
        'delivery_address' => '75 rue Léon Jouhaux, Grenoble',
        'payment_method' => 'cash',
        'cart' => [
            ['product' => ['id' => $product->id], 'quantity' => 2],
        ],
    ])->assertGone()
        ->assertJsonPath('message', 'La commande en ligne est désactivée. Consultez la carte digitale et appelez le restaurant.');

    expect(Order::count())->toBe(0)
        ->and(Payment::count())->toBe(0);
});

test('public tracking rejects sequential ids and omits payment secrets and delivery details', function () {
    $order = Order::factory()->create([
        'fulfillment_type' => 'delivery',
        'table_number' => null,
        'delivery_phone' => '+33612345678',
        'delivery_address' => 'Adresse privée très précise',
    ]);
    Payment::factory()->create(['order_id' => $order->id, 'transaction_id' => 'SECRET-TRANSACTION']);

    $this->get("/order/{$order->id}/check")->assertNotFound();
    $response = $this->getJson("/order/{$order->public_id}/check");
    $response->assertOk()->assertHeader('Cache-Control', 'no-store, private');
    $response->assertJsonMissing(['transaction_id' => 'SECRET-TRANSACTION'])
        ->assertJsonMissing(['delivery_phone' => '+33612345678'])
        ->assertJsonMissing(['delivery_address' => 'Adresse privée très précise']);
});

test('midtrans webhook rejects invalid signatures', function () {
    config()->set('services.midtrans.server_key', 'server-secret');
    $order = Order::factory()->create(['status' => 'pending']);
    $payment = Payment::factory()->create([
        'order_id' => $order->id,
        'payment_method' => 'midtrans',
        'currency' => 'IDR',
        'amount' => 42,
    ]);
    $payload = signedMidtransPayload($payment);
    $payload['signature_key'] = str_repeat('0', 128);

    $this->postJson('/checkout/notification', $payload)->assertUnauthorized();
    expect($payment->fresh()->status)->toBe('pending');
});

test('midtrans webhook is amount-bound idempotent and monotonic', function () {
    config()->set('services.midtrans.server_key', 'server-secret');
    config()->set('pos.currency_precision', 2);
    $order = Order::factory()->create(['status' => 'pending']);
    $payment = Payment::factory()->create([
        'order_id' => $order->id,
        'payment_method' => 'midtrans',
        'currency' => 'IDR',
        'status' => 'pending',
        'amount' => 42.50,
        'transaction_id' => 'MIDTRANS-SAFE-1',
    ]);

    $badAmount = signedMidtransPayload($payment, ['gross_amount' => '1.00']);
    $this->postJson('/checkout/notification', $badAmount)
        ->assertUnprocessable()->assertJsonValidationErrors('gross_amount');

    $payload = signedMidtransPayload($payment);
    $this->postJson('/checkout/notification', $payload)
        ->assertOk()->assertJsonPath('duplicate', false);
    $paidAt = $payment->fresh()->paid_at;

    $this->postJson('/checkout/notification', $payload)
        ->assertOk()->assertJsonPath('duplicate', true);

    expect($payment->fresh()->status)->toBe('completed')
        ->and($payment->fresh()->paid_at->equalTo($paidAt))->toBeTrue()
        ->and(PaymentWebhookEvent::count())->toBe(1)
        ->and($order->fresh()->status)->toBe('pending');

    $lateFailure = signedMidtransPayload($payment, [
        'transaction_status' => 'expire',
        'status_code' => '407',
    ]);
    $this->postJson('/checkout/notification', $lateFailure)->assertOk();
    expect($payment->fresh()->status)->toBe('completed');
});

test('provider status reconciliation is monotonic and cancels unpaid expired orders', function () {
    $order = Order::factory()->create(['status' => 'pending']);
    $payment = Payment::factory()->create([
        'order_id' => $order->id,
        'payment_method' => 'midtrans',
        'status' => 'pending',
        'transaction_id' => 'MIDTRANS-TEST-2',
    ]);

    app(CheckoutController::class)
        ->applyTransactionStatus('expire', 'bank_transfer', 'MIDTRANS-TEST-2', null);

    expect($payment->fresh()->status)->toBe('failed')
        ->and($order->fresh()->status)->toBe('cancelled');

    app(CheckoutController::class)
        ->applyTransactionStatus('settlement', 'bank_transfer', 'MIDTRANS-TEST-2', null);
    expect($payment->fresh()->status)->toBe('failed');
});
