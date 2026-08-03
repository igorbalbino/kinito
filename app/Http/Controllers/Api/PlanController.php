<?php

namespace App\Http\Controllers\Api;

use App\Enums\SubscriptionStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\PlanResource;
use App\Models\Company;
use App\Models\Plan;
use App\Models\Subscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PlanController extends Controller
{
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
        ]);

        $subscription = Subscription::query()->create([
            'company_id' => $company->id,
            'plan_id' => $data['plan_id'],
            'status' => SubscriptionStatus::Active,
            'starts_at' => now(),
            'ends_at' => now()->addMonth(),
        ]);

        return response()->json([
            'message' => 'Assinatura criada (preparada para Stripe Billing).',
            'subscription' => $subscription->load('plan'),
        ], 201);
    }
}
