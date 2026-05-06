<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TheatreCase extends Model
{
    use HasFactory;

    protected $fillable = [
        'case_number',
        'patient_id',
        'requesting_doctor_id',
        'surgeon_id',
        'pre_op_diagnosis',
        'planned_surgery',
        'indication',
        'urgency_level',
        'anesthesia_type',
        'estimated_duration',
        'special_equipment',
        'preparation_notes',
        'status',
        'scheduled_date',
        'scheduled_time',
        'theatre_room',
    ];

    protected $casts = [
        'scheduled_date' => 'date',
        'special_equipment' => 'array',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function requestingDoctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requesting_doctor_id');
    }

    public function surgeon(): BelongsTo
    {
        return $this->belongsTo(User::class, 'surgeon_id');
    }
}
