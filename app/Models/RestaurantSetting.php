<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RestaurantSetting extends Model
{
    protected $fillable = [
        'restaurant_name',
        'logo_path',
        'halal_badge_path',
        'show_halal_badge',
        'tagline',
        'description',
        'phone',
        'address',
        'opening_hours',
        'currency_code',
        'currency_symbol',
        'currency_symbol_position',
        'pizza_size_text',
        'instagram_url',
        'facebook_url',
        'google_maps_url',
    ];

    protected function casts(): array
    {
        return [
            'show_halal_badge' => 'boolean',
        ];
    }

    /**
     * The digital menu uses one editable restaurant profile.
     */
    public static function current(): self
    {
        return self::query()->firstOrCreate(['id' => 1], self::defaults());
    }

    /**
     * @return array<string, mixed>
     */
    public static function defaults(): array
    {
        return [
            'restaurant_name' => 'Teisseire Pizza',
            'logo_path' => '/images/teisseire-pizza-halal-logo.png',
            'halal_badge_path' => null,
            'show_halal_badge' => true,
            'tagline' => 'Nouvelle équipe, nouvelles recettes !',
            'description' => 'Découvrez les pizzas, paninis, formules, boissons et desserts de Teisseire Pizza.',
            'phone' => '06 34 61 40 47',
            'address' => '75 rue Léon Jouhaux',
            'opening_hours' => "Lundi au Dimanche\n18h00 à 22h30",
            'currency_code' => 'EUR',
            'currency_symbol' => '€',
            'currency_symbol_position' => 'after',
            'pizza_size_text' => 'Pizza Ø 33 cm',
            'instagram_url' => null,
            'facebook_url' => null,
            'google_maps_url' => 'https://maps.google.com/?q=75+rue+Leon+Jouhaux',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function publicPayload(): array
    {
        return [
            'restaurant_name' => $this->restaurant_name,
            'logo_path' => $this->logo_path,
            'halal_badge_path' => $this->halal_badge_path,
            'show_halal_badge' => $this->show_halal_badge,
            'tagline' => $this->tagline,
            'description' => $this->description,
            'phone' => $this->phone,
            'address' => $this->address,
            'opening_hours' => $this->opening_hours,
            'currency_code' => $this->currency_code,
            'currency_symbol' => $this->currency_symbol,
            'currency_symbol_position' => $this->currency_symbol_position,
            'pizza_size_text' => $this->pizza_size_text,
            'instagram_url' => $this->instagram_url,
            'facebook_url' => $this->facebook_url,
            'google_maps_url' => $this->google_maps_url,
        ];
    }
}
