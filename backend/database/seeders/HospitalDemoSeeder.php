<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\LabTest;
use App\Models\Patient;
use App\Models\PharmacyItem;
use App\Models\TheatreCase;
use App\Models\User;
use App\Models\Visit;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class HospitalDemoSeeder extends Seeder
{
    public function run(): void
    {
        $adminDepartment = Department::where('code', 'ADMIN')->first();
        $clinicalDepartment = Department::where('code', 'CLIN')->first();

        $admin = User::updateOrCreate(
            ['email' => 'admin@akobi.test'],
            [
                'name' => 'Akobi Administrator',
                'employee_id' => 'EMP-0001',
                'phone' => '+2348000000001',
                'role' => 'admin',
                'department_id' => $adminDepartment?->id,
                'status' => 'active',
                'password' => Hash::make('password'),
            ],
        );

        $doctor = User::updateOrCreate(
            ['email' => 'doctor@akobi.test'],
            [
                'name' => 'Dr. Sarah Johnson',
                'employee_id' => 'EMP-0101',
                'phone' => '+2348000000002',
                'role' => 'doctor',
                'department_id' => $clinicalDepartment?->id,
                'status' => 'active',
                'password' => Hash::make('password'),
            ],
        );

        $patient = Patient::updateOrCreate(
            ['patient_number' => 'PT-2026-0001'],
            [
                'first_name' => 'James',
                'last_name' => 'Anderson',
                'gender' => 'Male',
                'date_of_birth' => '1981-05-16',
                'phone' => '+2348111111111',
                'address' => '12 Hospital Road, Lagos',
                'next_of_kin_name' => 'Mary Anderson',
                'next_of_kin_phone' => '+2348222222222',
                'status' => 'active',
            ],
        );

        $patient->card()->updateOrCreate(
            ['patient_id' => $patient->id],
            [
                'card_number' => 'AKB-2026-0001',
                'card_type' => 'New Patient Card',
                'wallet_balance' => 0,
                'issued_at' => now(),
                'status' => 'active',
            ],
        );

        Visit::updateOrCreate(
            ['visit_number' => 'VS-2026-0001'],
            [
                'patient_id' => $patient->id,
                'department_id' => $clinicalDepartment?->id,
                'doctor_id' => $doctor->id,
                'chief_complaint' => 'Fever and headache for 3 days',
                'reason_to_see_doctor' => 'Consultation',
                'status' => 'queued',
                'queued_at' => now(),
            ],
        );

        $items = [
            ['item_code' => 'DRUG-1', 'name' => 'Paracetamol 500mg', 'category' => 'Analgesic', 'sub_category' => 'Pain Relief', 'stock_level' => 500, 'reorder_level' => 100, 'expiry_date' => '2027-12-31', 'cost_price' => 40, 'selling_price' => 60, 'stock_status' => 'NEW'],
            ['item_code' => 'DRUG-8', 'name' => 'Ceftriaxone 1g', 'category' => 'Prescription Medicines (Rx)', 'sub_category' => 'Antibiotics', 'stock_level' => 200, 'reorder_level' => 100, 'expiry_date' => '2027-05-10', 'cost_price' => 160, 'selling_price' => 240, 'stock_status' => 'NEW'],
            ['item_code' => 'LAB-001', 'name' => 'Blood Collection Tubes (10ml)', 'category' => 'Laboratory & Diagnostic Supplies', 'sub_category' => 'Sample Collection', 'stock_level' => 500, 'reorder_level' => 100, 'expiry_date' => '2027-12-31', 'cost_price' => 25, 'selling_price' => 35, 'stock_status' => 'NEW'],
        ];

        foreach ($items as $item) {
            PharmacyItem::updateOrCreate(
                ['item_code' => $item['item_code']],
                $item + ['status' => 'active'],
            );
        }

        $tests = [
            ['catalog_number' => 'HEM-001', 'name' => 'Full Blood Count (FBC)', 'category' => 'Hematology', 'price' => 3500, 'turnaround_hours' => 2, 'sample_type' => 'Blood', 'description' => 'Complete blood count analysis', 'status' => 'active'],
            ['catalog_number' => 'PARA-001', 'name' => 'Malaria parasite test', 'category' => 'Parasitology', 'price' => 2000, 'turnaround_hours' => 1, 'sample_type' => 'Blood', 'description' => 'Microscopic examination for malaria parasites', 'status' => 'active'],
        ];

        foreach ($tests as $test) {
            LabTest::updateOrCreate(
                ['catalog_number' => $test['catalog_number']],
                $test,
            );
        }

        TheatreCase::updateOrCreate(
            ['case_number' => 'THR-2026-0001'],
            [
                'patient_id' => $patient->id,
                'requesting_doctor_id' => $doctor->id,
                'surgeon_id' => $doctor->id,
                'pre_op_diagnosis' => 'Acute Appendicitis',
                'planned_surgery' => 'Laparoscopic Appendectomy',
                'indication' => 'Patient presents with right lower quadrant pain and elevated WBC count.',
                'urgency_level' => 'urgent',
                'anesthesia_type' => 'general',
                'estimated_duration' => '1-2 hours',
                'special_equipment' => ['Laparoscopic equipment', 'Endoscopic camera system'],
                'preparation_notes' => 'NPO since midnight, IV access established.',
                'status' => 'scheduled',
                'scheduled_date' => now()->toDateString(),
                'scheduled_time' => '14:00',
                'theatre_room' => 'Theatre 1',
            ],
        );
    }
}
