<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\VitalSign;
use App\Models\Visit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class VisitController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => Visit::query()
                ->with(['patient.card', 'department', 'doctor.department', 'vitalSign'])
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
            'data' => $visit->load(['patient.card', 'department', 'doctor.department', 'vitalSign']),
        ], 201);
    }

    public function vitalSignsQueue(): JsonResponse
    {
        $queue = Visit::query()
            ->with(['patient.card', 'department', 'doctor.department', 'vitalSign'])
            ->whereIn('status', ['queued', 'vitals-recorded'])
            ->orderBy('queued_at')
            ->get();

        return response()->json([
            'data' => $queue,
        ]);
    }

    public function doctorQueue(Request $request): JsonResponse
    {
        $doctorId = $request->integer('doctor_id');

        $queue = Visit::query()
            ->with(['patient.card', 'department', 'doctor.department', 'vitalSign'])
            ->whereIn('status', ['with-doctor', 'in-progress'])
            ->when($doctorId > 0, fn ($query) => $query->where('doctor_id', $doctorId))
            ->orderByDesc('routed_to_doctor_at')
            ->orderBy('queued_at')
            ->get();

        return response()->json([
            'data' => $queue,
        ]);
    }

    public function recordVitalSigns(Request $request, Visit $visit): JsonResponse
    {
        $data = $request->validate([
            'blood_pressure' => ['nullable', 'string', 'max:50'],
            'temperature' => ['nullable', 'numeric'],
            'pulse' => ['nullable', 'integer'],
            'respiratory_rate' => ['nullable', 'integer'],
            'weight' => ['nullable', 'numeric'],
            'height' => ['nullable', 'numeric'],
            'bmi' => ['nullable', 'numeric'],
            'oxygen_saturation' => ['nullable', 'numeric'],
            'blood_sugar' => ['nullable', 'numeric'],
            'notes' => ['nullable', 'string'],
            'recorded_at' => ['nullable', 'date'],
        ]);

        $visit->vitalSign()->updateOrCreate(
            ['visit_id' => $visit->id],
            [
                ...$data,
                'recorded_by' => $request->user()?->id,
                'recorded_at' => $data['recorded_at'] ?? now(),
            ],
        );

        $visit->update([
            'status' => 'vitals-recorded',
        ]);

        return response()->json([
            'message' => 'Vital signs saved successfully.',
            'data' => $visit->fresh()->load(['patient.card', 'department', 'doctor.department', 'vitalSign']),
        ]);
    }

    public function routeToDoctor(Request $request, Visit $visit): JsonResponse
    {
        $data = $request->validate([
            'doctor_id' => [
                'required',
                Rule::exists('users', 'id')->where(fn ($query) => $query->where('role', 'doctor')),
            ],
            'department_id' => ['nullable', 'exists:departments,id'],
            'consulting_room' => ['nullable', 'string', 'max:100'],
            'route_notes' => ['nullable', 'string'],
            'routed_by' => ['nullable', 'string', 'max:255'],
            'routed_to_doctor_at' => ['nullable', 'date'],
        ]);

        $doctor = User::query()->findOrFail($data['doctor_id']);

        $visit->update([
            'doctor_id' => $doctor->id,
            'department_id' => $data['department_id'] ?? $doctor->department_id ?? $visit->department_id,
            'consulting_room' => $data['consulting_room'] ?? null,
            'route_notes' => $data['route_notes'] ?? null,
            'routed_by' => $data['routed_by'] ?? $request->user()?->name ?? 'Vital Signs Unit',
            'routed_to_doctor_at' => $data['routed_to_doctor_at'] ?? now(),
            'status' => 'with-doctor',
        ]);

        return response()->json([
            'message' => 'Visit routed to doctor successfully.',
            'data' => $visit->fresh()->load(['patient.card', 'department', 'doctor.department', 'vitalSign']),
        ]);
    }

    public function updateStatus(Request $request, Visit $visit): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in([
                'queued',
                'vitals-recorded',
                'with-doctor',
                'in-progress',
                'completed',
                'cancelled',
            ])],
            'seen_at' => ['nullable', 'date'],
        ]);

        $updates = [
            'status' => $data['status'],
        ];

        if ($data['status'] === 'in-progress' && $visit->seen_at === null) {
            $updates['seen_at'] = $data['seen_at'] ?? now();
        }

        if ($data['status'] === 'completed') {
            $updates['seen_at'] = $data['seen_at'] ?? $visit->seen_at ?? now();
        }

        $visit->update($updates);

        return response()->json([
            'message' => 'Visit status updated successfully.',
            'data' => $visit->fresh()->load(['patient.card', 'department', 'doctor.department', 'vitalSign']),
        ]);
    }
}
