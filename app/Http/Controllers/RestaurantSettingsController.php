<?php

namespace App\Http\Controllers;

use App\Http\Requests\Admin\UpdateRestaurantSettingsRequest;
use App\Models\RestaurantSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class RestaurantSettingsController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('admin/restaurant-settings/edit', [
            'settings' => RestaurantSetting::current()->publicPayload(),
        ]);
    }

    public function update(UpdateRestaurantSettingsRequest $request): RedirectResponse
    {
        $settings = RestaurantSetting::current();
        $validated = $request->validated();

        $filesToDelete = [];

        if ($request->boolean('remove_logo')) {
            $filesToDelete[] = $this->storagePathFromUrl((string) $settings->logo_path, 'restaurant');
            $settings->logo_path = null;
        }

        if ($request->boolean('remove_halal_badge')) {
            $filesToDelete[] = $this->storagePathFromUrl((string) $settings->halal_badge_path, 'restaurant');
            $settings->halal_badge_path = null;
        }

        if ($request->hasFile('logo')) {
            $filesToDelete[] = $this->storagePathFromUrl((string) $settings->logo_path, 'restaurant');
            $settings->logo_path = Storage::url($request->file('logo')->store('restaurant', 'public'));
        }

        if ($request->hasFile('halal_badge')) {
            $filesToDelete[] = $this->storagePathFromUrl((string) $settings->halal_badge_path, 'restaurant');
            $settings->halal_badge_path = Storage::url($request->file('halal_badge')->store('restaurant', 'public'));
        }

        $settings->fill([
            'restaurant_name' => trim($validated['restaurant_name']),
            'tagline' => filled($validated['tagline'] ?? null) ? trim($validated['tagline']) : null,
            'description' => filled($validated['description'] ?? null) ? trim($validated['description']) : null,
            'phone' => filled($validated['phone'] ?? null) ? trim($validated['phone']) : null,
            'address' => filled($validated['address'] ?? null) ? trim($validated['address']) : null,
            'opening_hours' => filled($validated['opening_hours'] ?? null) ? trim($validated['opening_hours']) : null,
            'currency_code' => strtoupper($validated['currency_code']),
            'currency_symbol' => trim($validated['currency_symbol']),
            'currency_symbol_position' => $validated['currency_symbol_position'],
            'pizza_size_text' => filled($validated['pizza_size_text'] ?? null) ? trim($validated['pizza_size_text']) : null,
            'instagram_url' => $validated['instagram_url'] ?? null,
            'facebook_url' => $validated['facebook_url'] ?? null,
            'google_maps_url' => $validated['google_maps_url'] ?? null,
            'show_halal_badge' => (bool) ($validated['show_halal_badge'] ?? false),
        ])->save();

        Storage::disk('public')->delete(array_filter($filesToDelete));

        return redirect()->route('restaurant-settings.edit')->with('success', 'Paramètres du restaurant enregistrés.');
    }

    private function storagePathFromUrl(string $url, string $directory): ?string
    {
        $path = parse_url($url, PHP_URL_PATH);
        $prefix = '/storage/'.$directory.'/';

        if (! is_string($path) || ! str_starts_with($path, $prefix)) {
            return null;
        }

        return str_replace('/storage/', '', $path);
    }
}
