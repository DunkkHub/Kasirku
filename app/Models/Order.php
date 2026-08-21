<?php

namespace App\Models;

use Database\Factories\OrderFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use InvalidArgumentException;

class Order extends Model
{
    /** @use HasFactory<OrderFactory> */
    use HasFactory, SoftDeletes;

    public const FULFILLMENT_TYPES = ['dine_in', 'pickup', 'delivery'];

    public const STATUSES = [
        'pending',
        'preparing',
        'ready',
        'out_for_delivery',
        'delivered',
        'completed',
        'cancelled',
    ];

    private const STATUS_TRANSITIONS = [
        'pending' => ['preparing', 'cancelled'],
        'preparing' => ['ready', 'cancelled'],
        'ready' => ['out_for_delivery', 'completed', 'cancelled'],
        'out_for_delivery' => ['delivered', 'cancelled'],
        'delivered' => [],
        'completed' => [],
        'cancelled' => [],
    ];

    protected $fillable = [
        'customer_name',
        'table_number',
        'status',
        'fulfillment_type',
        'delivery_phone',
        'delivery_address',
        'delivery_instructions',
        'subtotal_amount',
        'tax_amount',
        'delivery_fee',
        'total_amount',
        'currency',
    ];

    protected function casts(): array
    {
        return [
            'table_number' => 'integer',
            'subtotal_amount' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'delivery_fee' => 'decimal:2',
            'total_amount' => 'decimal:2',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Order $order): void {
            $order->public_id ??= (string) Str::uuid();
            $order->reference ??= 'TP-'.now()->format('ymd').'-'.Str::upper(Str::random(10));
        });
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItems::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }

    public function getTotalPriceAttribute()
    {
        return $this->orderItems->sum(function ($item) {
            return $item->subtotal;
        });
    }

    public function canTransitionTo(string $nextStatus): bool
    {
        if ($nextStatus === $this->status) {
            return true;
        }

        if (! in_array($nextStatus, self::STATUS_TRANSITIONS[$this->status] ?? [], true)) {
            return false;
        }

        if ($nextStatus === 'out_for_delivery') {
            return $this->fulfillment_type === 'delivery';
        }

        if ($nextStatus === 'completed') {
            return $this->fulfillment_type !== 'delivery';
        }

        if ($nextStatus === 'delivered') {
            return $this->fulfillment_type === 'delivery';
        }

        return true;
    }

    public function transitionTo(string $nextStatus): void
    {
        if (! in_array($nextStatus, self::STATUSES, true) || ! $this->canTransitionTo($nextStatus)) {
            throw new InvalidArgumentException("Order cannot transition from {$this->status} to {$nextStatus}.");
        }

        if ($nextStatus !== $this->status) {
            $this->update(['status' => $nextStatus]);
        }
    }
}
