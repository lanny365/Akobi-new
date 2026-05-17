<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VitalSign extends Model
{
    use HasFactory;

    protected $fillable = [
        'visit_id',
        'blood_pressure',
        'temperature',
        'pulse',
        'respiratory_rate',
        'weight',
        'height',
        'bmi',
        'oxygen_saturation',
        'blood_sugar',
        'notes',
        'recorded_by',
        'recorded_at',
    ];

    protected $casts = [
        'bmi' => 'decimal:2',
        'recorded_at' => 'datetime',
    ];

    public function visit(): BelongsTo
    {
        return $this->belongsTo(Visit::class);
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
