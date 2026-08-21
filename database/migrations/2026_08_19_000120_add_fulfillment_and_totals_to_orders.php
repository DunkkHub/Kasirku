<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->uuid('public_id')->nullable()->unique()->after('id');
            $table->string('reference', 32)->nullable()->unique()->after('public_id');
            $table->string('fulfillment_type', 20)->default('dine_in')->index()->after('customer_name');
            $table->string('delivery_phone', 30)->nullable()->after('fulfillment_type');
            $table->text('delivery_address')->nullable()->after('delivery_phone');
            $table->text('delivery_instructions')->nullable()->after('delivery_address');
            $table->decimal('subtotal_amount', 12, 2)->default(0)->after('delivery_instructions');
            $table->decimal('tax_amount', 12, 2)->default(0)->after('subtotal_amount');
            $table->decimal('delivery_fee', 12, 2)->default(0)->after('tax_amount');
            $table->decimal('total_amount', 12, 2)->default(0)->after('delivery_fee');
            $table->softDeletes();
            $table->index(['status', 'created_at']);
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->string('product_name')->nullable()->after('product_id');
        });

        DB::table('order_items')->orderBy('id')->chunkById(200, function ($items): void {
            foreach ($items as $item) {
                DB::table('order_items')->where('id', $item->id)->update([
                    'product_name' => DB::table('products')->where('id', $item->product_id)->value('name') ?? 'Produit supprimé',
                ]);
            }
        });

        DB::table('orders')->orderBy('id')->chunkById(200, function ($orders): void {
            foreach ($orders as $order) {
                $subtotal = (float) DB::table('order_items')
                    ->where('order_id', $order->id)
                    ->sum('subtotal');
                $total = (float) (DB::table('payments')->where('order_id', $order->id)->value('amount') ?? $subtotal);

                DB::table('orders')->where('id', $order->id)->update([
                    'public_id' => (string) Str::uuid(),
                    'reference' => 'LEGACY-'.str_pad((string) $order->id, 8, '0', STR_PAD_LEFT),
                    'subtotal_amount' => $subtotal,
                    'tax_amount' => max(0, $total - $subtotal),
                    'total_amount' => $total,
                ]);
            }
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->uuid('public_id')->nullable(false)->change();
            $table->string('reference', 32)->nullable(false)->change();
            $table->integer('table_number')->nullable()->change();
            $table->string('status', 32)->default('pending')->change();
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->string('product_name')->nullable(false)->change();
        });
    }

    public function down(): void
    {
        DB::table('orders')
            ->whereIn('status', ['preparing', 'ready', 'out_for_delivery', 'delivered'])
            ->update(['status' => 'completed']);
        DB::table('orders')->whereNull('table_number')->update(['table_number' => 0]);

        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn('product_name');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->integer('table_number')->nullable(false)->change();
            $table->enum('status', ['pending', 'completed', 'cancelled'])->default('pending')->change();
            $table->dropIndex(['status', 'created_at']);
            $table->dropUnique(['public_id']);
            $table->dropUnique(['reference']);
            $table->dropColumn([
                'public_id',
                'reference',
                'fulfillment_type',
                'delivery_phone',
                'delivery_address',
                'delivery_instructions',
                'subtotal_amount',
                'tax_amount',
                'delivery_fee',
                'total_amount',
                'deleted_at',
            ]);
        });
    }
};
