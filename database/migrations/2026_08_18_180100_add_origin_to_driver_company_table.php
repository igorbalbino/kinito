<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('driver_company', function (Blueprint $table) {
            $table->string('origin')->default('self')->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('driver_company', function (Blueprint $table) {
            $table->dropColumn('origin');
        });
    }
};
