<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Finance\FinanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StripeWebhookController extends Controller
{
    public function __construct(private readonly FinanceService $finance) {}

    public function __invoke(Request $request): JsonResponse
    {
        // Signature verification stub — enable when STRIPE_WEBHOOK_SECRET is set.
        $secret = config('kinito.stripe.webhook_secret');
        if ($secret) {
            $signature = $request->header('Stripe-Signature');
            if (! $signature) {
                return response()->json(['message' => 'Assinatura ausente.'], 400);
            }
            // Full Stripe\Webhook::constructEvent verification can be enabled here.
        }

        $this->finance->handleStripeWebhook($request->all());

        return response()->json(['received' => true]);
    }
}
