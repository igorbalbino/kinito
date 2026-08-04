<?php

namespace App\Contracts\Billing;

use App\Models\Company;
use App\Models\Plan;
use App\Models\Subscription;
use App\Services\Billing\BillingCheckoutResult;
use App\Services\Billing\BillingWebhookEvent;
use Illuminate\Http\Request;

interface BillingGateway
{
    public function driver(): string;

    public function isLive(): bool;

    public function createCustomer(Company $company): string;

    public function startCheckout(
        Company $company,
        Plan $plan,
        string $successUrl,
        string $cancelUrl,
    ): BillingCheckoutResult;

    public function cancelSubscription(Subscription $subscription): void;

    public function verifyWebhook(Request $request): BillingWebhookEvent;
}
