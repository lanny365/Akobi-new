<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Visit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class VisitController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => Visit::query()
                ->with(['patient.card', 'department', 'doctor', 'vitalSign'])
                ->latest()
                ->paginate(20),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'patient_id' => ['required', 'exists:patients,id'],
            'department_id' => ['required', 'exists:departments,id'],
            'doctor_id' => ['nullable', 'exists:users,id'],
            'chief_complaint' => ['required', 'string'],
            'reason_to_see_doctor' => ['nullable', 'string', 'max:100'],
            'consultation_type' => ['nullable', 'string', 'max:100'],
            'treatment_type' => ['nullable', 'string', 'max:100'],
        ]);

        $visit = Visit::create([
            ...$data,
            'visit_number' => 'VS-'.now()->format('Y').'-'.Str::padLeft((string) (Visit::count() + 1), 4, '0'),
            'status' => 'queued',
            'queued_at' => now(),
        ]);

        return response()->json([
            'message' => 'Visit queued successfully.',
            'data' => $visit->load(['patient.card', 'department', 'doctor']),
        ], 201);
    }

    public function vitalSignsQueue(): JsonResponse
    {
        $queue = Visit::query()
            ->with(['patient.card', 'department', 'doctor', 'vitalSign'])
            ->whereIn('status', ['queued', 'vitals-recorded'])
            ->orderBy('queued_at')
            ->get();

        return response()->json([
            'data' => $queue,
        ]);
    }
}
