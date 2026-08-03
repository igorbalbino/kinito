<?php

namespace App\Services\WhatsApp;

use App\Contracts\WhatsApp\WhatsAppGateway;
use App\Models\User;
use App\Services\WhatsApp\Drivers\BaileysWhatsAppGateway;
use App\Services\WhatsApp\Drivers\LogWhatsAppGateway;
use App\Services\WhatsApp\Drivers\MetaWhatsAppGateway;
use InvalidArgumentException;

/**
 * Resolve o driver ativo (baileys|meta|log) via config/env.
 * Trocar provider: WHATSAPP_PROVIDER=baileys|meta|log
 */
class WhatsAppManager
{
    /** @var array<string, class-string<WhatsAppGateway>> */
    protected array $drivers = [
        'log' => LogWhatsAppGateway::class,
        'baileys' => BaileysWhatsAppGateway::class,
        'meta' => MetaWhatsAppGateway::class,
    ];

    public function driver(?string $name = null): WhatsAppGateway
    {
        $name = $name ?? (string) config('kinito.whatsapp.provider', 'log');

        if (! isset($this->drivers[$name])) {
            throw new InvalidArgumentException("WhatsApp driver [{$name}] não suportado. Use: log, baileys, meta.");
        }

        return app($this->drivers[$name]);
    }

    public function extend(string $name, string $gatewayClass): void
    {
        $this->drivers[$name] = $gatewayClass;
    }

    public function isEnabled(): bool
    {
        return (bool) config('kinito.whatsapp.enabled', false)
            && $this->driver()->isConfigured();
    }

    public function sendText(string $to, string $body, ?string $userId = null, array $meta = []): WhatsAppSendResult
    {
        $phone = WhatsAppMessage::normalizePhone($to);

        if (! $phone) {
            return WhatsAppSendResult::fail($this->driver()->driver(), 'Telefone inválido.');
        }

        if (! config('kinito.whatsapp.enabled', false)) {
            return WhatsAppSendResult::fail($this->driver()->driver(), 'WhatsApp desabilitado (WHATSAPP_ENABLED=false).');
        }

        $gateway = $this->driver();

        if (! $gateway->isConfigured()) {
            return WhatsAppSendResult::fail($gateway->driver(), "Driver [{$gateway->driver()}] não configurado.");
        }

        return $gateway->sendText(new WhatsAppMessage($phone, $body, $userId, $meta));
    }

    public function sendToUser(User $user, string $body, array $meta = []): WhatsAppSendResult
    {
        return $this->sendText((string) $user->phone, $body, (string) $user->id, $meta);
    }
}
