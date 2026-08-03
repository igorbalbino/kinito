<?php

namespace App\Jobs;

use App\Models\RideDetailLog;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class PurgeExpiredRideDetailLogs implements ShouldQueue
{
    use Queueable;

    public function handle(): void
    {
        $days = (int) config('kinito.ride_detail_log_retention_days', 90);

        RideDetailLog::query()
            ->where('created_at', '<', now()->subDays($days))
            ->delete();
    }
}
