<?php

namespace App\Services\WhatsApp;

class WhatsAppSendResult
{
    public function __construct(
        public readonly bool $success,
        public readonly string $driver,
        public readonly ?string $externalId = null,
        public readonly ?string $error = null,
        public readonly array $raw = [],
    ) {}

    public static function ok(string $driver, ?string $externalId = null, array $raw = []): self
    {
        return new self(true, $driver, $externalId, null, $raw);
    }

    public static function fail(string $driver, string $error, array $raw = []): self
    {
        return new self(false, $driver, null, $error, $raw);
    }
}
