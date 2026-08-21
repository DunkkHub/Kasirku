<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $sqlite = DB::getDriverName() === 'sqlite';

        Schema::table('products', function (Blueprint $table) use ($sqlite) {
            $table->dropForeign($sqlite ? ['category_id'] : 'product_category_id');
            $table->foreign('category_id', 'product_category_id')
                ->references('id')->on('categories')->restrictOnDelete();
        });

        Schema::table('order_items', function (Blueprint $table) use ($sqlite) {
            $table->dropForeign($sqlite ? ['product_id'] : 'order_item_product_id');
            $table->foreign('product_id', 'order_item_product_id')
                ->references('id')->on('products')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        $sqlite = DB::getDriverName() === 'sqlite';

        Schema::table('order_items', function (Blueprint $table) use ($sqlite) {
            $table->dropForeign($sqlite ? ['product_id'] : 'order_item_product_id');
            $table->foreign('product_id', 'order_item_product_id')
                ->references('id')->on('products')->cascadeOnDelete();
        });

        Schema::table('products', function (Blueprint $table) use ($sqlite) {
            $table->dropForeign($sqlite ? ['category_id'] : 'product_category_id');
            $table->foreign('category_id', 'product_category_id')
                ->references('id')->on('categories')->cascadeOnDelete();
        });
    }
};
