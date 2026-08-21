<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOrderRequest;
use App\Http\Requests\UpdateOrderRequest;
use App\Http\Requests\UpdateOrderStatusRequest;
use App\Models\Order;
use App\Models\OrderItems;
use App\Models\Payment;
use App\Models\Product;
use App\Services\OrderPricingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class OrderController extends Controller
{
    public function __construct(private readonly OrderPricingService $pricing) {}

    public function index(Request $request): Response|JsonResponse
    {
        $query = Order::query()
            ->with(['orderItems.product.photos', 'payment'])
            ->latest();

        if (in_array($request->string('status')->toString(), Order::STATUSES, true)) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('search')) {
            $search = mb_substr($request->string('search')->toString(), 0, 80);
            $query->where(function ($builder) use ($search): void {
                $builder->where('customer_name', 'like', "%{$search}%")
                    ->orWhere('reference', 'like', "%{$search}%");
            });
        }

        $orders = $query->paginate(10)->through(fn (Order $order): array => [
            'id' => $order->id,
            'public_id' => $order->public_id,
            'reference' => $order->reference,
            'customer_name' => $order->customer_name,
            'customer_phone' => $order->delivery_phone,
            'customer_email' => null,
            'total_amount' => (float) $order->total_amount,
            'subtotal_amount' => (float) $order->subtotal_amount,
            'tax_amount' => (float) $order->tax_amount,
            'delivery_fee' => (float) $order->delivery_fee,
            'currency' => $order->currency,
            'status' => $order->status,
            'order_type' => $order->fulfillment_type,
            'fulfillment_type' => $order->fulfillment_type,
            'table_number' => $order->table_number,
            'delivery_address' => $order->delivery_address,
            'delivery_instructions' => $order->delivery_instructions,
            'created_at' => $order->created_at,
            'order_items' => $order->orderItems->map(fn (OrderItems $item): array => [
                'id' => $item->id,
                'product' => [
                    'id' => $item->product_id,
                    'name' => $item->product_name,
                    'photos' => $item->product?->photos->map(fn ($photo): array => [
                        'id' => $photo->id,
                        'url' => $photo->url,
                    ]) ?? [],
                ],
                'quantity' => $item->quantity,
                'notes' => $item->notes,
                'price' => (float) $item->price,
                'subtotal' => (float) $item->subtotal,
            ]),
            'payment' => $order->payment ? [
                'id' => $order->payment->id,
                'method' => $order->payment->payment_method,
                'status' => $order->payment->status,
                'amount' => (float) $order->payment->amount,
                'paid_at' => $order->payment->paid_at,
            ] : null,
        ]);

        $products = Product::query()->with('photos')->orderBy('sort_order')->get();
        $props = [
            'orders' => $orders,
            'products' => $products,
            'filters' => $request->only(['status', 'search']),
            'order_statuses' => Order::STATUSES,
        ];

        if (! $request->header('X-Inertia') && ($request->wantsJson() || $request->ajax())) {
            return response()->json($props);
        }

        return Inertia::render('admin/orders/index', $props);
    }

    public function store(StoreOrderRequest $request): JsonResponse|RedirectResponse
    {
        $validated = $request->validated();

        [$order] = DB::transaction(function () use ($request, $validated): array {
            $quote = $this->pricing->quote($request->normalizedItems(), $validated['fulfillment_type']);

            $order = Order::create([
                'customer_name' => trim($validated['customer_name']),
                'table_number' => $validated['fulfillment_type'] === 'dine_in' ? $validated['table_number'] : null,
                'fulfillment_type' => $validated['fulfillment_type'],
                'delivery_phone' => $validated['delivery_phone'] ?? null,
                'delivery_address' => $validated['delivery_address'] ?? null,
                'delivery_instructions' => $validated['delivery_instructions'] ?? null,
                'status' => 'pending',
                'subtotal_amount' => $quote['subtotal'],
                'tax_amount' => $quote['tax'],
                'delivery_fee' => $quote['delivery_fee'],
                'total_amount' => $quote['total'],
                'currency' => config('pos.currency'),
            ]);

            foreach ($quote['items'] as $item) {
                OrderItems::create([
                    'order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'product_name' => $item['product']->name,
                    'quantity' => $item['quantity'],
                    'notes' => $item['notes'],
                    'price' => $item['price'],
                    'subtotal' => $item['subtotal'],
                ]);
            }

            Payment::create([
                'order_id' => $order->id,
                'amount' => $quote['total'],
                'currency' => config('pos.currency'),
                'payment_method' => $validated['payment_method'],
                'status' => 'completed',
                'transaction_id' => 'ADMIN-'.$order->reference,
                'paid_at' => now(),
            ]);

            return [$order, $quote];
        }, 3);

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => 'Commande créée.',
                'order_internal_id' => $order->id,
                'order_id' => $order->public_id,
                'public_id' => $order->public_id,
                'order_reference' => $order->reference,
            ]);
        }

        return redirect()->route('orders.index')->with('success', 'Commande créée.');
    }

    public function update(UpdateOrderRequest $request, Order $order): JsonResponse|RedirectResponse
    {
        $this->transition($order, $request->validated('status'));
        $order->update(['customer_name' => trim($request->validated('customer_name'))]);

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => 'Commande mise à jour.',
                'order_id' => $order->public_id,
            ]);
        }

        return redirect()->route('orders.index')->with('success', 'Commande mise à jour.');
    }

    public function destroy(Request $request, Order $order): JsonResponse|RedirectResponse
    {
        abort_unless((bool) $request->user()?->is_admin, 403);

        if ($order->status !== 'cancelled') {
            throw ValidationException::withMessages([
                'status' => 'Seules les commandes annulées peuvent être supprimées.',
            ]);
        }

        $order->delete();

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json(['success' => true, 'message' => 'Commande supprimée.']);
        }

        return redirect()->route('orders.index')->with('success', 'Commande supprimée.');
    }

    public function updateStatus(UpdateOrderStatusRequest $request, Order $order): JsonResponse
    {
        $this->transition($order, $request->validated('status'));

        return response()->json([
            'success' => true,
            'message' => 'Statut mis à jour.',
            'status' => $order->fresh()->status,
        ]);
    }

    private function transition(Order $order, string $nextStatus): void
    {
        try {
            DB::transaction(function () use ($order, $nextStatus): void {
                $lockedOrder = Order::query()->whereKey($order->id)->lockForUpdate()->firstOrFail();
                $lockedOrder->transitionTo($nextStatus);

                $payment = Payment::query()->where('order_id', $lockedOrder->id)->lockForUpdate()->first();
                if (! $payment || $payment->status !== 'pending') {
                    return;
                }

                $cashCompleted = $nextStatus === 'completed'
                    && in_array($payment->payment_method, ['pay_at_counter', 'cash', 'card', 'digital'], true);
                $deliveryPaid = $nextStatus === 'delivered'
                    && $payment->payment_method === 'cash_on_delivery';

                if ($cashCompleted || $deliveryPaid) {
                    $payment->update(['status' => 'completed', 'paid_at' => now()]);
                } elseif ($nextStatus === 'cancelled') {
                    $payment->update(['status' => 'failed', 'paid_at' => null]);
                }
            }, 3);
        } catch (InvalidArgumentException) {
            throw ValidationException::withMessages([
                'status' => "Transition de statut non autorisée vers {$nextStatus}.",
            ]);
        }
    }
}
