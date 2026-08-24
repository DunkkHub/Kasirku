<?php

namespace App\Http\Controllers;

use App\Http\Requests\Admin\SaveCategoryRequest;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
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

    public function create(): never
    {
        abort(404, 'Page introuvable.');
    }

    public function store(SaveCategoryRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $image = $request->file('image')?->store('categories', 'public');

        Category::create([
            'name' => trim($validated['name']),
            'description' => filled($validated['description'] ?? null) ? trim($validated['description']) : null,
            'image' => $image ? Storage::url($image) : null,
            'is_active' => (bool) ($validated['is_active'] ?? true),
            'sort_order' => (int) ($validated['sort_order'] ?? 0),
        ]);

        return redirect()->route('categories.index')->with('success', 'Catégorie créée.');
    }

    public function show(Category $category): never
    {
        abort(404, 'Page introuvable.');
    }

    public function edit(Category $category): never
    {
        abort(404, 'Page introuvable.');
    }

    public function update(SaveCategoryRequest $request, Category $category): RedirectResponse
    {
        $validated = $request->validated();
        $oldImage = null;

        if ($request->boolean('remove_image')) {
            $oldImage = $this->storagePathFromUrl((string) $category->image);
            $category->image = null;
        }

        if ($request->hasFile('image')) {
            $oldImage = $this->storagePathFromUrl((string) $category->image);
            $category->image = Storage::url($request->file('image')->store('categories', 'public'));
        }

        $category->fill([
            'name' => trim($validated['name']),
            'description' => filled($validated['description'] ?? null) ? trim($validated['description']) : null,
            'is_active' => (bool) ($validated['is_active'] ?? $category->is_active),
            'sort_order' => (int) ($validated['sort_order'] ?? $category->sort_order),
        ])->save();

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

        return str_replace('/storage/', '', $path);
    }
}
