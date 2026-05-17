<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('visits', function (Blueprint $table) {
            $table->string('consulting_room')->nullable()->after('status');
            $table->text('route_notes')->nullable()->after('consulting_room');
            $table->string('routed_by')->nullable()->after('route_notes');
            $table->timestamp('routed_to_doctor_at')->nullable()->after('routed_by');
        });
    }

    public function down(): void
    {
        Schema::table('visits', function (Blueprint $table) {
            $table->dropColumn([
                'consulting_room',
                'route_notes',
                'routed_by',
                'routed_to_doctor_at',
            ]);
        });
    }
};
