<?php

namespace App\Services\Referral;

use App\Enums\ReferralStatus;
use App\Enums\SubscriptionStatus;
use App\Models\Company;
use App\Models\CompanyReferral;
use App\Models\Plan;
use App\Models\Subscription;
use App\Services\Audit\AuditService;
use App\Support\PlanTier;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;

class ReferralService
{
    public function __construct(private readonly AuditService $audit) {}

    public function generateUniqueCode(): string
    {
        do {
            $code = strtoupper(Str::random(8));
        } while (Company::query()->where('referral_code', $code)->exists());

        return $code;
    }

    public function attachOnRegister(Company $referred, ?string $code): ?CompanyReferral
    {
        $code = strtoupper(trim((string) $code));
        if ($code === '') {
            return null;
        }

        $referrer = Company::query()->where('referral_code', $code)->first();
        if (! $referrer || $referrer->id === $referred->id) {
            return null;
        }

        if (CompanyReferral::query()->where('referred_company_id', $referred->id)->exists()) {
            return null;
        }

        $referral = CompanyReferral::query()->create([
            'referrer_company_id' => $referrer->id,
            'referred_company_id' => $referred->id,
            'referral_code' => $code,
            'status' => ReferralStatus::Pending,
            'reward_days' => 0,
        ]);

        $this->audit->log('REFERRAL_ATTACHED', $referred->owner, $referral, null, [
            'referrer_company_id' => $referrer->id,
            'referred_company_id' => $referred->id,
            'referral_code' => $code,
        ]);

        return $referral;
    }

    public function pendingReferralFor(Company $referred): ?CompanyReferral
    {
        return CompanyReferral::query()
            ->where('referred_company_id', $referred->id)
            ->where('status', ReferralStatus::Pending)
            ->first();
    }

    public function referrerCurrentPlan(Company $referrer): ?Plan
    {
        $sub = $referrer->subscriptions()
            ->with('plan')
            ->whereIn('status', [SubscriptionStatus::Trialing, SubscriptionStatus::Active])
            ->orderByDesc('id')
            ->first();

        return $sub?->plan;
    }

    /**
     * @return Collection<int, Plan>
     */
    public function allowedPlansForReferrer(Company $referrer): Collection
    {
        $referrerPlan = $this->referrerCurrentPlan($referrer);
        if (! $referrerPlan) {
            return collect();
        }

        $allowedSlugs = PlanTier::allowedSlugsForRank(PlanTier::rank($referrerPlan));

        return Plan::query()
            ->where('is_active', true)
            ->whereIn('slug', $allowedSlugs)
            ->orderByDesc('price')
            ->get();
    }

    /**
     * @return list<string>
     */
    public function allowedSlugsForReferrer(Company $referrer): array
    {
        return $this->allowedPlansForReferrer($referrer)
            ->pluck('slug')
            ->map(fn ($slug) => (string) $slug)
            ->values()
            ->all();
    }

    public function assertReferredPlanAllowed(Company $referred, Plan $chosenPlan): void
    {
        $referral = $this->pendingReferralFor($referred);
        if (! $referral) {
            return;
        }

        $referrer = $referral->referrer;
        if (! $referrer) {
            return;
        }

        $referrerPlan = $this->referrerCurrentPlan($referrer);
        if (! $referrerPlan) {
            throw new InvalidArgumentException(
                'A empresa que indicou você ainda não possui um plano ativo para validar a indicação.'
            );
        }

        if (! PlanTier::canRefer($referrerPlan, $chosenPlan)) {
            $allowed = implode(', ', $this->allowedSlugsForReferrer($referrer));

            throw new InvalidArgumentException(
                "Com a indicação recebida, você só pode escolher os planos: {$allowed}."
            );
        }
    }

    public function recordReferredPlan(Company $referred, Plan $plan): void
    {
        $referral = $this->pendingReferralFor($referred);
        if (! $referral) {
            return;
        }

        $referrerPlan = $this->referrerCurrentPlan($referral->referrer);

        $referral->update([
            'referred_plan_id' => $plan->id,
            'referrer_plan_id' => $referrerPlan?->id,
        ]);
    }

    /**
     * Grant +1 billing period to referrer on the referred company's first paid activation.
     */
    public function rewardOnFirstPaid(Company $referred, Subscription $newPaidSubscription): ?CompanyReferral
    {
        $referral = $this->pendingReferralFor($referred);

        if (! $referral) {
            return null;
        }

        $hadPriorActive = Subscription::query()
            ->where('company_id', $referred->id)
            ->where('status', SubscriptionStatus::Active)
            ->where('id', '!=', $newPaidSubscription->id)
            ->exists();

        if ($hadPriorActive) {
            return null;
        }

        return DB::transaction(function () use ($referral, $referred) {
            $locked = CompanyReferral::query()->lockForUpdate()->find($referral->id);
            if (! $locked || $locked->status !== ReferralStatus::Pending) {
                return null;
            }

            $referrer = Company::query()->lockForUpdate()->find($locked->referrer_company_id);
            if (! $referrer) {
                return null;
            }

            $referrerPlan = $this->referrerCurrentPlan($referrer)
                ?? ($locked->referrer_plan_id ? Plan::query()->find($locked->referrer_plan_id) : null)
                ?? Plan::query()->where('slug', config('kinito.default_plan', 'starter'))->first();

            if (! $referrerPlan) {
                return null;
            }

            $this->extendReferrerAccessByPeriod($referrer, $referrerPlan);

            $locked->update([
                'status' => ReferralStatus::Rewarded,
                'rewarded_at' => now(),
            ]);

            $this->audit->log('REFERRAL_REWARDED', null, $locked->fresh(), null, [
                'referrer_company_id' => $referrer->id,
                'referred_company_id' => $referred->id,
                'referrer_plan_slug' => $referrerPlan->slug,
                'billing_period' => $referrerPlan->billing_period,
            ]);

            return $locked->fresh(['referrer', 'referred']);
        });
    }

    public function extendReferrerAccessByPeriod(Company $company, Plan $referrerPlan): Subscription
    {
        $sub = $company->subscriptions()->orderByDesc('id')->first();

        if ($sub && $sub->status === SubscriptionStatus::Trialing) {
            $base = $sub->trial_ends_at && $sub->trial_ends_at->isFuture()
                ? $sub->trial_ends_at
                : now();
            $sub->update(['trial_ends_at' => $this->addOnePeriod($base, $referrerPlan)]);
            $company->update(['is_active' => true, 'is_provider' => true]);

            return $sub->fresh('plan');
        }

        if ($sub && $sub->status === SubscriptionStatus::Active) {
            $base = $sub->ends_at && $sub->ends_at->isFuture()
                ? $sub->ends_at
                : now();
            $sub->update(['ends_at' => $this->addOnePeriod($base, $referrerPlan)]);
            $company->update(['is_active' => true, 'is_provider' => true]);

            return $sub->fresh('plan');
        }

        $subscription = Subscription::query()->create([
            'company_id' => $company->id,
            'plan_id' => $referrerPlan->id,
            'status' => SubscriptionStatus::Active,
            'starts_at' => now(),
            'ends_at' => $this->addOnePeriod(now(), $referrerPlan),
            'stripe_subscription_id' => null,
        ]);

        $company->update(['is_active' => true, 'is_provider' => true]);

        return $subscription->load('plan');
    }

    private function addOnePeriod(CarbonInterface $base, Plan $plan): CarbonInterface
    {
        return match ($plan->billing_period) {
            'yearly' => $base->copy()->addYear(),
            default => $base->copy()->addMonth(),
        };
    }

    /**
     * @return array<string, mixed>
     */
    public function summaryFor(Company $company): array
    {
        $frontend = rtrim((string) config('kinito.frontend_url'), '/');
        $code = $company->referral_code;

        $pending = CompanyReferral::query()
            ->where('referrer_company_id', $company->id)
            ->where('status', ReferralStatus::Pending)
            ->count();

        $rewarded = CompanyReferral::query()
            ->where('referrer_company_id', $company->id)
            ->where('status', ReferralStatus::Rewarded)
            ->count();

        $recent = CompanyReferral::query()
            ->with('referred:id,name')
            ->where('referrer_company_id', $company->id)
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn (CompanyReferral $r) => [
                'id' => $r->id,
                'status' => $r->status?->value ?? (string) $r->status,
                'referred_company' => $r->referred?->name,
                'rewarded_at' => $r->rewarded_at?->toIso8601String(),
                'created_at' => $r->created_at?->toIso8601String(),
            ])
            ->all();

        $allowedPlanSlugs = $this->allowedSlugsForReferrer($company);

        $referralConstraints = null;
        $incoming = $this->pendingReferralFor($company);
        if ($incoming && $incoming->referrer) {
            $referralConstraints = [
                'allowed_plan_slugs' => $this->allowedSlugsForReferrer($incoming->referrer),
                'referrer_company' => $incoming->referrer->name,
            ];
        }

        return [
            'referral_code' => $code,
            'share_url' => $code ? "{$frontend}/register/empresa?ref={$code}" : null,
            'pending' => $pending,
            'rewarded' => $rewarded,
            'periods_earned' => $rewarded,
            'months_earned' => $rewarded,
            'allowed_plan_slugs' => $allowedPlanSlugs,
            'referral_constraints' => $referralConstraints,
            'recent' => $recent,
        ];
    }
}
