<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatientCard extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'card_number',
        'card_type',
        'family_group',
        'wallet_balance',
        'issued_at',
        'status',
    ];

    protected $casts = [
        'wallet_balance' => 'decimal:2',
        'issued_at' => 'datetime',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }
}
