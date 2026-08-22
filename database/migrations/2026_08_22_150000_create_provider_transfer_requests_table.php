<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('provider_transfer_requests', function (Blueprint $table) {
            $table->id();
            $table->string('subject_type'); // client|driver
            $table->unsignedBigInteger('subject_id');
            $table->foreignId('to_company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('from_company_id')->nullable()->constrained('companies')->nullOnDelete();
            $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
            $table->string('status')->default('pending'); // pending|accepted|rejected
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['subject_type', 'subject_id', 'status']);
        });

        Schema::table('app_notifications', function (Blueprint $table) {
            $table->json('meta')->nullable()->after('link');
        });
    }

    public function down(): void
    {
        Schema::table('app_notifications', function (Blueprint $table) {
            $table->dropColumn('meta');
        });
        Schema::dropIfExists('provider_transfer_requests');
    }
};
