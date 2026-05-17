<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Visit extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'department_id',
        'doctor_id',
        'visit_number',
        'chief_complaint',
        'reason_to_see_doctor',
        'consultation_type',
        'treatment_type',
        'status',
        'consulting_room',
        'route_notes',
        'routed_by',
        'routed_to_doctor_at',
        'queued_at',
        'seen_at',
    ];

    protected $casts = [
        'routed_to_doctor_at' => 'datetime',
        'queued_at' => 'datetime',
        'seen_at' => 'datetime',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function vitalSign(): HasOne
    {
        return $this->hasOne(VitalSign::class);
    }
}
