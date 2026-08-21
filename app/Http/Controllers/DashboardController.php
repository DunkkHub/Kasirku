<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItems;
use App\Models\Payment;
use App\Models\Product;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $ordersByStatus = Order::selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $statusCounts = collect(Order::STATUSES)->mapWithKeys(fn (string $status): array => [
            $status => (int) ($ordersByStatus[$status] ?? 0),
        ])->all();

        $topProducts = OrderItems::selectRaw('product_id, SUM(quantity) as total_quantity, SUM(subtotal) as total_revenue')
            ->whereHas('order.payment', fn ($query) => $query->where('status', 'completed'))
            ->whereHas('order', fn ($query) => $query->where('status', '!=', 'cancelled'))
            ->groupBy('product_id')
            ->orderByDesc('total_quantity')
            ->with('product:id,name')
            ->limit(5)
            ->get()
            ->filter(fn ($item) => $item->product !== null)
            ->map(fn ($item) => [
                'id' => $item->product_id,
                'name' => $item->product->name,
                'quantity_sold' => (int) $item->total_quantity,
                'revenue' => (float) $item->total_revenue,
            ])
            ->values();

        $recentOrders = Order::with('payment')
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn (Order $order) => [
                'id' => $order->id,
                'customer_name' => $order->customer_name,
                'status' => $order->status,
                'total' => (float) $order->total_amount,
                'created_at' => $order->created_at,
            ]);

        $revenueTrend = collect(range(13, 0))
            ->map(function (int $daysAgo) {
                $date = today()->subDays($daysAgo);

                return [
                    'date' => $date->toDateString(),
                    'revenue' => (float) Payment::where('status', 'completed')
                        ->whereDate('paid_at', $date)
                        ->sum('amount'),
                ];
            })
            ->values();

        $labels = [
            'pending' => 'En attente',
            'preparing' => 'En préparation',
            'ready' => 'Prête',
            'out_for_delivery' => 'En livraison',
            'delivered' => 'Livrée',
            'completed' => 'Terminée',
            'cancelled' => 'Annulée',
        ];
        $ordersByStatusChart = collect(Order::STATUSES)->map(fn (string $status): array => [
            'status' => $status,
            'label' => $labels[$status],
            'count' => $statusCounts[$status],
        ])->all();

        return Inertia::render('admin/dashboard/index', [
            'stats' => [
                'total_revenue' => (float) Payment::where('status', 'completed')->sum('amount'),
                'total_orders' => array_sum($statusCounts),
                'pending_orders' => $statusCounts['pending'] + $statusCounts['preparing'] + $statusCounts['ready'] + $statusCounts['out_for_delivery'],
                'completed_orders' => $statusCounts['completed'] + $statusCounts['delivered'],
                'cancelled_orders' => $statusCounts['cancelled'],
                'today_orders' => Order::whereDate('created_at', today())->count(),
                'today_revenue' => (float) Payment::where('status', 'completed')
                    ->whereDate('paid_at', today())
                    ->sum('amount'),
                'total_products' => Product::count(),
                'total_categories' => Category::count(),
            ],
            'topProducts' => $topProducts,
            'recentOrders' => $recentOrders,
            'revenueTrend' => $revenueTrend,
            'ordersByStatus' => $ordersByStatusChart,
        ]);
    }
}
