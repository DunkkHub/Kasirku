<?php

namespace App\Http\Middleware;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $this->safeUser($request->user()),
            ],
            'ziggy' => fn (): array => $this->safeZiggy($request),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function safeUser(?User $user): ?array
    {
        if (! $user) {
            return null;
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar' => null,
            'is_admin' => $user->is_admin,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function safeZiggy(Request $request): array
    {
        $ziggy = (new Ziggy)->toArray();
        $user = $request->user();

        if ($user?->can('access-admin')) {
            $patterns = [
                'home',
                'menu',
                'login',
                'logout',
                'admin.dashboard',
                'products.*',
                'categories.*',
                'restaurant-settings.*',
                'verification.*',
                'password.*',
            ];
        } elseif ($user) {
            $patterns = [
                'home',
                'menu',
                'login',
                'logout',
                'verification.*',
                'password.*',
            ];
        } else {
            $patterns = [
                'home',
                'menu',
                'login',
                'password.request',
                'password.email',
                'password.reset',
                'password.store',
            ];
        }

        $ziggy['routes'] = collect($ziggy['routes'] ?? [])
            ->filter(fn (mixed $route, string $name): bool => collect($patterns)->contains(fn (string $pattern): bool => Str::is($pattern, $name)))
            ->all();

        return [
            ...$ziggy,
            'location' => $request->url(),
        ];
    }
}
