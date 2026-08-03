<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CompanySetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Webhook inbound do whatsapp-gateway.
 * Headers: X-Internal-Api-Key, X-Medflow-Timestamp, X-Medflow-Signature
 * Payload user_id = company/session id
 */
class WhatsAppWebhookController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        if (! $this->authorizeGateway($request)) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $payload = $request->all();
        $companyId = (int) ($payload['user_id'] ?? 0);

        Log::info('WhatsApp inbound', [
            'company_id' => $companyId,
            'from' => $payload['from'] ?? null,
            'len' => strlen((string) ($payload['text'] ?? $payload['message'] ?? '')),
        ]);

        // Stub: acknowledge. Futuro: roteamento de conversas / bot.
        return response()->json([
            'success' => true,
            'received' => true,
            'flow' => 'ack',
        ]);
    }

    public function tick(Request $request): JsonResponse
    {
        if (! $this->authorizeGateway($request)) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // Stub: sem fila de outbox ainda.
        return response()->json([
            'success' => true,
            'flow' => 'tick',
            'enqueued' => 0,
            'claimed' => 0,
            'actions' => [],
        ]);
    }

    private function authorizeGateway(Request $request): bool
    {
        $apiKey = (string) config('kinito.whatsapp.gateway.api_key');
        $provided = (string) $request->header('X-Internal-Api-Key', '');

        if ($apiKey === '' || ! hash_equals($apiKey, $provided)) {
            return false;
        }

        $companyId = (int) $request->input('user_id', 0);
        $settings = CompanySetting::query()->where('company_id', $companyId)->first();
        $secret = $settings?->whatsapp_webhook_secret;

        // Tick pode não ter body com user_id em alguns casos — aceita só API key se sem secret.
        if (! $secret) {
            // Conexão ainda sem secret persistido: aceita API key (tick/health path).
            return true;
        }

        $timestamp = (string) $request->header('X-Medflow-Timestamp', '');
        $signature = (string) $request->header('X-Medflow-Signature', '');
        $body = $request->getContent();

        if ($timestamp === '' || $signature === '') {
            return false;
        }

        // Replay window 5 min
        if (abs(time() - (int) $timestamp) > 300) {
            return false;
        }

        $expected = hash_hmac('sha256', $timestamp."\n".$body, $secret);

        return hash_equals($expected, $signature);
    }
}
