<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('restaurant_settings', function (Blueprint $table) {
            $table->id();
            $table->string('restaurant_name')->default('Teisseire Pizza');
            $table->string('logo_path')->nullable();
            $table->string('halal_badge_path')->nullable();
            $table->boolean('show_halal_badge')->default(true);
            $table->string('tagline')->nullable();
            $table->text('description')->nullable();
            $table->string('phone', 40)->nullable();
            $table->text('address')->nullable();
            $table->text('opening_hours')->nullable();
            $table->string('currency_code', 3)->default('EUR');
            $table->string('currency_symbol', 8)->default('€');
            $table->string('currency_symbol_position', 12)->default('after');
            $table->string('pizza_size_text')->nullable();
            $table->string('instagram_url')->nullable();
            $table->string('facebook_url')->nullable();
            $table->string('google_maps_url')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restaurant_settings');
    }
};
