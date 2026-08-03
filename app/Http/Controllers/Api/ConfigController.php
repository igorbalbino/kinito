<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FeatureFlag;
use App\Models\PlatformSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConfigController extends Controller
{
    public function platform(Request $request): JsonResponse
    {
        return response()->json([
            'paymentProvider' => config('kinito.payment_provider'),
            'commissions' => config('kinito.commissions'),
            'stripe' => [
                'feePercent' => config('kinito.stripe.fee_percent'),
                'feeFixed' => config('kinito.stripe.fee_fixed'),
                'configured' => filled(config('kinito.stripe.secret')),
            ],
            'settings' => PlatformSetting::query()->pluck('value', 'key'),
            'featureFlags' => FeatureFlag::query()->pluck('enabled', 'key'),
        ]);
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
            // Runtime note: prefer .env; this stores override visibility for admin UI.
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
