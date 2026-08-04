<?php

namespace App\Services\Billing;

use App\Contracts\Billing\BillingGateway;
use App\Services\Billing\Drivers\MockBillingGateway;
use App\Services\Billing\Drivers\StripeBillingGateway;
use InvalidArgumentException;

class BillingManager
{
    /** @var array<string, class-string<BillingGateway>> */
    protected array $drivers = [
        'mock' => MockBillingGateway::class,
        'stripe' => StripeBillingGateway::class,
    ];

    public function driver(?string $name = null): BillingGateway
    {
        $name ??= $this->resolveDefaultDriver();

        if (! isset($this->drivers[$name])) {
            throw new InvalidArgumentException("Billing driver [{$name}] não suportado.");
        }

        return app($this->drivers[$name]);
    }

    public function resolveDefaultDriver(): string
    {
        $configured = (string) config('kinito.billing.driver', 'auto');

        if ($configured === 'auto') {
            return filled(config('kinito.stripe.secret')) ? 'stripe' : 'mock';
        }

        if ($configured === 'stripe' && ! filled(config('kinito.stripe.secret'))) {
            return 'mock';
        }

        return $configured;
    }
}
