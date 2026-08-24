<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->text('ingredients')->nullable();
            $table->foreignId('category_id')
                ->constrained('categories', 'id', 'product_category_id')
                ->restrictOnDelete();
            $table->decimal('price', 10, 2)->default(0.00);
            $table->boolean('is_available')->default(true)->index();
            $table->unsignedInteger('sort_order')->default(0)->index();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['category_id', 'is_available', 'sort_order'], 'products_menu_listing_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
