<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['category', 'photos'])
            ->where('is_available', true)
            ->orderBy('sort_order')
            ->orderBy('name');

        // Apply search filter
        if ($request->has('search') && $request->search) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%")
                    ->orWhereHas('category', function ($q2) use ($searchTerm) {
                        $q2->where('name', 'like', "%{$searchTerm}%");
                    });
            });
        }

        // Apply category filter
        if ($request->has('category') && $request->category && $request->category !== 'all') {
            $query->where('category_id', $request->category);
        }

        // Paginate results
        $perPage = 12; // Number of products per page
        $products = $query->paginate($perPage);

        $categories = Category::query()->orderBy('sort_order')->orderBy('name')->get();

        $storeConfig = [
            'currency' => config('pos.currency'),
            'locale' => config('pos.locale'),
            'delivery_fee' => (float) config('pos.delivery_fee'),
            'tax_rate' => (float) config('pos.tax_rate'),
            'midtrans_enabled' => config('pos.currency') === 'IDR'
              && (int) config('pos.currency_precision') === 0
              && filled(config('services.midtrans.server_key'))
              && filled(config('services.midtrans.client_key')),
        ];

        // Return JSON for AJAX requests (infinite scroll) - hanya untuk request dengan page parameter.
        // Exclude Inertia visits (X-Inertia header) since axios also sets X-Requested-With.
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

        // Return Inertia page for initial load and redirects
        return Inertia::render('customer/index', [
            'products' => $products->items(),
            'categories' => $categories,
            'currency' => $storeConfig['currency'],
            'locale' => $storeConfig['locale'],
            'delivery_fee' => $storeConfig['delivery_fee'],
            'tax_rate' => $storeConfig['tax_rate'],
            'midtrans_enabled' => $storeConfig['midtrans_enabled'],
            'store_config' => $storeConfig,
            'pagination' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
                'has_more_pages' => $products->hasMorePages(),
            ],
        ]);
    }
}
