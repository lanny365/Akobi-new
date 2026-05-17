<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('theatre_cases', function (Blueprint $table) {
            $table->id();
            $table->string('case_number')->unique();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->foreignId('requesting_doctor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('surgeon_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('pre_op_diagnosis');
            $table->string('planned_surgery');
            $table->text('indication')->nullable();
            $table->string('urgency_level')->default('elective');
            $table->string('anesthesia_type')->nullable();
            $table->string('estimated_duration')->nullable();
            $table->json('special_equipment')->nullable();
            $table->text('preparation_notes')->nullable();
            $table->string('status')->default('pending');
            $table->date('scheduled_date')->nullable();
            $table->string('scheduled_time')->nullable();
            $table->string('theatre_room')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('theatre_cases');
    }
};
