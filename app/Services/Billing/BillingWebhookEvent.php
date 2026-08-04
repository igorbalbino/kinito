<?php

namespace App\Services\Billing;

class BillingWebhookEvent
{
    /**
     * @param  array<string, mixed>  $payload
     */
    public function __construct(
        public readonly string $type,
        public readonly array $payload,
        public readonly ?int $companyId = null,
        public readonly ?int $planId = null,
        public readonly ?string $externalSubscriptionId = null,
        public readonly ?string $externalCustomerId = null,
    ) {}
}
