<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Patient extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_number',
        'first_name',
        'last_name',
        'middle_name',
        'gender',
        'date_of_birth',
        'phone',
        'email',
        'address',
        'blood_group',
        'genotype',
        'next_of_kin_name',
        'next_of_kin_phone',
        'status',
    ];

    protected $appends = [
        'full_name',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
    ];

    public function card(): HasOne
    {
        return $this->hasOne(PatientCard::class);
    }

    public function visits(): HasMany
    {
        return $this->hasMany(Visit::class);
    }

    public function theatreCases(): HasMany
    {
        return $this->hasMany(TheatreCase::class);
    }

    public function getFullNameAttribute(): string
    {
        return trim(implode(' ', array_filter([
            $this->first_name,
            $this->middle_name,
            $this->last_name,
        ])));
    }
}
