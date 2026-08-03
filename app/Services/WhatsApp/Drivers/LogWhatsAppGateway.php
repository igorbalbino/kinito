<?php

namespace App\Services\WhatsApp\Drivers;

use App\Contracts\WhatsApp\WhatsAppGateway;
use App\Services\WhatsApp\WhatsAppMessage;
use App\Services\WhatsApp\WhatsAppSendResult;
use Illuminate\Support\Facades\Log;

/**
 * Driver padrão / desligado — só registra no log.
 */
class LogWhatsAppGateway implements WhatsAppGateway
{
    public function driver(): string
    {
        return 'log';
    }

    public function isConfigured(): bool
    {
        return true;
    }

    public function sendText(WhatsAppMessage $message): WhatsAppSendResult
    {
        Log::info('WhatsApp [log] mensagem simulada.', [
            'to' => $message->to,
            'body' => $message->body,
            'user_id' => $message->userId,
            'meta' => $message->meta,
        ]);

        return WhatsAppSendResult::ok($this->driver(), 'log-'.uniqid());
    }
}
