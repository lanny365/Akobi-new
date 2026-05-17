<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PharmacyItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'item_code',
        'name',
        'category',
        'sub_category',
        'stock_level',
        'reorder_level',
        'expiry_date',
        'cost_price',
        'selling_price',
        'stock_status',
        'status',
    ];

    protected $casts = [
        'expiry_date' => 'date',
        'cost_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
    ];
}
