<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class OrderPricingService
{
    /**
     * Calculate an authoritative quote using locked product rows.
     *
     * @param  array<int, array{product_id: string, quantity: int, notes?: ?string}>  $items
     * @return array{items: array<int, array<string, mixed>>, subtotal: string, tax: string, delivery_fee: string, total: string, subtotal_minor: int, tax_minor: int, delivery_fee_minor: int, total_minor: int}
     */
    public function quote(array $items, string $fulfillmentType): array
    {
        $productIds = collect($items)->pluck('product_id')->values();

        /** @var Collection<string, Product> $products */
        $products = Product::query()
            ->whereIn('id', $productIds)
            ->lockForUpdate()
            ->get()
            ->keyBy('id');

        if ($products->count() !== $productIds->unique()->count()) {
            throw ValidationException::withMessages([
                'cart' => 'Un ou plusieurs produits n’existent plus.',
            ]);
        }

        $quotedItems = [];
        $subtotalMinor = 0;

        foreach ($items as $index => $item) {
            $product = $products->get($item['product_id']);

            if (! $product?->is_available) {
                throw ValidationException::withMessages([
                    "cart.{$index}.product.id" => "{$product?->name} n’est plus disponible.",
                ]);
            }

            $unitPriceMinor = $this->toMinor($product->price);
            $itemSubtotalMinor = $unitPriceMinor * $item['quantity'];
            $subtotalMinor += $itemSubtotalMinor;

            $quotedItems[] = [
                'product' => $product,
                'product_id' => $product->id,
                'quantity' => $item['quantity'],
                'notes' => $item['notes'] ?? null,
                'price' => $this->fromMinor($unitPriceMinor),
                'subtotal' => $this->fromMinor($itemSubtotalMinor),
                'price_minor' => $unitPriceMinor,
                'subtotal_minor' => $itemSubtotalMinor,
            ];
        }

        $taxMinor = (int) round($subtotalMinor * (float) config('pos.tax_rate'));
        $deliveryFeeMinor = $fulfillmentType === 'delivery'
            ? $this->toMinor(config('pos.delivery_fee'))
            : 0;
        $totalMinor = $subtotalMinor + $taxMinor + $deliveryFeeMinor;

        return [
            'items' => $quotedItems,
            'subtotal' => $this->fromMinor($subtotalMinor),
            'tax' => $this->fromMinor($taxMinor),
            'delivery_fee' => $this->fromMinor($deliveryFeeMinor),
            'total' => $this->fromMinor($totalMinor),
            'subtotal_minor' => $subtotalMinor,
            'tax_minor' => $taxMinor,
            'delivery_fee_minor' => $deliveryFeeMinor,
            'total_minor' => $totalMinor,
        ];
    }

    public function toMinor(int|float|string|null $amount): int
    {
        return (int) round(((float) $amount) * (10 ** $this->precision()));
    }

    public function fromMinor(int $amount): string
    {
        $precision = $this->precision();

        return number_format($amount / (10 ** $precision), $precision, '.', '');
    }

    private function precision(): int
    {
        return max(0, min(2, (int) config('pos.currency_precision', 2)));
    }
}
