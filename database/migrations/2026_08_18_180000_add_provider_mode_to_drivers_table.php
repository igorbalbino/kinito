<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->string('provider_mode')->default('COMPANY')->after('provider_switch_pending');
            $table->json('provider_restore')->nullable()->after('provider_mode');
        });
    }

    public function down(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->dropColumn(['provider_mode', 'provider_restore']);
        });
    }
};
