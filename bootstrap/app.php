<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        apiPrefix: 'api',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // API is token-based (Sanctum personal access tokens). Do not enable
        // statefulApi() — it applies CSRF to requests from SPA origins and
        // breaks Bearer-auth clients (Vite front on another port).

        $middleware->alias([
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
            'password.changed' => \App\Http\Middleware\EnsurePasswordChanged::class,
            'verified.api' => \App\Http\Middleware\EnsureEmailIsVerified::class,
            'company.subscription' => \App\Http\Middleware\EnsureCompanySubscription::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );

        $exceptions->render(function (\InvalidArgumentException $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            $message = $e->getMessage();
            if (! app()->environment(['local', 'testing'])) {
                \Illuminate\Support\Facades\Log::warning('API InvalidArgumentException', [
                    'message' => $message,
                    'path' => $request->path(),
                ]);
                $message = 'Não foi possível processar a solicitação.';
            }

            return response()->json([
                'message' => $message,
            ], 422);
        });

        $exceptions->render(function (\Stripe\Exception\ApiErrorException $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            \Illuminate\Support\Facades\Log::warning('Stripe API error', [
                'message' => $e->getMessage(),
                'path' => $request->path(),
            ]);

            $message = app()->environment(['local', 'testing'])
                ? $e->getMessage()
                : 'Falha no processamento de pagamento.';

            return response()->json(['message' => $message], 422);
        });
    })->create();
