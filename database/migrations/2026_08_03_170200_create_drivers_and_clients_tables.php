<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('drivers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('status')->default('PENDENTE');
            $table->string('vehicle_model')->nullable();
            $table->string('vehicle_plate')->nullable();
            $table->string('vehicle_color')->nullable();
            $table->string('city')->nullable();
            $table->decimal('rating', 3, 2)->default(5);
            $table->unsignedInteger('total_rides')->default(0);
            $table->decimal('total_earnings', 12, 2)->default(0);
            $table->decimal('pending_balance', 12, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('driver_company', function (Blueprint $table) {
            $table->id();
            $table->foreignId('driver_id')->constrained()->cascadeOnDelete();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('PENDENTE');
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['driver_id', 'company_id']);
        });

        Schema::create('driver_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('driver_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('status')->default('PENDENTE');
            $table->string('file_url')->nullable();
            $table->timestamp('uploaded_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('status')->default('ATIVO');
            $table->decimal('rating', 3, 2)->default(5);
            $table->unsignedInteger('total_rides')->default(0);
            $table->decimal('total_spent', 12, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('client_company', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->cascadeOnDelete();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('origin')->default('self'); // self|empresa|motorista
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['client_id', 'company_id']);
        });

        Schema::create('client_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('default_provider_mode')->default('ALL');
            $table->foreignId('default_company_id')->nullable()->constrained('companies')->nullOnDelete();
            $table->json('favorite_addresses')->nullable();
            $table->json('extra')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_preferences');
        Schema::dropIfExists('client_company');
        Schema::dropIfExists('clients');
        Schema::dropIfExists('driver_documents');
        Schema::dropIfExists('driver_company');
        Schema::dropIfExists('drivers');
    }
};
