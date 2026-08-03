<?php

namespace App\Services\WhatsApp\Drivers;

use App\Contracts\WhatsApp\WhatsAppGateway;
use App\Models\Company;
use App\Services\WhatsApp\WhatsAppGatewayClient;
use App\Services\WhatsApp\WhatsAppMessage;
use App\Services\WhatsApp\WhatsAppSendResult;
use Illuminate\Support\Facades\Log;

/**
 * Envia via sidecar whatsapp-gateway (Baileys).
 * Session = company_id em meta['company_id'] ou primeira empresa conectada.
 */
class BaileysWhatsAppGateway implements WhatsAppGateway
{
    public function __construct(
        private readonly WhatsAppGatewayClient $client,
    ) {}

    public function driver(): string
    {
        return 'baileys';
    }

    public function isConfigured(): bool
    {
        return $this->client->isConfigured();
    }

    public function sendText(WhatsAppMessage $message): WhatsAppSendResult
    {
        if (! $this->isConfigured()) {
            return WhatsAppSendResult::fail(
                $this->driver(),
                'Gateway WhatsApp não configurado (WHATSAPP_GATEWAY_URL / WHATSAPP_GATEWAY_API_KEY).'
            );
        }

        $sessionId = $message->meta['company_id']
            ?? $message->meta['session_id']
            ?? $this->resolveConnectedSessionId();

        if (! $sessionId) {
            return WhatsAppSendResult::fail(
                $this->driver(),
                'Nenhuma empresa com WhatsApp conectado. Conecte em Configurações.'
            );
        }

        $result = $this->client->send((string) $sessionId, $message->to, $message->body);

        if (! $result['ok']) {
            Log::error('WhatsApp Baileys send failed.', $result);

            return WhatsAppSendResult::fail(
                $this->driver(),
                (string) ($result['data']['error'] ?? 'gateway_error '.$result['code']),
                $result['data']
            );
        }

        return WhatsAppSendResult::ok(
            $this->driver(),
            data_get($result['data'], 'key.id') ?? data_get($result['data'], 'id'),
            $result['data']
        );
    }

    private function resolveConnectedSessionId(): ?string
    {
        $companyId = Company::query()
            ->whereHas('settings', fn ($q) => $q->where('whatsapp_connected', true))
            ->value('id');

        return $companyId ? (string) $companyId : null;
    }
}
