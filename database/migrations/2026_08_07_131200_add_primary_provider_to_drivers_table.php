<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->foreignId('primary_company_id')->nullable()->after('user_id')->constrained('companies')->nullOnDelete();
            $table->foreignId('previous_primary_company_id')->nullable()->after('primary_company_id')->constrained('companies')->nullOnDelete();
            $table->boolean('provider_switch_pending')->default(false)->after('previous_primary_company_id');
        });
    }

    public function down(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->dropConstrainedForeignId('primary_company_id');
            $table->dropConstrainedForeignId('previous_primary_company_id');
            $table->dropColumn('provider_switch_pending');
        });
    }
};
