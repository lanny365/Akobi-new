<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DrugRequestItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'drug_request_id',
        'pharmacy_item_id',
        'drug_name',
        'quantity',
        'dosage',
        'frequency',
        'duration',
        'unit_price',
        'total_price',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
    ];

    public function drugRequest(): BelongsTo
    {
        return $this->belongsTo(DrugRequest::class);
    }

    public function pharmacyItem(): BelongsTo
    {
        return $this->belongsTo(PharmacyItem::class);
    }
}
