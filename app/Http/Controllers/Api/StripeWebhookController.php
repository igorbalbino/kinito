<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Finance\FinanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stripe\Webhook;
use Throwable;

class StripeWebhookController extends Controller
{
    public function __construct(private readonly FinanceService $finance) {}

    public function __invoke(Request $request): JsonResponse
    {
        try {
            $payload = $this->verifiedPayload($request);
        } catch (Throwable $e) {
            Log::warning('Ride Stripe webhook rejected.', ['error' => $e->getMessage()]);

            return response()->json(['error' => 'Invalid webhook'], 400);
        }

        $this->finance->handleStripeWebhook($payload);

        return response()->json(['received' => true]);
    }

    /**
     * @return array<string, mixed>
     */
    private function verifiedPayload(Request $request): array
    {
        if ($this->finance->paymentDriver() === 'stripe') {
            $secret = (string) config('kinito.stripe.webhook_secret');
            $sig = (string) $request->header('Stripe-Signature', '');

            if ($secret === '' || $sig === '') {
                throw new \RuntimeException('Stripe webhook secret/signature required.');
            }

            $event = Webhook::constructEvent($request->getContent(), $sig, $secret);

            return [
                'type' => $event->type,
                'data' => [
                    'object' => json_decode(json_encode($event->data->object), true) ?? [],
                ],
            ];
        }

        $payload = $request->all();
        $this->finance->assertValidMockRideWebhook($payload);

        return $payload;
    }
}
