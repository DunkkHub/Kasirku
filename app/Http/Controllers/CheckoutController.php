<?php

namespace App\Http\Controllers;

use App\Http\Requests\MidtransNotificationRequest;
use App\Models\Order;
use App\Models\OrderItems;
use App\Models\Payment;
use App\Models\PaymentWebhookEvent;
use App\Services\OrderPricingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use Throwable;

class CheckoutController extends Controller
{
    public function __construct(
        private readonly OrderPricingService $pricing,
    ) {}

    public function index(): RedirectResponse
    {
        return redirect()->route('home');
    }

    public function processCheckout(): JsonResponse
    {
        return response()->json([
            'message' => 'La commande en ligne est désactivée. Consultez la carte digitale et appelez le restaurant.',
        ], 410);
    }

    public function paymentFinish(Request $request): Response
    {
        $payment = Payment::query()
            ->with('order')
            ->where('transaction_id', (string) $request->query('order_id'))
            ->firstOrFail();

        return Inertia::render('customer/payment/finish', [
            'order_id' => $payment->order->public_id,
            'order_reference' => $payment->order->reference,
            'status' => $payment->status,
        ]);
    }

    public function paymentUnfinish(): Response
    {
        return Inertia::render('customer/payment/unfinish');
    }

    public function paymentError(): Response
    {
        return Inertia::render('customer/payment/error');
    }

    public function paymentNotification(MidtransNotificationRequest $request): JsonResponse
    {
        $payload = $request->validated();
        $serverKey = (string) config('services.midtrans.server_key');
        $expectedSignature = hash(
            'sha512',
            $payload['order_id'].$payload['status_code'].$request->input('gross_amount').$serverKey
        );

        if ($serverKey === '' || ! hash_equals($expectedSignature, $payload['signature_key'])) {
            Log::warning('Rejected Midtrans notification with invalid signature', [
                'order_id' => $payload['order_id'],
                'ip' => $request->ip(),
            ]);

            return response()->json(['message' => 'Signature invalide.'], 401);
        }

        try {
            $duplicate = DB::transaction(function () use ($payload): bool {
                $payment = Payment::query()
                    ->with('order')
                    ->where('transaction_id', $payload['order_id'])
                    ->lockForUpdate()
                    ->firstOrFail();

                if ($payment->payment_method !== 'midtrans') {
                    throw ValidationException::withMessages([
                        'order_id' => 'Cette commande n’utilise pas Midtrans.',
                    ]);
                }

                if ($payment->currency !== 'IDR') {
                    throw ValidationException::withMessages([
                        'order_id' => 'La devise de cette commande n’est pas compatible avec Midtrans.',
                    ]);
                }

                if ($this->pricing->toMinor($payload['gross_amount']) !== $this->pricing->toMinor($payment->amount)) {
                    throw ValidationException::withMessages([
                        'gross_amount' => 'Le montant notifié ne correspond pas à la commande.',
                    ]);
                }

                $eventKey = hash('sha256', implode('|', [
                    'midtrans',
                    $payload['order_id'],
                    $payload['transaction_status'],
                    $payload['status_code'],
                    $this->pricing->toMinor($payload['gross_amount']),
                    $payload['fraud_status'] ?? '',
                ]));

                if (PaymentWebhookEvent::query()->where('event_key', $eventKey)->exists()) {
                    return true;
                }

                $this->applyStatusToPayment(
                    $payment,
                    $payload['transaction_status'],
                    $payload['payment_type'] ?? null,
                    $payload['fraud_status'] ?? null,
                );

                PaymentWebhookEvent::create([
                    'payment_id' => $payment->id,
                    'provider' => 'midtrans',
                    'event_key' => $eventKey,
                    'payload' => Arr::except($payload, ['signature_key']),
                    'processed_at' => now(),
                ]);

                return false;
            }, 3);

            return response()->json(['status' => 'success', 'duplicate' => $duplicate]);
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (Throwable $exception) {
            $errorId = (string) str()->uuid();
            Log::error('Midtrans notification failed', ['error_id' => $errorId, 'exception' => $exception]);

            return response()->json(['message' => 'Notification non traitée.', 'error_id' => $errorId], 500);
        }
    }

    /**
     * Retained as a small domain seam for tests and reconciliation jobs.
     */
    public function applyTransactionStatus(
        string $transactionStatus,
        ?string $paymentType,
        string $orderId,
        ?string $fraudStatus,
    ): void {
        DB::transaction(function () use ($transactionStatus, $paymentType, $orderId, $fraudStatus): void {
            $payment = Payment::query()
                ->with('order')
                ->where('transaction_id', $orderId)
                ->lockForUpdate()
                ->firstOrFail();

            $this->applyStatusToPayment($payment, $transactionStatus, $paymentType, $fraudStatus);
        }, 3);
    }

    public function orderStatus(string $publicId): SymfonyResponse
    {
        $order = $this->findPublicOrder($publicId);

        $response = Inertia::render('customer/order/status', [
            'order' => $this->publicOrderPayload($order),
        ])->toResponse(request());
        $response->headers->set('Cache-Control', 'no-store, private');

        return $response;
    }

    public function checkOrderStatus(string $publicId): JsonResponse
    {
        return response()
            ->json(['order' => $this->publicOrderPayload($this->findPublicOrder($publicId))])
            ->header('Cache-Control', 'no-store, private');
    }

    private function applyStatusToPayment(
        Payment $payment,
        string $transactionStatus,
        ?string $paymentType,
        ?string $fraudStatus,
    ): void {
        $nextStatus = match (true) {
            $transactionStatus === 'settlement' => 'completed',
            $transactionStatus === 'capture' && $paymentType === 'credit_card' && in_array($fraudStatus, [null, 'accept'], true) => 'completed',
            $transactionStatus === 'capture' && $fraudStatus === 'deny' => 'failed',
            in_array($transactionStatus, ['deny', 'expire', 'cancel'], true) => 'failed',
            default => 'pending',
        };

        // Completed and failed are terminal. Replays or out-of-order provider
        // events cannot reverse a terminal local payment state.
        if (in_array($payment->status, ['completed', 'failed'], true)) {
            return;
        }

        $payment->update([
            'status' => $nextStatus,
            'paid_at' => $nextStatus === 'completed' ? now() : null,
        ]);

        if ($nextStatus === 'failed' && $payment->order->status === 'pending') {
            $payment->order->transitionTo('cancelled');
        }
    }

    private function findPublicOrder(string $publicId): Order
    {
        return Order::query()
            ->with(['orderItems.product.photos', 'payment'])
            ->where('public_id', $publicId)
            ->firstOrFail();
    }

    private function publicOrderPayload(Order $order): array
    {
        return [
            'public_id' => $order->public_id,
            'reference' => $order->reference,
            'customer_name' => $order->customer_name,
            'fulfillment_type' => $order->fulfillment_type,
            'table_number' => $order->table_number,
            'status' => $order->status,
            'subtotal_amount' => (float) $order->subtotal_amount,
            'tax_amount' => (float) $order->tax_amount,
            'delivery_fee' => (float) $order->delivery_fee,
            'total_amount' => (float) $order->total_amount,
            'currency' => $order->currency,
            'created_at' => $order->created_at,
            'order_items' => $order->orderItems->map(fn (OrderItems $item): array => [
                'product' => [
                    'id' => $item->product_id,
                    'name' => $item->product_name,
                    'photos' => $item->product?->photos->map(fn ($photo): array => [
                        'url' => $photo->url,
                    ])->values(),
                ],
                'quantity' => $item->quantity,
                'notes' => $item->notes,
                'price' => (float) $item->price,
                'subtotal' => (float) $item->subtotal,
            ])->values(),
            'payment' => $order->payment ? [
                'method' => $order->payment->payment_method,
                'status' => $order->payment->status,
                'paid_at' => $order->payment->paid_at,
            ] : null,
        ];
    }
}
