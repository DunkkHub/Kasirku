<?php

namespace App\Http\Requests\Admin;

use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRestaurantSettingsRequest extends FormRequest
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
        $safeUrl = $this->safeHttpUrlRule();

        return [
            'restaurant_name' => ['required', 'string', 'max:120'],
            'tagline' => ['nullable', 'string', 'max:180'],
            'description' => ['nullable', 'string', 'max:1200'],
            'phone' => ['nullable', 'string', 'max:40'],
            'address' => ['nullable', 'string', 'max:500'],
            'opening_hours' => ['nullable', 'string', 'max:500'],
            'currency_code' => ['required', 'string', 'regex:/\A[A-Za-z]{3}\z/'],
            'currency_symbol' => ['required', 'string', 'max:8'],
            'currency_symbol_position' => ['required', Rule::in(['before', 'after'])],
            'pizza_size_text' => ['nullable', 'string', 'max:80'],
            'instagram_url' => ['nullable', 'url', 'max:255', $safeUrl],
            'facebook_url' => ['nullable', 'url', 'max:255', $safeUrl],
            'google_maps_url' => ['nullable', 'url', 'max:255', $safeUrl],
            'show_halal_badge' => ['sometimes', 'boolean'],
            'logo' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'mimetypes:image/jpeg,image/png,image/webp',
                'max:4096',
                'dimensions:max_width=4096,max_height=4096',
            ],
            'halal_badge' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'mimetypes:image/jpeg,image/png,image/webp',
                'max:2048',
                'dimensions:max_width=2048,max_height=2048',
            ],
            'remove_logo' => ['sometimes', 'boolean'],
            'remove_halal_badge' => ['sometimes', 'boolean'],
        ];
    }

    private function safeHttpUrlRule(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail): void {
            if (! filled($value)) {
                return;
            }

            $scheme = parse_url((string) $value, PHP_URL_SCHEME);

            if (! is_string($scheme) || ! in_array(strtolower($scheme), ['http', 'https'], true)) {
                $fail('Le champ :attribute doit utiliser une URL http ou https.');
            }
        };
    }
}
