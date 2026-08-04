<?php

use App\Support\RedactSecrets;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('app_notifications')) {
            return;
        }

        DB::table('app_notifications')
            ->orderBy('id')
            ->chunkById(100, function ($rows): void {
                foreach ($rows as $row) {
                    $message = (string) ($row->message ?? '');
                    if (! RedactSecrets::containsSecret($message)) {
                        continue;
                    }

                    DB::table('app_notifications')
                        ->where('id', $row->id)
                        ->update(['message' => RedactSecrets::inText($message)]);
                }
            });
    }

    public function down(): void
    {
        // Irreversible redaction.
    }
};
