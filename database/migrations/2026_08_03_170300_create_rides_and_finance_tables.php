<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rides', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->foreignId('client_id')->constrained()->restrictOnDelete();
            $table->foreignId('company_id')->constrained()->restrictOnDelete();
            $table->foreignId('partner_company_id')->nullable()->constrained('companies')->nullOnDelete();
            $table->foreignId('driver_id')->nullable()->constrained()->nullOnDelete();
            $table->json('origin');
            $table->json('destination');
            $table->date('scheduled_date')->nullable();
            $table->time('scheduled_time')->nullable();
            $table->decimal('distance_km', 8, 2)->default(0);
            $table->unsignedInteger('duration_min')->default(0);
            $table->string('status')->default('CRIADA');
            $table->string('financial_status')->default('INCOMPLETO');
            $table->string('payment_method')->default('pix');
            $table->string('payment_provider')->default('manual');
            $table->decimal('gross_value', 12, 2)->nullable();
            $table->decimal('stripe_fee', 12, 2)->default(0);
            $table->decimal('platform_commission', 12, 2)->default(0);
            $table->decimal('company_cut', 12, 2)->default(0);
            $table->decimal('driver_net', 12, 2)->default(0);
            $table->boolean('stripe_webhook_received')->default(false);
            $table->text('notes')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->text('manual_override_notes')->nullable();
            $table->decimal('rating', 3, 2)->nullable();
            $table->timestamp('requested_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'status']);
            $table->index(['driver_id', 'status']);
            $table->index(['client_id', 'status']);
            $table->index(['scheduled_date', 'status']);
        });

        Schema::create('ride_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ride_id')->constrained()->cascadeOnDelete();
            $table->string('client_name')->nullable();
            $table->string('driver_name')->nullable();
            $table->string('origin')->nullable();
            $table->string('destination')->nullable();
            $table->timestamp('occurred_at')->nullable();
            $table->string('status');
            $table->timestamps();
        });

        Schema::create('ride_detail_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ride_id')->constrained()->cascadeOnDelete();
            $table->json('payload');
            $table->timestamps();
            $table->index('created_at');
        });

        Schema::create('financial_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->foreignId('ride_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('company_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type');
            $table->decimal('amount', 12, 2);
            $table->decimal('gross_value', 12, 2)->nullable();
            $table->decimal('platform_fee', 12, 2)->nullable();
            $table->decimal('company_fee', 12, 2)->nullable();
            $table->decimal('driver_fee', 12, 2)->nullable();
            $table->decimal('stripe_fee', 12, 2)->nullable();
            $table->string('status')->default('PENDENTE');
            $table->string('payment_mode')->default('manual');
            $table->string('sender')->nullable();
            $table->string('recipient')->nullable();
            $table->string('description')->nullable();
            $table->timestamps();
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ride_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('company_id')->nullable()->constrained()->nullOnDelete();
            $table->string('provider')->default('manual');
            $table->string('stripe_payment_intent_id')->nullable()->index();
            $table->string('stripe_customer_id')->nullable();
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('brl');
            $table->string('status')->default('PENDENTE');
            $table->json('meta')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
        Schema::dropIfExists('financial_transactions');
        Schema::dropIfExists('ride_detail_logs');
        Schema::dropIfExists('ride_logs');
        Schema::dropIfExists('rides');
    }
};
