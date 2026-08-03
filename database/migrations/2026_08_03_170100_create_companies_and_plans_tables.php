<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2)->default(0);
            $table->string('billing_period')->default('monthly');
            $table->unsignedInteger('max_drivers')->nullable();
            $table->unsignedInteger('max_rides_month')->nullable();
            $table->json('features')->nullable();
            $table->boolean('is_active')->default(true);
            $table->string('stripe_price_id')->nullable();
            $table->timestamps();
        });

        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('cnpj', 18)->unique();
            $table->string('email');
            $table->string('phone')->nullable();
            $table->string('logo')->nullable();
            $table->decimal('commission_rate', 5, 2)->default(10);
            $table->boolean('is_distributor')->default(true);
            $table->boolean('is_provider')->default(true);
            $table->boolean('is_partner_enabled')->default(true);
            $table->boolean('is_active')->default(true);
            $table->string('stripe_customer_id')->nullable();
            $table->timestamps();
        });

        Schema::create('company_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('modelo_corridas')->default('AMBOS');
            $table->boolean('accept_instant_rides')->default(true);
            $table->boolean('allow_scheduling')->default(true);
            $table->boolean('stripe_enabled')->default(false);
            $table->boolean('notifications_enabled')->default(true);
            $table->boolean('allow_partners')->default(true);
            $table->json('extra')->nullable();
            $table->timestamps();
        });

        Schema::create('company_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role')->default('atendimento');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['company_id', 'user_id']);
        });

        Schema::create('company_partnerships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('partner_company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('status')->default('PENDING');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->unique(['company_id', 'partner_company_id']);
        });

        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('plan_id')->constrained()->restrictOnDelete();
            $table->string('status')->default('TRIALING');
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamp('trial_ends_at')->nullable();
            $table->string('stripe_subscription_id')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('company_partnerships');
        Schema::dropIfExists('company_user');
        Schema::dropIfExists('company_settings');
        Schema::dropIfExists('companies');
        Schema::dropIfExists('plans');
    }
};
