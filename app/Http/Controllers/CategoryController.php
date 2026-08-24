<?php

namespace App\Http\Controllers;

use App\Http\Requests\Admin\SaveCategoryRequest;
use App\Models\Category;
use App\Services\MenuImageStorage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class CategoryController extends Controller
{
    public function __construct(private readonly MenuImageStorage $images) {}

    public function index(): Response
    {
        $categories = Category::query()
            ->withCount(['products as products_count'])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/categories/index', [
            'categories' => $categories,
        ]);
    }

    public function store(SaveCategoryRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $storedImage = null;

        try {
            DB::transaction(function () use ($request, $validated, &$storedImage): void {
                if ($request->hasFile('image')) {
                    $storedImage = $this->images->store($request->file('image'), 'categories');
                }

                Category::create([
                    'name' => trim($validated['name']),
                    'description' => filled($validated['description'] ?? null) ? trim($validated['description']) : null,
                    'image' => $storedImage ? Storage::url($storedImage) : null,
                    'is_active' => (bool) ($validated['is_active'] ?? true),
                    'sort_order' => (int) ($validated['sort_order'] ?? 0),
                ]);
            }, 3);
        } catch (Throwable $exception) {
            if ($storedImage) {
                Storage::disk('public')->delete($storedImage);
            }

            throw $exception;
        }

        return redirect()->route('categories.index')->with('success', 'Catégorie créée.');
    }

    public function update(SaveCategoryRequest $request, Category $category): RedirectResponse
    {
        $validated = $request->validated();
        $oldImage = null;
        $storedImage = null;

        try {
            DB::transaction(function () use ($request, $validated, $category, &$oldImage, &$storedImage): void {
                if ($request->boolean('remove_image')) {
                    $oldImage = $this->storagePathFromUrl((string) $category->image);
                    $category->image = null;
                }

                if ($request->hasFile('image')) {
                    $oldImage = $this->storagePathFromUrl((string) $category->image);
                    $storedImage = $this->images->store($request->file('image'), 'categories');
                    $category->image = Storage::url($storedImage);
                }

                $category->fill([
                    'name' => trim($validated['name']),
                    'description' => filled($validated['description'] ?? null) ? trim($validated['description']) : null,
                    'is_active' => (bool) ($validated['is_active'] ?? $category->is_active),
                    'sort_order' => (int) ($validated['sort_order'] ?? $category->sort_order),
                ])->save();
            }, 3);
        } catch (Throwable $exception) {
            if ($storedImage) {
                Storage::disk('public')->delete($storedImage);
            }

            throw $exception;
        }

        if ($oldImage) {
            Storage::disk('public')->delete($oldImage);
        }

        return redirect()->route('categories.index')->with('success', 'Catégorie mise à jour.');
    }

    public function destroy(Category $category): RedirectResponse
    {
        if ($category->products()->exists()) {
            return back()->withErrors([
                'error' => 'Cette catégorie contient des plats actifs ou archivés. Déplacez-les avant de la supprimer.',
            ]);
        }

        $image = $this->storagePathFromUrl((string) $category->image);
        $category->delete();

        if ($image) {
            Storage::disk('public')->delete($image);
        }

        return redirect()->route('categories.index')->with('success', 'Catégorie supprimée.');
    }

    private function storagePathFromUrl(string $url): ?string
    {
        $path = parse_url($url, PHP_URL_PATH);

        if (! is_string($path) || ! str_starts_with($path, '/storage/categories/')) {
            return null;
        }

        $relative = str_replace('/storage/', '', $path);

        if (! str_starts_with($relative, 'categories/') || str_contains($relative, '..') || str_contains($relative, '\\')) {
            return null;
        }

        return $relative;
    }
}
