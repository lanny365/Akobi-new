<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('visits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->foreignId('department_id')->constrained()->cascadeOnDelete();
            $table->foreignId('doctor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('visit_number')->unique();
            $table->text('chief_complaint');
            $table->string('reason_to_see_doctor')->nullable();
            $table->string('consultation_type')->nullable();
            $table->string('treatment_type')->nullable();
            $table->string('status')->default('queued');
            $table->timestamp('queued_at')->nullable();
            $table->timestamp('seen_at')->nullable();
            $table->timestamps();
        });

        Schema::create('vital_signs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('visit_id')->constrained()->cascadeOnDelete();
            $table->string('blood_pressure')->nullable();
            $table->decimal('temperature', 5, 2)->nullable();
            $table->integer('pulse')->nullable();
            $table->integer('respiratory_rate')->nullable();
            $table->decimal('weight', 8, 2)->nullable();
            $table->decimal('height', 8, 2)->nullable();
            $table->decimal('bmi', 8, 2)->nullable();
            $table->decimal('oxygen_saturation', 5, 2)->nullable();
            $table->decimal('blood_sugar', 8, 2)->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('recorded_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vital_signs');
        Schema::dropIfExists('visits');
    }
};
