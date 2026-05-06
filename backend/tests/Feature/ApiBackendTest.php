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
}
