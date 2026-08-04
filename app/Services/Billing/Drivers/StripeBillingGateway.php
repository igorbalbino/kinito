<?php

namespace App\Services\Billing\Drivers;

use App\Contracts\Billing\BillingGateway;
use App\Models\Company;
use App\Models\Plan;
use App\Models\Subscription;
use App\Services\Billing\BillingCheckoutResult;
use App\Services\Billing\BillingWebhookEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;
use Stripe\Checkout\Session;
use Stripe\Customer;
use Stripe\Stripe;
use Stripe\StripeClient;
use Stripe\Webhook;
use Throwable;

class StripeBillingGateway implements BillingGateway
{
    public function driver(): string
    {
        return 'stripe';
    }

    public function isLive(): bool
    {
        return filled(config('kinito.stripe.secret'));
    }

    public function createCustomer(Company $company): string
    {
        if ($company->stripe_customer_id) {
            return $company->stripe_customer_id;
        }

        $this->configure();
        $customer = Customer::create([
            'name' => $company->name,
            'email' => $company->email,
            'metadata' => [
                'company_id' => (string) $company->id,
            ],
        ]);

        $company->update(['stripe_customer_id' => $customer->id]);

        return $customer->id;
    }

    public function startCheckout(
        Company $company,
        Plan $plan,
        string $successUrl,
        string $cancelUrl,
    ): BillingCheckoutResult {
        if (! filled($plan->stripe_price_id)) {
            throw new InvalidArgumentException('Plano sem stripe_price_id configurado.');
        }

        $this->configure();
        $customerId = $this->createCustomer($company);

        $session = Session::create([
            'mode' => 'subscription',
            'customer' => $customerId,
            'line_items' => [[
                'price' => $plan->stripe_price_id,
                'quantity' => 1,
            ]],
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
            'client_reference_id' => (string) $company->id,
            'metadata' => [
                'company_id' => (string) $company->id,
                'plan_id' => (string) $plan->id,
            ],
            'subscription_data' => [
                'metadata' => [
                    'company_id' => (string) $company->id,
                    'plan_id' => (string) $plan->id,
                ],
            ],
        ]);

        return new BillingCheckoutResult(
            (string) $session->url,
            (string) $session->id,
            $this->driver(),
        );
    }

    public function cancelSubscription(Subscription $subscription): void
    {
        if (! filled($subscription->stripe_subscription_id)) {
            return;
        }

        try {
            $this->configure();
            $stripe = new StripeClient((string) config('kinito.stripe.secret'));
            $stripe->subscriptions->cancel($subscription->stripe_subscription_id);
        } catch (Throwable $e) {
            Log::warning('Stripe cancel subscription failed.', [
                'subscription_id' => $subscription->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function verifyWebhook(Request $request): BillingWebhookEvent
    {
        $secret = (string) config('kinito.stripe.webhook_secret');
        $payload = $request->getContent();
        $sig = (string) $request->header('Stripe-Signature', '');

        if ($secret !== '' && $sig !== '') {
            $event = Webhook::constructEvent($payload, $sig, $secret);
            $type = $event->type;
            $object = $event->data->object;
            $data = json_decode(json_encode($object), true) ?? [];
        } else {
            $type = (string) $request->input('type', '');
            $data = (array) $request->input('data.object', $request->input('data', []));
        }

        $companyId = isset($data['metadata']['company_id'])
            ? (int) $data['metadata']['company_id']
            : (isset($data['client_reference_id']) ? (int) $data['client_reference_id'] : null);

        $planId = isset($data['metadata']['plan_id']) ? (int) $data['metadata']['plan_id'] : null;

        $externalSub = $data['subscription'] ?? $data['id'] ?? null;
        if (is_array($externalSub)) {
            $externalSub = $externalSub['id'] ?? null;
        }

        return new BillingWebhookEvent(
            type: $type,
            payload: $data,
            companyId: $companyId ?: null,
            planId: $planId ?: null,
            externalSubscriptionId: is_string($externalSub) ? $externalSub : null,
            externalCustomerId: isset($data['customer']) && is_string($data['customer']) ? $data['customer'] : null,
        );
    }

    private function configure(): void
    {
        $secret = (string) config('kinito.stripe.secret');
        if ($secret === '') {
            throw new InvalidArgumentException('STRIPE_SECRET não configurado.');
        }

        Stripe::setApiKey($secret);
    }
}
