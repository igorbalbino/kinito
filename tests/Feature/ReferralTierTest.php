<?php

namespace Tests\Feature;

use App\Enums\ReferralStatus;
use App\Enums\SubscriptionStatus;
use App\Enums\UserRole;
use App\Models\Company;
use App\Models\CompanyReferral;
use App\Models\CompanySetting;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Services\Billing\Drivers\MockBillingGateway;
use App\Services\Referral\ReferralService;
use App\Services\Subscription\SubscriptionLifecycleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ReferralTierTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (UserRole::cases() as $role) {
            Role::findOrCreate($role->value, 'web');
        }

        config(['kinito.billing.driver' => 'mock', 'kinito.stripe.secret' => null]);
    }

    public function test_starter_referrer_blocks_pro_plan_on_subscribe(): void
    {
        [$referrerOwner, $referrer] = $this->makeCompanyWithPlan('starter');
        [$referredOwner, $referred] = $this->makeBareCompany('referred-pro');
        $this->attachReferral($referrer, $referred);

        $pro = Plan::query()->where('slug', 'pro')->firstOrFail();

        Sanctum::actingAs($referredOwner);
        $this->postJson("/api/v1/empresas/{$referred->id}/subscribe", [
            'plan_id' => $pro->id,
            'mode' => 'trial',
        ])->assertUnprocessable()
            ->assertJsonFragment(['message' => 'Com a indicação recebida, você só pode escolher os planos: starter.']);
    }

    public function test_pro_referrer_allows_starter_plan(): void
    {
        [$referrerOwner, $referrer] = $this->makeCompanyWithPlan('pro');
        [$referredOwner, $referred] = $this->makeBareCompany('referred-starter');
        $this->attachReferral($referrer, $referred);

        $starter = Plan::query()->where('slug', 'starter')->firstOrFail();

        Sanctum::actingAs($referredOwner);
        $this->postJson("/api/v1/empresas/{$referred->id}/subscribe", [
            'plan_id' => $starter->id,
            'mode' => 'trial',
        ])->assertCreated();

        $referral = CompanyReferral::query()->where('referred_company_id', $referred->id)->firstOrFail();
        $this->assertSame($starter->id, $referral->referred_plan_id);
    }

    public function test_enterprise_referrer_allows_enterprise_plan(): void
    {
        [$referrerOwner, $referrer] = $this->makeCompanyWithPlan('enterprise');
        [$referredOwner, $referred] = $this->makeBareCompany('referred-ent');
        $this->attachReferral($referrer, $referred);

        $enterprise = Plan::query()->where('slug', 'enterprise')->firstOrFail();

        Sanctum::actingAs($referredOwner);
        $this->postJson("/api/v1/empresas/{$referred->id}/subscribe", [
            'plan_id' => $enterprise->id,
            'mode' => 'trial',
        ])->assertCreated();
    }

    public function test_first_paid_referral_grants_one_billing_period(): void
    {
        [$referrerOwner, $referrer] = $this->makeCompanyWithPlan('pro');
        [$referredOwner, $referred] = $this->makeBareCompany('referred-pay');
        $this->attachReferral($referrer, $referred);

        $starter = Plan::query()->where('slug', 'starter')->firstOrFail();
        $lifecycle = app(SubscriptionLifecycleService::class);
        $lifecycle->startTrial($referred, $starter);

        $referrerSub = $referrer->subscriptions()->latest('id')->firstOrFail();
        $originalEnds = $referrerSub->ends_at?->copy();

        /** @var MockBillingGateway $mock */
        $mock = app(MockBillingGateway::class);
        $checkout = $mock->startCheckout($referred->fresh(), $starter, 'http://localhost/ok', 'http://localhost/cancel');
        $this->get($checkout->url)->assertOk();

        $referrerSub->refresh();
        $this->assertTrue($referrerSub->ends_at->gt($originalEnds));
        $this->assertSame(
            $originalEnds->copy()->addMonth()->toDateString(),
            $referrerSub->ends_at->toDateString()
        );

        $this->assertSame(ReferralStatus::Rewarded, CompanyReferral::query()
            ->where('referred_company_id', $referred->id)
            ->value('status'));
    }

    public function test_summary_includes_allowed_plan_slugs_by_tier(): void
    {
        [, $referrer] = $this->makeCompanyWithPlan('pro');
        $summary = app(ReferralService::class)->summaryFor($referrer);

        $this->assertContains('pro', $summary['allowed_plan_slugs']);
        $this->assertContains('starter', $summary['allowed_plan_slugs']);
        $this->assertNotContains('enterprise', $summary['allowed_plan_slugs']);
    }

    public function test_referred_company_gets_referral_constraints_in_summary(): void
    {
        [$referrerOwner, $referrer] = $this->makeCompanyWithPlan('starter');
        [$referredOwner, $referred] = $this->makeBareCompany('referred-summary');
        $this->attachReferral($referrer, $referred);

        Sanctum::actingAs($referredOwner);
        $response = $this->getJson("/api/v1/empresas/{$referred->id}/subscription")->assertOk();

        $constraints = $response->json('referral.referral_constraints');
        $this->assertSame(['starter'], $constraints['allowed_plan_slugs']);
        $this->assertSame($referrer->name, $constraints['referrer_company']);
    }

    /**
     * @return array{0: User, 1: Company}
     */
    private function makeCompanyWithPlan(string $slug): array
    {
        $this->seedPlans();

        $owner = User::factory()->create(['email' => "owner-{$slug}@test.com", 'email_verified_at' => now()]);
        $owner->assignRole(UserRole::Empresa->value);

        $company = Company::query()->create([
            'owner_user_id' => $owner->id,
            'name' => "Empresa {$slug}",
            'slug' => "empresa-{$slug}-".uniqid(),
            'cnpj' => fake()->numerify('##.###.###/####-##'),
            'email' => "owner-{$slug}@test.com",
            'referral_code' => strtoupper(substr($slug, 0, 4)).uniqid(),
            'commission_rate' => 10,
            'is_active' => true,
            'is_provider' => true,
            'trial_used_at' => now(),
        ]);

        CompanySetting::query()->create([
            'company_id' => $company->id,
            'modelo_corridas' => 'AMBOS',
        ]);

        $plan = Plan::query()->where('slug', $slug)->firstOrFail();

        Subscription::query()->create([
            'company_id' => $company->id,
            'plan_id' => $plan->id,
            'status' => SubscriptionStatus::Active,
            'starts_at' => now()->subMonth(),
            'ends_at' => now()->addMonth(),
        ]);

        return [$owner, $company];
    }

    /**
     * @return array{0: User, 1: Company}
     */
    private function makeBareCompany(string $suffix): array
    {
        $this->seedPlans();

        $owner = User::factory()->create(['email' => "{$suffix}@test.com", 'email_verified_at' => now()]);
        $owner->assignRole(UserRole::Empresa->value);

        $company = Company::query()->create([
            'owner_user_id' => $owner->id,
            'name' => "Empresa {$suffix}",
            'slug' => "empresa-{$suffix}-".uniqid(),
            'cnpj' => fake()->numerify('##.###.###/####-##'),
            'email' => "{$suffix}@test.com",
            'referral_code' => strtoupper(substr($suffix, 0, 6)).uniqid(),
            'commission_rate' => 10,
            'is_active' => false,
            'is_provider' => false,
        ]);

        CompanySetting::query()->create([
            'company_id' => $company->id,
            'modelo_corridas' => 'AMBOS',
        ]);

        return [$owner, $company];
    }

    private function attachReferral(Company $referrer, Company $referred): CompanyReferral
    {
        return CompanyReferral::query()->create([
            'referrer_company_id' => $referrer->id,
            'referred_company_id' => $referred->id,
            'referral_code' => $referrer->referral_code,
            'status' => ReferralStatus::Pending,
            'reward_days' => 0,
        ]);
    }

    private function seedPlans(): void
    {
        if (Plan::query()->where('slug', 'starter')->exists()) {
            return;
        }

        foreach ([
            ['slug' => 'starter', 'name' => 'Starter', 'price' => 99],
            ['slug' => 'pro', 'name' => 'Pro', 'price' => 249],
            ['slug' => 'enterprise', 'name' => 'Enterprise', 'price' => 799],
        ] as $plan) {
            Plan::query()->create($plan + [
                'billing_period' => 'monthly',
                'is_active' => true,
            ]);
        }
    }
}
