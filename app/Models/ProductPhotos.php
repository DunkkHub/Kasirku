<?php

namespace App\Models;

use Database\Factories\ProductPhotosFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductPhotos extends Model
{
    /** @use HasFactory<ProductPhotosFactory> */
    use HasFactory;

    protected $fillable = ['product_id', 'url', 'is_primary'];

    protected $casts = ['is_primary' => 'boolean'];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
