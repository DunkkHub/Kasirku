<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->unique('order_id');
            $table->index(['status', 'paid_at']);
        });

        Schema::create('payment_webhook_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->constrained()->cascadeOnDelete();
            $table->string('provider', 30);
            $table->string('event_key', 64)->unique();
            $table->json('payload');
            $table->timestamp('processed_at');
            $table->timestamps();

            $table->index(['payment_id', 'provider']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_webhook_events');

        Schema::table('payments', function (Blueprint $table) {
            $table->dropUnique(['order_id']);
            $table->dropIndex(['status', 'paid_at']);
        });
    }
};
