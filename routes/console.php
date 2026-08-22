<?php

use App\Jobs\PurgeExpiredRideDetailLogs;
use Illuminate\Support\Facades\Schedule;

Schedule::job(new PurgeExpiredRideDetailLogs)->daily();
Schedule::command('subscriptions:expire-trials')->hourly();
