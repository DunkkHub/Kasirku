<?php

namespace Database\Factories;

use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'table_number' => fake()->numberBetween(1, 20),
            'status' => 'pending',
            'customer_name' => fake()->name(),
            'fulfillment_type' => 'dine_in',
            'delivery_phone' => null,
            'delivery_address' => null,
            'delivery_instructions' => null,
            'subtotal_amount' => 0,
            'tax_amount' => 0,
            'delivery_fee' => 0,
            'total_amount' => 0,
            'currency' => config('pos.currency', 'EUR'),
        ];
    }
}
