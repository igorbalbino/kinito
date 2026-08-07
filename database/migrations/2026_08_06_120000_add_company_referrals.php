<?php

use App\Models\Company;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->string('referral_code', 16)->nullable()->unique()->after('slug');
        });

        Schema::create('company_referrals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('referrer_company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('referred_company_id')->unique()->constrained('companies')->cascadeOnDelete();
            $table->string('referral_code', 16);
            $table->string('status', 20)->default('pending');
            $table->timestamp('rewarded_at')->nullable();
            $table->unsignedSmallInteger('reward_days')->default(30);
            $table->timestamps();

            $table->index(['referrer_company_id', 'status']);
        });

        Company::query()->whereNull('referral_code')->orderBy('id')->each(function (Company $company) {
            do {
                $code = strtoupper(Str::random(8));
            } while (Company::query()->where('referral_code', $code)->exists());

            $company->forceFill(['referral_code' => $code])->saveQuietly();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('company_referrals');

        Schema::table('companies', function (Blueprint $table) {
            $table->dropUnique(['referral_code']);
            $table->dropColumn('referral_code');
        });
    }
};
