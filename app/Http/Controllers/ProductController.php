<?php

namespace App\Http\Controllers;

use App\Http\Requests\Admin\SaveProductRequest;
use App\Http\Requests\Admin\ToggleProductAvailabilityRequest;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductPhotos;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class ProductController extends Controller
{
    public function index(Request $request): Response|JsonResponse
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:80'],
            'category' => ['nullable', 'regex:/\A(all|\d+)\z/'],
            'availability' => ['nullable', Rule::in(['all', 'available', 'unavailable'])],
        ]);

        $query = Product::query()
            ->with(['category', 'photos'])
            ->when(filled($filters['search'] ?? null), function ($query) use ($filters): void {
                $search = $filters['search'];
                $query->where(function ($builder) use ($search): void {
                    $builder->where('name', 'like', "%{$search}%")
                        ->orWhere('ingredients', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhereHas('category', fn ($category) => $category->where('name', 'like', "%{$search}%"));
                });
            })
            ->when(filled($filters['category'] ?? null) && $filters['category'] !== 'all', function ($query) use ($filters): void {
                $query->where('category_id', (int) $filters['category']);
            })
            ->when(($filters['availability'] ?? null) === 'available', fn ($query) => $query->where('is_available', true))
            ->when(($filters['availability'] ?? null) === 'unavailable', fn ($query) => $query->where('is_available', false))
            ->orderBy(
                Category::query()
                    ->select('sort_order')
                    ->whereColumn('categories.id', 'products.category_id')
                    ->limit(1)
            )
            ->orderBy('sort_order')
            ->orderBy('name');

        $products = $query->paginate(200)->withQueryString();

        $categories = Category::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $props = [
            'products' => $products->items(),
            'categories' => $categories,
            'filters' => $filters,
            'pagination' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
                'has_more_pages' => $products->hasMorePages(),
            ],
        ];

        if (! $request->header('X-Inertia') && ($request->wantsJson() || $request->ajax())) {
            return response()->json($props);
        }

        return Inertia::render('admin/products/index', $props);
    }

    public function create(): never
    {
        abort(404, 'Page introuvable.');
    }

    public function store(SaveProductRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $storedPaths = [];

        try {
            DB::transaction(function () use ($request, $validated, &$storedPaths): void {
                $product = Product::create([
                    'name' => trim($validated['name']),
                    'description' => filled($validated['description'] ?? null) ? trim($validated['description']) : null,
                    'ingredients' => filled($validated['ingredients'] ?? null) ? trim($validated['ingredients']) : null,
                    'category_id' => $validated['category_id'],
                    'price' => $validated['price'],
                    'is_available' => (bool) ($validated['is_available'] ?? true),
                    'sort_order' => (int) ($validated['sort_order'] ?? 0),
                ]);

                foreach ($request->file('photos', []) as $index => $photo) {
                    $storedPaths[] = $photo->store('products', 'public');
                    ProductPhotos::create([
                        'product_id' => $product->id,
                        'url' => Storage::url($storedPaths[array_key_last($storedPaths)]),
                        'is_primary' => $index === 0,
                    ]);
                }
            }, 3);
        } catch (Throwable $exception) {
            Storage::disk('public')->delete($storedPaths);
            throw $exception;
        }

        return redirect()->route('products.index')->with('success', 'Plat ajouté à la carte.');
    }

    public function show(Product $product): never
    {
        abort(404, 'Page introuvable.');
    }

    public function edit(Product $product): never
    {
        abort(404, 'Page introuvable.');
    }

    public function update(SaveProductRequest $request, Product $product): RedirectResponse
    {
        $validated = $request->validated();
        $removeIds = collect($validated['remove_photos'] ?? []);
        $remainingCount = $product->photos()->whereNotIn('id', $removeIds)->count();

        if ($remainingCount + count($request->file('photos', [])) > 6) {
            throw ValidationException::withMessages(['photos' => 'Un plat peut avoir au maximum 6 photos.']);
        }

        $storedPaths = [];
        $filesToDelete = [];

        try {
            DB::transaction(function () use ($request, $validated, $product, $removeIds, &$storedPaths, &$filesToDelete): void {
                $product->update([
                    'name' => trim($validated['name']),
                    'description' => filled($validated['description'] ?? null) ? trim($validated['description']) : null,
                    'ingredients' => filled($validated['ingredients'] ?? null) ? trim($validated['ingredients']) : null,
                    'category_id' => $validated['category_id'],
                    'price' => $validated['price'],
                    'is_available' => (bool) ($validated['is_available'] ?? $product->is_available),
                    'sort_order' => (int) ($validated['sort_order'] ?? 0),
                ]);

                foreach ($product->photos()->whereIn('id', $removeIds)->get() as $photo) {
                    $file = $this->storagePathFromUrl($photo->url, 'products');
                    if ($file) {
                        $filesToDelete[] = $file;
                    }
                    $photo->delete();
                }

                $hasPrimary = $product->photos()->where('is_primary', true)->exists();
                foreach ($request->file('photos', []) as $photo) {
                    $storedPaths[] = $photo->store('products', 'public');
                    ProductPhotos::create([
                        'product_id' => $product->id,
                        'url' => Storage::url($storedPaths[array_key_last($storedPaths)]),
                        'is_primary' => ! $hasPrimary,
                    ]);
                    $hasPrimary = true;
                }

                if (! $hasPrimary && ($first = $product->photos()->first())) {
                    $first->update(['is_primary' => true]);
                }
            }, 3);
        } catch (Throwable $exception) {
            Storage::disk('public')->delete($storedPaths);
            throw $exception;
        }

        Storage::disk('public')->delete($filesToDelete);

        return redirect()->route('products.index')->with('success', 'Plat mis à jour.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        $product->update(['is_available' => false]);
        $product->delete();

        return redirect()->route('products.index')->with('success', 'Plat supprimé de la carte.');
    }

    public function toggleAvailability(ToggleProductAvailabilityRequest $request, Product $product): RedirectResponse
    {
        $validated = $request->validated();

        $product->update(['is_available' => $validated['is_available']]);

        return back()->with('success', $product->is_available ? 'Plat disponible.' : 'Plat indisponible.');
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
