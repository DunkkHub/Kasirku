<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->unsignedInteger('sort_order')->default(0)->index()->after('name');
            $table->unique('name');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->text('description')->nullable()->after('name');
            $table->boolean('is_available')->default(true)->index()->after('price');
            $table->unsignedInteger('sort_order')->default(0)->index()->after('is_available');
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['description', 'is_available', 'sort_order', 'deleted_at']);
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropUnique(['name']);
            $table->dropColumn('sort_order');
        });
    }
};
