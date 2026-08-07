<?php

namespace App\Services\Subscription;

use App\Enums\DefaultProviderMode;
use App\Enums\SubscriptionStatus;
use App\Models\ClientPreference;
use App\Models\Company;
use App\Models\Plan;
use App\Models\Subscription;
use App\Services\Audit\AuditService;
use App\Services\Billing\BillingManager;
use App\Services\Referral\ReferralService;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class SubscriptionLifecycleService
{
    public function __construct(
        private readonly AuditService $audit,
        private readonly BillingManager $billing,
        private readonly ReferralService $referrals,
    ) {}

    public function companyHasAccess(Company $company): bool
    {
        $sub = $this->currentSubscription($company);

        if (! $sub) {
            return false;
        }

        if ($sub->status === SubscriptionStatus::Trialing) {
            return $sub->trial_ends_at !== null && $sub->trial_ends_at->isFuture();
        }

        if ($sub->status === SubscriptionStatus::Active) {
            return $sub->ends_at === null || $sub->ends_at->isFuture();
        }

        return false;
    }

    public function currentSubscription(Company $company): ?Subscription
    {
        return $company->subscriptions()
            ->with('plan')
            ->orderByDesc('id')
            ->first();
    }

    public function startTrial(Company $company, Plan $plan): Subscription
    {
        if ($company->trial_used_at) {
            throw new InvalidArgumentException('Esta empresa já utilizou o período de teste.');
        }

        if ($this->companyHasAccess($company)) {
            throw new InvalidArgumentException('A empresa já possui acesso ativo.');
        }

        return DB::transaction(function () use ($company, $plan) {
            $this->cancelOpenTrials($company);

            $subscription = Subscription::query()->create([
                'company_id' => $company->id,
                'plan_id' => $plan->id,
                'status' => SubscriptionStatus::Trialing,
                'starts_at' => now(),
                'trial_ends_at' => now()->addDays(14),
            ]);

            $company->update([
                'trial_used_at' => now(),
                'is_active' => true,
                'is_provider' => true,
            ]);

            $this->audit->log('SUBSCRIPTION_TRIAL_STARTED', auth()->user(), $subscription, null, [
                'plan_id' => $plan->id,
                'trial_ends_at' => $subscription->trial_ends_at?->toIso8601String(),
            ]);

            return $subscription->load('plan');
        });
    }

    public function activatePaid(Company $company, Plan $plan, ?string $externalSubId = null): Subscription
    {
        $subscription = DB::transaction(function () use ($company, $plan, $externalSubId) {
            $this->cancelOpenTrials($company);

            $endsAt = $this->periodEnd($plan);

            $subscription = Subscription::query()->create([
                'company_id' => $company->id,
                'plan_id' => $plan->id,
                'status' => SubscriptionStatus::Active,
                'starts_at' => now(),
                'ends_at' => $endsAt,
                'stripe_subscription_id' => $externalSubId,
            ]);

            $company->update([
                'is_active' => true,
                'is_provider' => true,
            ]);

            $this->restoreClientProviders($company);

            $this->audit->log('SUBSCRIPTION_ACTIVATED', auth()->user(), $subscription, null, [
                'plan_id' => $plan->id,
                'external_id' => $externalSubId,
            ]);

            return $subscription->load('plan');
        });

        $this->referrals->rewardOnFirstPaid($company, $subscription);

        return $subscription;
    }

    public function suspendExpired(Company $company): ?Subscription
    {
        $sub = $this->currentSubscription($company);

        if (! $sub) {
            $company->update(['is_active' => false]);

            return null;
        }

        if ($sub->status === SubscriptionStatus::Expired) {
            $company->update(['is_active' => false]);
            $this->liberateClientProviders($company);

            return $sub;
        }

        return DB::transaction(function () use ($company, $sub) {
            $before = $sub->only(['status']);
            $sub->update(['status' => SubscriptionStatus::Expired]);
            $company->update(['is_active' => false]);
            $this->liberateClientProviders($company);

            $this->audit->log('SUBSCRIPTION_EXPIRED', null, $sub->fresh(), $before, [
                'status' => SubscriptionStatus::Expired->value,
            ]);

            return $sub->fresh('plan');
        });
    }

    /**
     * @return array{subscription?: Subscription, checkout?: array<string, mixed>, mode: string}
     */
    public function subscribe(Company $company, Plan $plan, string $mode, string $successUrl, string $cancelUrl): array
    {
        $mode = $mode === 'checkout' ? 'checkout' : (
            $mode === 'trial' ? 'trial' : $this->defaultMode($company)
        );

        if ($mode === 'trial') {
            return [
                'mode' => 'trial',
                'subscription' => $this->startTrial($company, $plan),
            ];
        }

        $checkout = $this->billing->driver()->startCheckout($company, $plan, $successUrl, $cancelUrl);

        return [
            'mode' => 'checkout',
            'checkout' => $checkout->toArray(),
            'subscription' => $this->currentSubscription($company),
        ];
    }

    public function expireDueTrials(): int
    {
        $count = 0;

        $subs = Subscription::query()
            ->with('company')
            ->where('status', SubscriptionStatus::Trialing)
            ->whereNotNull('trial_ends_at')
            ->where('trial_ends_at', '<=', now())
            ->get();

        foreach ($subs as $sub) {
            if ($sub->company) {
                $this->suspendExpired($sub->company);
                $count++;
            }
        }

        return $count;
    }

    private function defaultMode(Company $company): string
    {
        if (! $company->trial_used_at && ! $this->companyHasAccess($company)) {
            return 'trial';
        }

        return 'checkout';
    }

    private function cancelOpenTrials(Company $company): void
    {
        Subscription::query()
            ->where('company_id', $company->id)
            ->where('status', SubscriptionStatus::Trialing)
            ->update(['status' => SubscriptionStatus::Canceled]);
    }

    private function periodEnd(Plan $plan): \Carbon\CarbonInterface
    {
        return match ($plan->billing_period) {
            'yearly' => now()->addYear(),
            default => now()->addMonth(),
        };
    }

    private function liberateClientProviders(Company $company): void
    {
        $prefs = ClientPreference::query()
            ->where(function ($q) use ($company) {
                $q->where('default_company_id', $company->id)
                    ->orWhereHas('client.companies', function ($cq) use ($company) {
                        $cq->where('companies.id', $company->id)
                            ->where('client_company.origin', 'empresa');
                    });
            })
            ->where('default_provider_mode', DefaultProviderMode::Company)
            ->get();

        foreach ($prefs as $pref) {
            $extra = $pref->extra ?? [];
            $extra['provider_restore'] = [
                'mode' => DefaultProviderMode::Company->value,
                'company_id' => $company->id,
            ];

            $pref->update([
                'default_provider_mode' => DefaultProviderMode::All,
                'default_company_id' => null,
                'extra' => $extra,
            ]);
        }
    }

    private function restoreClientProviders(Company $company): void
    {
        $prefs = ClientPreference::query()
            ->where('default_provider_mode', DefaultProviderMode::All)
            ->whereNotNull('extra')
            ->get();

        foreach ($prefs as $pref) {
            $restore = $pref->extra['provider_restore'] ?? null;
            if (! is_array($restore) || (int) ($restore['company_id'] ?? 0) !== $company->id) {
                continue;
            }

            $extra = $pref->extra ?? [];
            unset($extra['provider_restore']);

            $pref->update([
                'default_provider_mode' => DefaultProviderMode::Company,
                'default_company_id' => $company->id,
                'extra' => $extra ?: null,
            ]);
        }
    }
}
