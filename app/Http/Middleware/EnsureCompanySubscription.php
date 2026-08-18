<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use App\Models\Company;
use App\Services\Subscription\SubscriptionLifecycleService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCompanySubscription
{
    /** @var list<string> */
    private const WHITELIST = [
        'api/v1/auth/logout',
        'api/v1/auth/me',
        'api/v1/auth/change-password',
        'api/v1/config',
    ];

    public function __construct(
        private readonly SubscriptionLifecycleService $lifecycle,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->isActingAs(UserRole::Empresa)) {
            return $next($request);
        }

        if ($user->isActingAs(UserRole::Admin) && $user->hasRole(UserRole::Admin->value)) {
            return $next($request);
        }

        if ($this->isWhitelisted($request)) {
            return $next($request);
        }

        $company = $this->resolveCompany($request, $user);

        if (! $company) {
            return response()->json([
                'message' => 'Selecione um plano para continuar.',
                'code' => 'subscription_required',
            ], 403);
        }

        if ($this->lifecycle->companyHasAccess($company)) {
            return $next($request);
        }

        return response()->json([
            'message' => 'Assinatura inativa ou trial expirado. Escolha um plano para continuar.',
            'code' => 'subscription_required',
            'company_id' => $company->id,
        ], 403);
    }

    private function isWhitelisted(Request $request): bool
    {
        $path = trim($request->path(), '/');

        foreach (self::WHITELIST as $allowed) {
            if ($path === trim($allowed, '/')) {
                return true;
            }
        }

        if (preg_match('#^api/v1/empresas/\d+/subscribe$#', $path)) {
            return true;
        }

        if (preg_match('#^api/v1/empresas/\d+/subscription$#', $path)) {
            return true;
        }

        return false;
    }

    private function resolveCompany(Request $request, \App\Models\User $user): ?Company
    {
        $routeCompany = $request->route('company');

        if ($routeCompany instanceof Company) {
            return $user->canAccessCompany($routeCompany) ? $routeCompany : null;
        }

        return $user->primaryCompany();
    }
}
