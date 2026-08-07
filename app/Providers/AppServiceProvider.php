<?php

namespace App\Providers;

use App\Contracts\Billing\BillingGateway;
use App\Contracts\WhatsApp\WhatsAppGateway;
use App\Services\Billing\BillingManager;
use App\Services\WhatsApp\WhatsAppManager;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(WhatsAppManager::class);
        $this->app->singleton(BillingManager::class);

        $this->app->bind(WhatsAppGateway::class, function ($app) {
            return $app->make(WhatsAppManager::class)->driver();
        });

        $this->app->bind(BillingGateway::class, function ($app) {
            return $app->make(BillingManager::class)->driver();
        });
    }

    public function boot(): void
    {
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(120)->by($request->user()?->id ?: $request->ip());
        });

        VerifyEmail::createUrlUsing(function (object $notifiable) {
            return app(\App\Services\Notification\NotificationService::class)
                ->verificationUrl($notifiable);
        });

        ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
            $frontend = rtrim(config('kinito.frontend_url'), '/');

            return $frontend.'/reset-password?token='.$token.'&email='.urlencode($notifiable->getEmailForPasswordReset());
        });
    }
}
