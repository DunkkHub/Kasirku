<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductPhotos;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Throwable;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Product::with(['category', 'photos']);

        // Filtrer par recherche.
        if ($request->has('search') && $request->search) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%")
                    ->orWhereHas('category', function ($q2) use ($searchTerm) {
                        $q2->where('name', 'like', "%{$searchTerm}%");
                    });
            });
        }
        // Filtrer par catégorie.
        if ($request->has('category') && $request->category && $request->category !== 'all') {
            $query->where('category_id', $request->category);
        }

        $perPage = 12;
        $products = $query->latest()->paginate($perPage);

        $categories = Category::all();

        // Les pages suivantes du défilement infini reçoivent du JSON.
        // Les visites Inertia restent exclues, car axios envoie aussi X-Requested-With.
        if (! $request->header('X-Inertia') && ($request->wantsJson() || $request->ajax()) && $request->has('page') && $request->page > 1) {
            return response()->json([
                'products' => $products->items(),
                'pagination' => [
                    'current_page' => $products->currentPage(),
                    'last_page' => $products->lastPage(),
                    'per_page' => $products->perPage(),
                    'total' => $products->total(),
                    'has_more_pages' => $products->hasMorePages(),
                ],
            ]);
        }

        // Rendu initial de la page Inertia.
        return Inertia::render('admin/products/index', [
            'products' => $products->items(),
            'categories' => $categories,
            'pagination' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
                'has_more_pages' => $products->hasMorePages(),
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        abort(404, 'Page introuvable.');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:1000'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'price' => ['required', 'numeric', 'decimal:0,2', 'min:0', 'max:9999.99'],
            'is_available' => ['sometimes', 'boolean'],
            'photos' => ['nullable', 'array', 'max:6'],
            'photos.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:4096', 'dimensions:max_width=4096,max_height=4096'],
        ]);

        $storedPaths = [];

        try {
            DB::transaction(function () use ($request, $validated, &$storedPaths): void {
                $product = Product::create([
                    'name' => trim($validated['name']),
                    'description' => $validated['description'] ?? null,
                    'category_id' => $validated['category_id'],
                    'price' => $validated['price'],
                    'is_available' => $validated['is_available'] ?? true,
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

        return redirect()->route('products.index')->with('success', 'Produit créé.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        abort(404, 'Page introuvable.');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        abort(404, 'Page introuvable.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:1000'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'price' => ['required', 'numeric', 'decimal:0,2', 'min:0', 'max:9999.99'],
            'is_available' => ['sometimes', 'boolean'],
            'photos' => ['nullable', 'array', 'max:6'],
            'photos.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:4096', 'dimensions:max_width=4096,max_height=4096'],
            'remove_photos' => ['nullable', 'array', 'max:6'],
            'remove_photos.*' => [
                'integer',
                'distinct',
                Rule::exists('product_photos', 'id')->where('product_id', $product->id),
            ],
        ]);

        $removeIds = collect($validated['remove_photos'] ?? []);
        $remainingCount = $product->photos()->whereNotIn('id', $removeIds)->count();
        if ($remainingCount + count($request->file('photos', [])) > 6) {
            throw ValidationException::withMessages(['photos' => 'Un produit peut avoir au maximum 6 photos.']);
        }

        $storedPaths = [];
        $filesToDelete = [];

        try {
            DB::transaction(function () use ($request, $validated, $product, $removeIds, &$storedPaths, &$filesToDelete): void {
                $product->update([
                    'name' => trim($validated['name']),
                    'description' => $validated['description'] ?? null,
                    'category_id' => $validated['category_id'],
                    'price' => $validated['price'],
                    'is_available' => $validated['is_available'] ?? $product->is_available,
                ]);

                foreach ($product->photos()->whereIn('id', $removeIds)->get() as $photo) {
                    $urlPath = parse_url($photo->url, PHP_URL_PATH);
                    if (str_starts_with((string) $urlPath, '/storage/products/')) {
                        $filesToDelete[] = str_replace('/storage/', '', $urlPath);
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

        return redirect()->route('products.index')->with('success', 'Produit mis à jour.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $product = Product::findOrFail($id);

        // L’archivage préserve les lignes vendues, leurs prix et leurs photos.
        $product->update(['is_available' => false]);
        $product->delete();

        return redirect()->route('products.index')->with('success', 'Produit archivé.');
    }
}
