<?php

namespace App\Services\WhatsApp\Drivers;

use App\Contracts\WhatsApp\WhatsAppGateway;
use App\Services\WhatsApp\WhatsAppMessage;
use App\Services\WhatsApp\WhatsAppSendResult;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Meta WhatsApp Cloud API
 * @see https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages
 */
class MetaWhatsAppGateway implements WhatsAppGateway
{
    public function driver(): string
    {
        return 'meta';
    }

    public function isConfigured(): bool
    {
        return filled(config('kinito.whatsapp.meta.token'))
            && filled(config('kinito.whatsapp.meta.phone_number_id'));
    }

    public function sendText(WhatsAppMessage $message): WhatsAppSendResult
    {
        if (! $this->isConfigured()) {
            return WhatsAppSendResult::fail(
                $this->driver(),
                'Meta WhatsApp não configurado (WHATSAPP_META_TOKEN / WHATSAPP_META_PHONE_NUMBER_ID).'
            );
        }

        $phoneNumberId = config('kinito.whatsapp.meta.phone_number_id');
        $version = config('kinito.whatsapp.meta.graph_version', 'v21.0');
        $url = "https://graph.facebook.com/{$version}/{$phoneNumberId}/messages";

        $payload = [
            'messaging_product' => 'whatsapp',
            'recipient_type' => 'individual',
            'to' => $message->to,
            'type' => 'text',
            'text' => [
                'preview_url' => false,
                'body' => $message->body,
            ],
        ];

        // Template opcional (útil fora da janela de 24h)
        if (! empty($message->meta['template_name'])) {
            $payload = [
                'messaging_product' => 'whatsapp',
                'to' => $message->to,
                'type' => 'template',
                'template' => [
                    'name' => $message->meta['template_name'],
                    'language' => ['code' => $message->meta['template_language'] ?? 'pt_BR'],
                    'components' => $message->meta['template_components'] ?? [],
                ],
            ];
        }

        try {
            $response = Http::timeout((int) config('kinito.whatsapp.meta.timeout', 15))
                ->withToken((string) config('kinito.whatsapp.meta.token'))
                ->acceptJson()
                ->asJson()
                ->post($url, $payload);

            $json = $response->json() ?? [];

            if (! $response->successful()) {
                Log::error('WhatsApp Meta HTTP error.', [
                    'status' => $response->status(),
                    'body' => $json ?: $response->body(),
                ]);

                return WhatsAppSendResult::fail(
                    $this->driver(),
                    'Meta HTTP '.$response->status().': '.((string) data_get($json, 'error.message', 'erro')),
                    is_array($json) ? $json : []
                );
            }

            return WhatsAppSendResult::ok(
                $this->driver(),
                data_get($json, 'messages.0.id'),
                is_array($json) ? $json : []
            );
        } catch (Throwable $e) {
            Log::error('WhatsApp Meta exception.', ['error' => $e->getMessage()]);

            return WhatsAppSendResult::fail($this->driver(), $e->getMessage());
        }
    }
}
