<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $categories = Category::withCount('products')->get();

        return Inertia::render('admin/categories/index', [
            'categories' => $categories,
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
        $validated = $request->validate(['name' => 'required|string|max:120|unique:categories,name']);

        Category::create(['name' => trim($validated['name'])]);

        return redirect()->route('categories.index')->with('success', 'Catégorie créée.');
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
        $validated = $request->validate(['name' => 'required|string|max:120|unique:categories,name,'.$id]);

        $category = Category::findOrFail($id);
        $category->update(['name' => trim($validated['name'])]);

        return redirect()->route('categories.index')->with('success', 'Catégorie mise à jour.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $category = Category::findOrFail($id);

        // Les produits archivés doivent également préserver leur catégorie.
        if ($category->products()->withTrashed()->exists()) {
            return back()->withErrors([
                'error' => 'Cette catégorie contient des produits actifs ou archivés et ne peut pas être supprimée.',
            ]);
        }

        $category->delete();

        return redirect()->route('categories.index')->with('success', 'Catégorie supprimée.');
    }
}
