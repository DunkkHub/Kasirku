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
        Schema::table('categories', function (Blueprint $table) {
            if (! Schema::hasColumn('categories', 'slug')) {
                $table->string('slug')->nullable()->unique()->after('name');
            }

            if (! Schema::hasColumn('categories', 'description')) {
                $table->text('description')->nullable()->after('slug');
            }

            if (! Schema::hasColumn('categories', 'image')) {
                $table->string('image')->nullable()->after('description');
            }

            if (! Schema::hasColumn('categories', 'is_active')) {
                $table->boolean('is_active')->default(true)->index()->after('image');
            }
        });

        Schema::table('products', function (Blueprint $table) {
            if (! Schema::hasColumn('products', 'slug')) {
                $table->string('slug')->nullable()->unique()->after('name');
            }

            if (! Schema::hasColumn('products', 'ingredients')) {
                $table->text('ingredients')->nullable()->after('description');
            }
        });

        $this->backfillSlugs('categories');
        $this->backfillSlugs('products');
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $columns = collect(['slug', 'ingredients'])
                ->filter(fn (string $column): bool => Schema::hasColumn('products', $column))
                ->all();

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });

        Schema::table('categories', function (Blueprint $table) {
            $columns = collect(['slug', 'description', 'image', 'is_active'])
                ->filter(fn (string $column): bool => Schema::hasColumn('categories', $column))
                ->all();

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }

    private function backfillSlugs(string $table): void
    {
        $seen = [];

        DB::table($table)
            ->select(['id', 'name'])
            ->orderBy('id')
            ->get()
            ->each(function (object $row) use ($table, &$seen): void {
                $base = Str::slug((string) $row->name) ?: $table.'-'.$row->id;
                $slug = $base;
                $suffix = 2;

                while (isset($seen[$slug])) {
                    $slug = $base.'-'.$suffix++;
                }

                $seen[$slug] = true;

                DB::table($table)->where('id', $row->id)->update(['slug' => $slug]);
            });
    }
};
