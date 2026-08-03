<?php

namespace App\Contracts\WhatsApp;

use App\Services\WhatsApp\WhatsAppMessage;
use App\Services\WhatsApp\WhatsAppSendResult;

interface WhatsAppGateway
{
    public function driver(): string;

    public function isConfigured(): bool;

    public function sendText(WhatsAppMessage $message): WhatsAppSendResult;
}
