<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('company_referrals', function (Blueprint $table) {
            $table->foreignId('referred_plan_id')->nullable()->after('reward_days')->constrained('plans')->nullOnDelete();
            $table->foreignId('referrer_plan_id')->nullable()->after('referred_plan_id')->constrained('plans')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('company_referrals', function (Blueprint $table) {
            $table->dropConstrainedForeignId('referred_plan_id');
            $table->dropConstrainedForeignId('referrer_plan_id');
        });
    }
};
