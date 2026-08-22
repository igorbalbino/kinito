<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Plan;
use App\Services\Billing\BillingManager;
use App\Services\Billing\Drivers\MockBillingGateway;
use App\Services\Subscription\SubscriptionLifecycleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class BillingWebhookController extends Controller
{
    public function __construct(
        private readonly BillingManager $billing,
        private readonly SubscriptionLifecycleService $lifecycle,
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        try {
            $event = $this->billing->driver()->verifyWebhook($request);
        } catch (Throwable $e) {
            Log::warning('Billing webhook rejected.', ['error' => $e->getMessage()]);

            return response()->json(['error' => 'Invalid webhook'], 400);
        }

        return $this->handleEvent(
            $event->type,
            $event->companyId,
            $event->planId,
            $event->externalSubscriptionId,
        );
    }

    public function mockComplete(Request $request, ?Company $company = null): JsonResponse|RedirectResponse
    {
        $gateway = $this->billing->driver();

        if (! $gateway instanceof MockBillingGateway) {
            return response()->json(['error' => 'Mock billing desabilitado.'], 403);
        }

        if (! app()->environment(['local', 'testing'])) {
            return response()->json(['error' => 'Mock billing só é permitido em ambiente local.'], 403);
        }

        $sessionId = (string) $request->query('session_id', $request->input('session_id', ''));

        try {
            $session = $gateway->pullSession($sessionId);
        } catch (Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }

        $sessionCompany = Company::query()->findOrFail($session['company_id']);

        if ($company) {
            $this->authorize('manage', $company);
            abort_unless((int) $company->id === (int) $sessionCompany->id, 403, 'Sessão não pertence a esta empresa.');
        }

        $plan = Plan::query()->findOrFail($session['plan_id']);
        $subscription = $this->lifecycle->activatePaid(
            $sessionCompany,
            $plan,
            'mock_sub_'.$sessionId,
        );

        $redirect = $this->safeRedirectTarget($request->query('redirect'));
        if ($redirect !== null) {
            return redirect()->to($redirect);
        }

        return response()->json([
            'message' => 'Assinatura ativada (mock).',
            'subscription' => $subscription,
        ]);
    }

    private function safeRedirectTarget(mixed $redirect): ?string
    {
        if (! is_string($redirect) || $redirect === '') {
            return null;
        }

        // Relative path only (same-origin SPA).
        if (Str::startsWith($redirect, '/') && ! Str::startsWith($redirect, '//')) {
            return $redirect;
        }

        $frontend = rtrim((string) config('kinito.frontend_url'), '/');
        if ($frontend !== '' && Str::startsWith($redirect, $frontend.'/')) {
            return $redirect;
        }

        return null;
    }

    private function handleEvent(
        string $type,
        ?int $companyId,
        ?int $planId,
        ?string $externalSubId,
    ): JsonResponse {
        if (in_array($type, ['checkout.session.completed', 'invoice.paid', 'customer.subscription.updated'], true)) {
            if (! $companyId || ! $planId) {
                return response()->json(['received' => true, 'skipped' => 'missing_ids']);
            }

            $company = Company::query()->find($companyId);
            $plan = Plan::query()->find($planId);

            if (! $company || ! $plan) {
                return response()->json(['received' => true, 'skipped' => 'not_found']);
            }

            if ($type === 'customer.subscription.updated' && $this->lifecycle->companyHasAccess($company)) {
                return response()->json(['received' => true, 'skipped' => 'already_active']);
            }

            $this->lifecycle->activatePaid($company, $plan, $externalSubId);

            return response()->json(['received' => true, 'activated' => true]);
        }

        if (in_array($type, ['customer.subscription.deleted', 'customer.subscription.canceled'], true) && $companyId) {
            $company = Company::query()->find($companyId);
            if ($company) {
                $this->lifecycle->suspendExpired($company);
            }

            return response()->json(['received' => true, 'suspended' => true]);
        }

        return response()->json(['received' => true]);
    }
}
