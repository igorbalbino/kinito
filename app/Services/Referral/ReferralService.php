<?php

namespace App\Services\Referral;

use App\Enums\ReferralStatus;
use App\Enums\SubscriptionStatus;
use App\Models\Company;
use App\Models\CompanyReferral;
use App\Models\Plan;
use App\Models\Subscription;
use App\Services\Audit\AuditService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ReferralService
{
    public const REWARD_DAYS = 30;

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
            'reward_days' => self::REWARD_DAYS,
        ]);

        $this->audit->log('REFERRAL_ATTACHED', $referred->owner, $referral, null, [
            'referrer_company_id' => $referrer->id,
            'referred_company_id' => $referred->id,
            'referral_code' => $code,
        ]);

        return $referral;
    }

    /**
     * Grant +1 month to referrer on the referred company's first paid activation.
     * Idempotent: only pending rows; skips if referred already had an ACTIVE sub before this one.
     */
    public function rewardOnFirstPaid(Company $referred, Subscription $newPaidSubscription): ?CompanyReferral
    {
        $referral = CompanyReferral::query()
            ->where('referred_company_id', $referred->id)
            ->where('status', ReferralStatus::Pending)
            ->first();

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

            $days = (int) ($locked->reward_days ?: self::REWARD_DAYS);
            $this->extendReferrerAccess($referrer, $days);

            $locked->update([
                'status' => ReferralStatus::Rewarded,
                'rewarded_at' => now(),
            ]);

            $this->audit->log('REFERRAL_REWARDED', null, $locked->fresh(), null, [
                'referrer_company_id' => $referrer->id,
                'referred_company_id' => $referred->id,
                'reward_days' => $days,
            ]);

            return $locked->fresh(['referrer', 'referred']);
        });
    }

    public function extendReferrerAccess(Company $company, int $days = self::REWARD_DAYS): Subscription
    {
        $sub = $company->subscriptions()->orderByDesc('id')->first();

        if ($sub && $sub->status === SubscriptionStatus::Trialing) {
            $base = $sub->trial_ends_at && $sub->trial_ends_at->isFuture()
                ? $sub->trial_ends_at
                : now();
            $sub->update(['trial_ends_at' => $base->copy()->addDays($days)]);
            $company->update(['is_active' => true, 'is_provider' => true]);

            return $sub->fresh('plan');
        }

        if ($sub && $sub->status === SubscriptionStatus::Active) {
            $base = $sub->ends_at && $sub->ends_at->isFuture()
                ? $sub->ends_at
                : now();
            $sub->update(['ends_at' => $base->copy()->addDays($days)]);
            $company->update(['is_active' => true, 'is_provider' => true]);

            return $sub->fresh('plan');
        }

        $plan = $sub?->plan
            ?? Plan::query()->where('slug', config('kinito.default_plan', 'starter'))->first()
            ?? Plan::query()->where('is_active', true)->orderBy('price')->first();

        if (! $plan) {
            throw new \RuntimeException('Nenhum plano disponível para crédito de indicação.');
        }

        $subscription = Subscription::query()->create([
            'company_id' => $company->id,
            'plan_id' => $plan->id,
            'status' => SubscriptionStatus::Active,
            'starts_at' => now(),
            'ends_at' => now()->addDays($days),
            'stripe_subscription_id' => null,
        ]);

        $company->update(['is_active' => true, 'is_provider' => true]);

        return $subscription->load('plan');
    }

    /**
     * @return array{referral_code: ?string, share_url: ?string, pending: int, rewarded: int, months_earned: int, recent: list<array<string, mixed>>}
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

        return [
            'referral_code' => $code,
            'share_url' => $code ? "{$frontend}/register/empresa?ref={$code}" : null,
            'pending' => $pending,
            'rewarded' => $rewarded,
            'months_earned' => $rewarded,
            'recent' => $recent,
        ];
    }
}
