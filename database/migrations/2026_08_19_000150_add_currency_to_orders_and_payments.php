<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('orders', 'currency')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->char('currency', 3)->default('IDR')->after('total_amount');
            });
        }

        if (! Schema::hasColumn('payments', 'currency')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->char('currency', 3)->default('IDR')->after('amount');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('payments', 'currency')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->dropColumn('currency');
            });
        }

        if (Schema::hasColumn('orders', 'currency')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropColumn('currency');
            });
        }
    }
};
