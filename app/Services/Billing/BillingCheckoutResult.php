<?php

namespace App\Services\Billing;

class BillingCheckoutResult
{
    public function __construct(
        public readonly string $url,
        public readonly string $sessionId,
        public readonly string $driver,
        public readonly array $meta = [],
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'checkout_url' => $this->url,
            'session_id' => $this->sessionId,
            'driver' => $this->driver,
            'meta' => $this->meta,
        ];
    }
}
