<?php

namespace App\Http\Requests;

use App\Models\Order;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->is_admin;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'fulfillment_type' => $this->input('fulfillment_type', $this->filled('table_number') ? 'dine_in' : 'pickup'),
        ]);
    }

    public function rules(): array
    {
        $fulfillmentType = (string) $this->input('fulfillment_type');

        return [
            'customer_name' => ['required', 'string', 'max:120'],
            'fulfillment_type' => ['required', Rule::in(Order::FULFILLMENT_TYPES)],
            'table_number' => [
                Rule::requiredIf($fulfillmentType === 'dine_in'),
                Rule::prohibitedIf($fulfillmentType !== 'dine_in'),
                'nullable',
                'integer',
                'min:1',
                'max:999',
            ],
            'delivery_phone' => [
                Rule::requiredIf($fulfillmentType === 'delivery'),
                Rule::prohibitedIf($fulfillmentType !== 'delivery'),
                'nullable',
                'string',
                'max:30',
                'regex:/^[0-9+().\-\s]+$/',
            ],
            'delivery_address' => [
                Rule::requiredIf($fulfillmentType === 'delivery'),
                Rule::prohibitedIf($fulfillmentType !== 'delivery'),
                'nullable',
                'string',
                'min:8',
                'max:500',
            ],
            'delivery_instructions' => [
                Rule::prohibitedIf($fulfillmentType !== 'delivery'),
                'nullable',
                'string',
                'max:500',
            ],
            'status' => ['nullable', Rule::in(Order::STATUSES)],
            'items' => ['required', 'array', 'min:1', 'max:30'],
            'items.*.product_id' => ['required', 'uuid', 'distinct', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:50'],
            'items.*.notes' => ['nullable', 'string', 'max:255'],
            'payment_method' => ['required', Rule::in(['cash', 'card', 'digital'])],
        ];
    }

    public function normalizedItems(): array
    {
        return collect($this->validated('items'))->map(fn (array $item): array => [
            'product_id' => $item['product_id'],
            'quantity' => $item['quantity'],
            'notes' => $item['notes'] ?? null,
        ])->all();
    }
}
