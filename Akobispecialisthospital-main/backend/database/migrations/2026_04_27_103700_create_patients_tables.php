<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->string('patient_number')->unique();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('middle_name')->nullable();
            $table->string('gender', 20);
            $table->date('date_of_birth');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->text('address')->nullable();
            $table->string('blood_group', 10)->nullable();
            $table->string('genotype', 10)->nullable();
            $table->string('next_of_kin_name')->nullable();
            $table->string('next_of_kin_phone')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('patient_cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->string('card_number')->unique();
            $table->string('card_type');
            $table->string('family_group')->nullable();
            $table->decimal('wallet_balance', 12, 2)->default(0);
            $table->timestamp('issued_at')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patient_cards');
        Schema::dropIfExists('patients');
    }
};
