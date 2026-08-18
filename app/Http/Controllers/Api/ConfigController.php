<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FeatureFlag;
use App\Models\PlatformSetting;
use App\Services\Billing\BillingManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConfigController extends Controller
{
    public function platform(Request $request): JsonResponse
    {
        $billingManager = app(BillingManager::class);

        $payload = [
            'paymentProvider' => config('kinito.payment_provider'),
            'billingDriver' => $billingManager->resolveDefaultDriver(),
            'stripeConfigured' => filled(config('kinito.stripe.secret')),
            'trialDays' => (int) config('kinito.trial_days', 14),
            'featureFlags' => FeatureFlag::query()->pluck('enabled', 'key'),
        ];

        if ($request->user()?->hasRole('ADMIN')) {
            $payload['commissions'] = config('kinito.commissions');
            $payload['stripe'] = [
                'feePercent' => config('kinito.stripe.fee_percent'),
                'feeFixed' => config('kinito.stripe.fee_fixed'),
                'configured' => filled(config('kinito.stripe.secret')),
            ];
            $payload['settings'] = PlatformSetting::query()->pluck('value', 'key');
        }

        return response()->json($payload);
    }

    public function updatePlatform(Request $request): JsonResponse
    {
        abort_unless($request->user()->hasRole('ADMIN'), 403);

        $data = $request->validate([
            'payment_provider' => ['sometimes', 'in:stripe,manual'],
            'settings' => ['sometimes', 'array'],
            'feature_flags' => ['sometimes', 'array'],
        ]);

        if (isset($data['payment_provider'])) {
            PlatformSetting::setValue('PAYMENT_PROVIDER', $data['payment_provider']);
        }

        foreach ($data['settings'] ?? [] as $key => $value) {
            PlatformSetting::setValue((string) $key, $value);
        }

        foreach ($data['feature_flags'] ?? [] as $key => $enabled) {
            FeatureFlag::query()->updateOrCreate(
                ['key' => (string) $key],
                ['enabled' => (bool) $enabled]
            );
        }

        return $this->platform($request);
    }
}
