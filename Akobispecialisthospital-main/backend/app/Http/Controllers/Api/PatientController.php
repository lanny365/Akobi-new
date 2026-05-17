<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PatientController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = $request->string('search')->toString();

        $patients = Patient::query()
            ->with('card')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($inner) use ($search) {
                    $inner
                        ->where('patient_number', 'like', "%{$search}%")
                        ->orWhere('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(20);

        return response()->json($patients);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'gender' => ['required', 'in:Male,Female,Other'],
            'date_of_birth' => ['required', 'date'],
            'phone' => ['required', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
            'blood_group' => ['nullable', 'string', 'max:10'],
            'genotype' => ['nullable', 'string', 'max:10'],
            'next_of_kin_name' => ['nullable', 'string', 'max:255'],
            'next_of_kin_phone' => ['nullable', 'string', 'max:30'],
            'card_type' => ['required', 'string', 'max:100'],
        ]);

        $patient = Patient::create([
            'patient_number' => $this->generatePatientNumber(),
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'middle_name' => $data['middle_name'] ?? null,
            'gender' => $data['gender'],
            'date_of_birth' => $data['date_of_birth'],
            'phone' => $data['phone'],
            'email' => $data['email'] ?? null,
            'address' => $data['address'] ?? null,
            'blood_group' => $data['blood_group'] ?? null,
            'genotype' => $data['genotype'] ?? null,
            'next_of_kin_name' => $data['next_of_kin_name'] ?? null,
            'next_of_kin_phone' => $data['next_of_kin_phone'] ?? null,
            'status' => 'active',
        ]);

        $patient->card()->create([
            'card_number' => $this->generateCardNumber(),
            'card_type' => $data['card_type'],
            'issued_at' => now(),
            'status' => 'active',
        ]);

        return response()->json([
            'message' => 'Patient created successfully.',
            'data' => $patient->load('card'),
        ], 201);
    }

    public function show(Patient $patient): JsonResponse
    {
        return response()->json([
            'data' => $patient->load(['card', 'visits.department', 'visits.doctor', 'visits.vitalSign']),
        ]);
    }

    private function generatePatientNumber(): string
    {
        return 'PT-'.now()->format('Y').'-'.Str::padLeft((string) (Patient::count() + 1), 4, '0');
    }

    private function generateCardNumber(): string
    {
        return 'AKB-'.now()->format('Y').'-'.Str::padLeft((string) (Patient::count() + 1), 4, '0');
    }
}
