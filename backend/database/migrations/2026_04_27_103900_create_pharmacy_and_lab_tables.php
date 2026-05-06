<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pharmacy_items', function (Blueprint $table) {
            $table->id();
            $table->string('item_code')->unique();
            $table->string('name');
            $table->string('category');
            $table->string('sub_category')->nullable();
            $table->integer('stock_level')->default(0);
            $table->integer('reorder_level')->default(0);
            $table->date('expiry_date')->nullable();
            $table->decimal('cost_price', 12, 2)->default(0);
            $table->decimal('selling_price', 12, 2)->default(0);
            $table->string('stock_status')->default('NEW');
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('drug_requests', function (Blueprint $table) {
            $table->id();
            $table->string('request_number')->unique();
            $table->foreignId('visit_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('requester_id')->constrained('users')->cascadeOnDelete();
            $table->string('requester_type');
            $table->string('priority')->default('Normal');
            $table->string('status')->default('Pending');
            $table->text('notes')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('rejected_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('rejected_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->foreignId('dispensed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('dispensed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('drug_request_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('drug_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('pharmacy_item_id')->nullable()->constrained()->nullOnDelete();
            $table->string('drug_name');
            $table->integer('quantity')->default(1);
            $table->string('dosage')->nullable();
            $table->string('frequency')->nullable();
            $table->string('duration')->nullable();
            $table->decimal('unit_price', 12, 2)->default(0);
            $table->decimal('total_price', 12, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('lab_tests', function (Blueprint $table) {
            $table->id();
            $table->string('catalog_number')->unique();
            $table->string('name');
            $table->string('category');
            $table->decimal('price', 12, 2)->default(0);
            $table->integer('turnaround_hours')->default(1);
            $table->string('sample_type')->nullable();
            $table->text('description')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lab_tests');
        Schema::dropIfExists('drug_request_items');
        Schema::dropIfExists('drug_requests');
        Schema::dropIfExists('pharmacy_items');
    }
};
