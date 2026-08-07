<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PlanResource;
use App\Models\Company;
use App\Models\Plan;
use App\Services\Referral\ReferralService;
use App\Services\Subscription\SubscriptionLifecycleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use InvalidArgumentException;

class PlanController extends Controller
{
    public function __construct(
        private readonly SubscriptionLifecycleService $lifecycle,
        private readonly ReferralService $referrals,
    ) {}

    public function index(): AnonymousResourceCollection
    {
        return PlanResource::collection(Plan::query()->where('is_active', true)->orderBy('price')->get());
    }

    public function store(Request $request): PlanResource
    {
        abort_unless($request->user()->hasRole('ADMIN'), 403);

        $data = $request->validate([
            'slug' => ['required', 'string', 'unique:plans,slug'],
            'name' => ['required', 'string'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'billing_period' => ['nullable', 'string'],
            'max_drivers' => ['nullable', 'integer', 'min:0'],
            'max_rides_month' => ['nullable', 'integer', 'min:0'],
            'features' => ['nullable', 'array'],
            'is_active' => ['sometimes', 'boolean'],
            'stripe_price_id' => ['nullable', 'string'],
        ]);

        return new PlanResource(Plan::query()->create($data));
    }

    public function update(Request $request, Plan $plan): PlanResource
    {
        abort_unless($request->user()->hasRole('ADMIN'), 403);

        $data = $request->validate([
            'name' => ['sometimes', 'string'],
            'description' => ['nullable', 'string'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'billing_period' => ['nullable', 'string'],
            'max_drivers' => ['nullable', 'integer', 'min:0'],
            'max_rides_month' => ['nullable', 'integer', 'min:0'],
            'features' => ['nullable', 'array'],
            'is_active' => ['sometimes', 'boolean'],
            'stripe_price_id' => ['nullable', 'string'],
        ]);

        $plan->update($data);

        return new PlanResource($plan);
    }

    public function subscribe(Request $request, Company $company): JsonResponse
    {
        $this->authorize('manage', $company);

        $data = $request->validate([
            'plan_id' => ['required', 'exists:plans,id'],
            'mode' => ['nullable', 'in:trial,checkout,auto'],
            'success_url' => ['nullable', 'url'],
            'cancel_url' => ['nullable', 'url'],
        ]);

        $plan = Plan::query()->findOrFail($data['plan_id']);
        $frontend = rtrim((string) config('kinito.frontend_url'), '/');
        $successUrl = $data['success_url'] ?? "{$frontend}/configuracoes?billing=success";
        $cancelUrl = $data['cancel_url'] ?? "{$frontend}/configuracoes?billing=cancel";
        $mode = $data['mode'] ?? 'auto';

        try {
            $result = $this->lifecycle->subscribe($company, $plan, $mode, $successUrl, $cancelUrl);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $message = $result['mode'] === 'trial'
            ? 'Teste de 14 dias iniciado.'
            : 'Checkout de assinatura criado.';

        return response()->json([
            'message' => $message,
            'mode' => $result['mode'],
            'subscription' => $result['subscription']?->load('plan'),
            'checkout' => $result['checkout'] ?? null,
            'has_access' => $this->lifecycle->companyHasAccess($company->fresh()),
        ], $result['mode'] === 'trial' ? 201 : 200);
    }

    public function status(Request $request, Company $company): JsonResponse
    {
        $this->authorize('view', $company);

        $sub = $this->lifecycle->currentSubscription($company);

        return response()->json([
            'has_access' => $this->lifecycle->companyHasAccess($company),
            'trial_used' => (bool) $company->trial_used_at,
            'trial_used_at' => $company->trial_used_at,
            'subscription' => $sub?->load('plan'),
            'referral' => $this->referrals->summaryFor($company),
        ]);
    }
}
