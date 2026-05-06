<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LabTest extends Model
{
    use HasFactory;

    protected $fillable = [
        'catalog_number',
        'name',
        'category',
        'price',
        'turnaround_hours',
        'sample_type',
        'description',
        'status',
    ];

    protected $casts = [
        'price' => 'decimal:2',
    ];
}
