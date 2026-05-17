<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('employee_id')->nullable()->after('email');
            $table->string('phone')->nullable()->after('employee_id');
            $table->foreignId('department_id')->nullable()->after('phone')->constrained()->nullOnDelete();
            $table->string('role')->default('admin')->after('department_id');
            $table->string('status')->default('active')->after('role');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('department_id');
            $table->dropColumn(['employee_id', 'phone', 'role', 'status']);
        });
    }
};
