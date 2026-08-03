<?php

namespace App\Services\WhatsApp;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Cliente HTTP do sidecar em whatsapp-gateway/ (Baileys).
 * Auth: header X-Gateway-Key (mesmo valor de GATEWAY_API_KEY).
 */
class WhatsAppGatewayClient
{
    public function isConfigured(): bool
    {
        return filled(config('kinito.whatsapp.gateway.url'))
            && filled(config('kinito.whatsapp.gateway.api_key'));
    }

    /**
     * @return array{ok: bool, code: int, data: array<string, mixed>}
     */
    public function request(string $method, string $path, ?array $body = null): array
    {
        if (! $this->isConfigured()) {
            return ['ok' => false, 'code' => 0, 'data' => ['error' => 'gateway_not_configured']];
        }

        $url = rtrim((string) config('kinito.whatsapp.gateway.url'), '/').$path;

        try {
            /** @var PendingRequest $http */
            $http = Http::timeout((int) config('kinito.whatsapp.gateway.timeout', 20))
                ->acceptJson()
                ->asJson()
                ->withHeaders([
                    'X-Gateway-Key' => (string) config('kinito.whatsapp.gateway.api_key'),
                ]);

            $response = match (strtoupper($method)) {
                'GET' => $http->get($url),
                'DELETE' => $http->delete($url),
                default => $http->send($method, $url, $body !== null ? ['json' => $body] : []),
            };

            $data = $response->json();

            return [
                'ok' => $response->successful(),
                'code' => $response->status(),
                'data' => is_array($data) ? $data : ['raw' => $response->body()],
            ];
        } catch (\Throwable $e) {
            Log::error('WhatsApp gateway request failed.', [
                'method' => $method,
                'path' => $path,
                'error' => $e->getMessage(),
            ]);

            return ['ok' => false, 'code' => 0, 'data' => ['error' => $e->getMessage()]];
        }
    }

    public function status(int|string $sessionId): array
    {
        return $this->request('GET', "/sessions/{$sessionId}/status");
    }

    public function connect(int|string $sessionId, string $webhookSecret): array
    {
        return $this->request('POST', "/sessions/{$sessionId}/connect", [
            'webhook_secret' => $webhookSecret,
        ]);
    }

    public function disconnect(int|string $sessionId): array
    {
        return $this->request('DELETE', "/sessions/{$sessionId}");
    }

    public function send(int|string $sessionId, string $phone, string $message, ?string $jid = null): array
    {
        return $this->request('POST', "/sessions/{$sessionId}/send", array_filter([
            'phone' => $phone ?: null,
            'message' => $message,
            'jid' => $jid,
        ]));
    }
}
