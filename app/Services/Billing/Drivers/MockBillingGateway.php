<?php

namespace App\Services\Billing\Drivers;

use App\Contracts\Billing\BillingGateway;
use App\Models\Company;
use App\Models\Plan;
use App\Models\Subscription;
use App\Services\Billing\BillingCheckoutResult;
use App\Services\Billing\BillingWebhookEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use InvalidArgumentException;

class MockBillingGateway implements BillingGateway
{
    public function driver(): string
    {
        return 'mock';
    }

    public function isLive(): bool
    {
        return false;
    }

    public function createCustomer(Company $company): string
    {
        $id = $company->stripe_customer_id ?: 'mock_cus_'.$company->id.'_'.Str::lower(Str::random(8));

        if (! $company->stripe_customer_id) {
            $company->update(['stripe_customer_id' => $id]);
        }

        return $id;
    }

    public function startCheckout(
        Company $company,
        Plan $plan,
        string $successUrl,
        string $cancelUrl,
    ): BillingCheckoutResult {
        $customerId = $this->createCustomer($company);
        $sessionId = 'mock_cs_'.Str::lower(Str::random(24));

        Cache::put("billing.mock.{$sessionId}", [
            'company_id' => $company->id,
            'plan_id' => $plan->id,
            'customer_id' => $customerId,
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
        ], now()->addHours(6));

        $url = URL::temporarySignedRoute(
            'billing.mock.complete',
            now()->addHours(6),
            ['session_id' => $sessionId]
        );

        return new BillingCheckoutResult($url, $sessionId, $this->driver(), [
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
        ]);
    }

    public function cancelSubscription(Subscription $subscription): void
    {
        // no-op in mock
    }

    public function verifyWebhook(Request $request): BillingWebhookEvent
    {
        $this->assertMockWebhookAllowed($request);

        $type = (string) $request->input('type', 'checkout.session.completed');
        $sessionId = (string) $request->input('session_id', '');

        $cached = $sessionId !== '' ? Cache::get("billing.mock.{$sessionId}") : null;

        if (! is_array($cached) || empty($cached['company_id']) || empty($cached['plan_id'])) {
            throw new InvalidArgumentException('Mock billing webhook exige session_id válido.');
        }

        return new BillingWebhookEvent(
            type: $type,
            payload: $request->all(),
            companyId: (int) $cached['company_id'],
            planId: (int) $cached['plan_id'],
            externalSubscriptionId: 'mock_sub_'.($sessionId ?: Str::random(8)),
            externalCustomerId: $cached['customer_id'] ?? null,
        );
    }

    private function assertMockWebhookAllowed(Request $request): void
    {
        if (! app()->environment(['local', 'testing'])) {
            throw new InvalidArgumentException('Mock billing webhook só é permitido em ambiente local.');
        }

        $secret = (string) config('kinito.billing.mock_webhook_secret', '');
        if ($secret === '') {
            throw new InvalidArgumentException('BILLING_MOCK_WEBHOOK_SECRET não configurado.');
        }

        $provided = (string) $request->header('X-Billing-Mock-Secret', '');
        if ($provided === '' || ! hash_equals($secret, $provided)) {
            throw new InvalidArgumentException('Secret de mock billing inválido.');
        }
    }

    /**
     * @return array{company_id: int, plan_id: int, customer_id: string}|null
     */
    public function pullSession(string $sessionId): ?array
    {
        $data = Cache::pull("billing.mock.{$sessionId}");

        if (! is_array($data) || empty($data['company_id']) || empty($data['plan_id'])) {
            throw new InvalidArgumentException('Sessão de checkout mock inválida ou expirada.');
        }

        return [
            'company_id' => (int) $data['company_id'],
            'plan_id' => (int) $data['plan_id'],
            'customer_id' => (string) ($data['customer_id'] ?? ''),
        ];
    }
}
