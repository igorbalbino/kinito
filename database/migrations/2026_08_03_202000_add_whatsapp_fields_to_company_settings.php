<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('company_settings', function (Blueprint $table) {
            $table->boolean('whatsapp_enabled')->default(false)->after('allow_partners');
            $table->boolean('whatsapp_connected')->default(false)->after('whatsapp_enabled');
            $table->string('whatsapp_phone')->nullable()->after('whatsapp_connected');
            $table->string('whatsapp_webhook_secret', 128)->nullable()->after('whatsapp_phone');
        });
    }

    public function down(): void
    {
        Schema::table('company_settings', function (Blueprint $table) {
            $table->dropColumn([
                'whatsapp_enabled',
                'whatsapp_connected',
                'whatsapp_phone',
                'whatsapp_webhook_secret',
            ]);
        });
    }
};
