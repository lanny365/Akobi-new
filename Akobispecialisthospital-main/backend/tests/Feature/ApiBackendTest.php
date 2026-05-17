<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApiBackendTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed();
    }

    public function test_health_endpoint_returns_ok(): void
    {
        $response = $this->getJson('/api/health');

        $response
            ->assertOk()
            ->assertJson([
                'status' => 'ok',
                'service' => 'akobi-hospital-backend',
            ]);
    }

    public function test_user_can_log_in_and_fetch_patients(): void
    {
        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => 'admin@akobi.test',
            'password' => 'password',
            'device_name' => 'phpunit',
        ]);

        $token = $loginResponse->json('token');

        $loginResponse
            ->assertOk()
            ->assertJsonPath('user.email', 'admin@akobi.test');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/patients')
            ->assertOk()
            ->assertJsonPath('data.0.patient_number', 'PT-2026-0001');
    }

    public function test_visit_can_record_vitals_route_to_doctor_and_enter_doctor_queue(): void
    {
        $token = $this->postJson('/api/auth/login', [
            'email' => 'admin@akobi.test',
            'password' => 'password',
            'device_name' => 'phpunit',
        ])->json('token');

        $doctorId = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/users?role=doctor')
            ->assertOk()
            ->json('data.0.id');

        $visitId = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/queue/vital-signs')
            ->assertOk()
            ->json('data.0.id');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson("/api/visits/{$visitId}/vital-signs", [
                'blood_pressure' => '120/80',
                'temperature' => 36.7,
                'pulse' => 72,
                'respiratory_rate' => 16,
                'weight' => 70,
                'height' => 170,
                'bmi' => 24.2,
                'oxygen_saturation' => 98,
                'notes' => 'Stable vitals.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'vitals-recorded')
            ->assertJsonPath('data.vital_sign.blood_pressure', '120/80');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson("/api/visits/{$visitId}/route-to-doctor", [
                'doctor_id' => $doctorId,
                'consulting_room' => 'CR-101',
                'route_notes' => 'Please review after vitals.',
                'routed_by' => 'Vital Signs Unit',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'with-doctor')
            ->assertJsonPath('data.consulting_room', 'CR-101');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/queue/doctors')
            ->assertOk()
            ->assertJsonPath('data.0.id', $visitId)
            ->assertJsonPath('data.0.status', 'with-doctor');
    }
}
