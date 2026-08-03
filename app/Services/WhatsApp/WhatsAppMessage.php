<?php

namespace App\Services\WhatsApp;

class WhatsAppMessage
{
    public function __construct(
        public readonly string $to,
        public readonly string $body,
        public readonly ?string $userId = null,
        public readonly array $meta = [],
    ) {}

    /**
     * Normaliza telefone para dígitos (E.164-ish). Ex: +55 11 99999-9999 → 5511999999999
     */
    public static function normalizePhone(?string $phone): ?string
    {
        if (! filled($phone)) {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $phone) ?? '';

        return strlen($digits) >= 10 ? $digits : null;
    }
}
