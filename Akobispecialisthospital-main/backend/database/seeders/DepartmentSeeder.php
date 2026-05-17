<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            ['name' => 'Administration', 'code' => 'ADMIN', 'category' => 'Core', 'is_clinical' => false],
            ['name' => 'Reception', 'code' => 'RECEPT', 'category' => 'Core', 'is_clinical' => false],
            ['name' => 'Clinical', 'code' => 'CLIN', 'category' => 'Clinical', 'is_clinical' => true],
            ['name' => 'Pharmacy', 'code' => 'PHARM', 'category' => 'Clinical', 'is_clinical' => true],
            ['name' => 'Laboratory', 'code' => 'LAB', 'category' => 'Clinical', 'is_clinical' => true],
            ['name' => 'Theatre', 'code' => 'THR', 'category' => 'Clinical', 'is_clinical' => true],
            ['name' => 'Cashier', 'code' => 'CASH', 'category' => 'Finance', 'is_clinical' => false],
            ['name' => 'Accounts', 'code' => 'ACCT', 'category' => 'Finance', 'is_clinical' => false],
        ];

        foreach ($departments as $department) {
            Department::updateOrCreate(
                ['code' => $department['code']],
                $department + ['status' => 'active'],
            );
        }
    }
}
