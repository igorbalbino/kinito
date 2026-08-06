<?php

use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\BillingWebhookController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\CompanyWhatsAppController;
use App\Http\Controllers\Api\ConfigController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DriverController;
use App\Http\Controllers\Api\FinanceController;
use App\Http\Controllers\Api\LogController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PlanController;
use App\Http\Controllers\Api\ProviderController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\RideController;
use App\Http\Controllers\Api\StripeWebhookController;
use App\Http\Controllers\Api\WhatsAppWebhookController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
    Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:20,1');
    Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
    Route::post('/auth/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');
    Route::get('/auth/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');

    Route::post('/empresas/register', [CompanyController::class, 'register'])->middleware('throttle:10,1');

    Route::post('/webhooks/stripe', StripeWebhookController::class);
    Route::post('/webhooks/billing', BillingWebhookController::class);
    Route::get('/billing/mock/complete', [BillingWebhookController::class, 'mockComplete'])
        ->middleware('signed')
        ->name('billing.mock.complete');
    Route::post('/webhooks/whatsapp', WhatsAppWebhookController::class);
    Route::post('/webhooks/whatsapp/tick', [WhatsAppWebhookController::class, 'tick']);

    Route::get('/plans', [PlanController::class, 'index']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::patch('/auth/me', [AuthController::class, 'updateMe']);
        Route::post('/auth/change-password', [AuthController::class, 'changePassword']);
        Route::post('/auth/email/verification-notification', [AuthController::class, 'sendVerification']);

        Route::middleware('password.changed')->group(function () {
            Route::get('/dashboard', DashboardController::class);

            Route::get('/fornecedores', [ProviderController::class, 'index']);

            Route::get('/empresas', [CompanyController::class, 'index']);
            Route::get('/empresas/{company}', [CompanyController::class, 'show']);
            Route::patch('/empresas/{company}', [CompanyController::class, 'update']);
            Route::put('/empresas/{company}/settings', [CompanyController::class, 'updateSettings']);
            Route::post('/empresas/{company}/partnerships', [CompanyController::class, 'storePartnership']);
            Route::patch('/empresas/{company}/partnerships/{partnership}', [CompanyController::class, 'updatePartnership']);
            Route::post('/empresas/{company}/subscribe', [PlanController::class, 'subscribe']);
            Route::get('/empresas/{company}/subscription', [PlanController::class, 'status']);
            Route::post('/empresas/{company}/billing/mock-complete', [BillingWebhookController::class, 'mockComplete']);

            Route::get('/empresas/{company}/whatsapp', [CompanyWhatsAppController::class, 'status']);
            Route::post('/empresas/{company}/whatsapp/connect', [CompanyWhatsAppController::class, 'connect']);
            Route::delete('/empresas/{company}/whatsapp', [CompanyWhatsAppController::class, 'disconnect']);

            Route::get('/motoristas', [DriverController::class, 'index']);
            Route::get('/motoristas/{driver}', [DriverController::class, 'show']);
            Route::patch('/motoristas/{driver}', [DriverController::class, 'update']);
            Route::post('/motoristas/{driver}/approve', [DriverController::class, 'approve']);
            Route::post('/motoristas/{driver}/block', [DriverController::class, 'block']);
            Route::post('/motoristas/{driver}/link-company', [DriverController::class, 'linkCompany']);
            Route::post('/motoristas/{driver}/documents/{document}/review', [DriverController::class, 'reviewDocument']);

            Route::get('/clientes', [ClientController::class, 'index']);
            Route::post('/clientes', [ClientController::class, 'store']);
            Route::get('/clientes/{client}', [ClientController::class, 'show']);
            Route::patch('/clientes/{client}', [ClientController::class, 'update']);

            Route::get('/corridas', [RideController::class, 'index']);
            Route::post('/corridas', [RideController::class, 'store'])->middleware('throttle:60,1');
            Route::get('/corridas/{ride}', [RideController::class, 'show']);
            Route::post('/corridas/{ride}/accept', [RideController::class, 'accept']);
            Route::post('/corridas/{ride}/start', [RideController::class, 'start']);
            Route::post('/corridas/{ride}/finish', [RideController::class, 'finish']);
            Route::post('/corridas/{ride}/cancel', [RideController::class, 'cancel']);
            Route::post('/corridas/{ride}/reassign', [RideController::class, 'reassign']);
            Route::post('/corridas/{ride}/transfer-partner', [RideController::class, 'transferPartner']);
            Route::patch('/corridas/{ride}/finance', [RideController::class, 'manualFinance']);
            Route::post('/corridas/{ride}/payment-intent', [FinanceController::class, 'createPaymentIntent']);

            Route::get('/financeiro/transactions', [FinanceController::class, 'transactions']);
            Route::get('/financeiro/summary', [FinanceController::class, 'summary']);
            Route::get('/financeiro/meus-gastos', [FinanceController::class, 'mySpendings']);

            Route::get('/relatorios/own', [ReportController::class, 'own']);
            Route::get('/relatorios/received', [ReportController::class, 'received']);
            Route::get('/relatorios/forwarded', [ReportController::class, 'forwarded']);
            Route::get('/relatorios/consolidated', [ReportController::class, 'consolidated']);

            Route::get('/notificacoes', [NotificationController::class, 'index']);
            Route::post('/notificacoes/{notification}/read', [NotificationController::class, 'markRead']);
            Route::post('/notificacoes/read-all', [NotificationController::class, 'markAllRead']);

            Route::get('/logs/rides', [LogController::class, 'rideLogs']);
            Route::get('/logs/rides/details', [LogController::class, 'rideDetailLogs']);
            Route::get('/logs/audits', [LogController::class, 'audits']);

            Route::get('/config', [ConfigController::class, 'platform']);
            Route::put('/config', [ConfigController::class, 'updatePlatform']);

            Route::post('/plans', [PlanController::class, 'store']);
            Route::patch('/plans/{plan}', [PlanController::class, 'update']);
        });
    });
});
