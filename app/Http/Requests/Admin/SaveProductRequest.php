<?php

namespace App\Http\Requests\Admin;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('access-admin') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $product = $this->route('product');

        return [
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:1200'],
            'ingredients' => ['nullable', 'string', 'max:1200'],
            'category_id' => ['required', 'integer', Rule::exists('categories', 'id')],
            'price' => ['required', 'numeric', 'decimal:0,2', 'min:0', 'max:9999.99'],
            'is_available' => ['sometimes', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'photos' => ['nullable', 'array', 'max:6'],
            'photos.*' => [
                'image',
                'mimes:jpg,jpeg,png,webp',
                'mimetypes:image/jpeg,image/png,image/webp',
                'max:4096',
                'dimensions:max_width=4096,max_height=4096',
            ],
            'remove_photos' => ['nullable', 'array', 'max:6'],
            'remove_photos.*' => [
                'integer',
                'distinct',
                Rule::exists('product_photos', 'id')->where('product_id', $product instanceof Product ? $product->id : null),
            ],
        ];
    }
}
