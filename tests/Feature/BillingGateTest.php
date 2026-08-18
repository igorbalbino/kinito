<?php

namespace Tests\Feature;

use App\Enums\DefaultProviderMode;
use App\Enums\DriverStatus;
use App\Enums\SubscriptionStatus;
use App\Enums\UserRole;
use App\Models\Client;
use App\Models\ClientPreference;
use App\Models\Company;
use App\Models\CompanySetting;
use App\Models\Driver;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class BillingGateTest extends TestCase
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

    public function test_new_company_cannot_access_dashboard_until_trial(): void
    {
        $plan = Plan::query()->create([
            'slug' => 'starter-gate',
            'name' => 'Starter',
            'price' => 99,
            'billing_period' => 'monthly',
            'is_active' => true,
        ]);

        $owner = User::factory()->create(['email' => 'gate@test.com', 'email_verified_at' => now()]);
        $owner->assignRole(UserRole::Empresa->value);

        $company = Company::query()->create([
            'owner_user_id' => $owner->id,
            'name' => 'Gate Co',
            'slug' => 'gate-co',
            'cnpj' => '33.000.000/0001-33',
            'email' => 'gate@test.com',
            'commission_rate' => 10,
            'is_provider' => false,
            'is_active' => false,
        ]);

        CompanySetting::query()->create([
            'company_id' => $company->id,
            'modelo_corridas' => 'AMBOS',
        ]);

        Sanctum::actingAs($owner);

        $this->getJson('/api/v1/dashboard')
            ->assertForbidden()
            ->assertJsonPath('code', 'subscription_required');

        $this->postJson("/api/v1/empresas/{$company->id}/subscribe", [
            'plan_id' => $plan->id,
            'mode' => 'trial',
        ])->assertCreated()
            ->assertJsonPath('has_access', true);

        $this->getJson('/api/v1/dashboard')->assertOk();
    }

    public function test_expire_trial_liberates_drivers_and_blocks_empresa(): void
    {
        [$owner, $company, $plan] = $this->makeFleetCompany();
        $driver = $this->makeLinkedDriver($company);

        Sanctum::actingAs($owner);
        $this->postJson("/api/v1/empresas/{$company->id}/subscribe", [
            'plan_id' => $plan->id,
            'mode' => 'trial',
        ])->assertCreated();

        Subscription::query()->where('company_id', $company->id)->update([
            'trial_ends_at' => now()->subMinute(),
        ]);

        $this->artisan('subscriptions:expire-trials')->assertSuccessful();

        $driver->refresh();
        $this->assertSame(DefaultProviderMode::All, $driver->provider_mode);
        $this->assertNull($driver->primary_company_id);
        $this->assertSame($company->id, $driver->provider_restore['company_id'] ?? null);

        Sanctum::actingAs($owner);
        $this->getJson('/api/v1/dashboard')
            ->assertForbidden()
            ->assertJsonPath('code', 'subscription_required');
    }

    public function test_config_stripe_prices_sync_on_seed(): void
    {
        config([
            'kinito.stripe.prices.starter' => 'price_test_starter',
            'kinito.stripe.prices.pro' => 'price_test_pro',
            'kinito.stripe.prices.enterprise' => 'price_test_ent',
        ]);

        $this->seed(\Database\Seeders\DatabaseSeeder::class);

        $this->assertSame('price_test_starter', Plan::query()->where('slug', 'starter')->value('stripe_price_id'));
        $this->assertSame('price_test_pro', Plan::query()->where('slug', 'pro')->value('stripe_price_id'));
    }

    /**
     * @return array{0: User, 1: Company, 2: Plan}
     */
    private function makeFleetCompany(): array
    {
        $owner = User::factory()->create(['email' => 'fleet-gate@test.com', 'email_verified_at' => now()]);
        $owner->assignRole(UserRole::Empresa->value);

        $company = Company::query()->create([
            'owner_user_id' => $owner->id,
            'name' => 'Fleet Gate',
            'slug' => 'fleet-gate',
            'cnpj' => '44.000.000/0001-44',
            'email' => 'fleet-gate@test.com',
            'commission_rate' => 10,
            'is_provider' => false,
            'is_active' => false,
        ]);

        CompanySetting::query()->create([
            'company_id' => $company->id,
            'modelo_corridas' => 'AMBOS',
        ]);

        $plan = Plan::query()->create([
            'slug' => 'gate-plan',
            'name' => 'Gate Plan',
            'price' => 50,
            'billing_period' => 'monthly',
            'is_active' => true,
        ]);

        return [$owner, $company, $plan];
    }

    private function makeLinkedDriver(Company $company): Driver
    {
        $user = User::factory()->create();
        $user->assignRole(UserRole::Motorista->value);
        $driver = Driver::query()->create([
            'user_id' => $user->id,
            'status' => DriverStatus::Ativo,
            'primary_company_id' => $company->id,
            'provider_mode' => DefaultProviderMode::Company,
        ]);
        $driver->companies()->attach($company->id, [
            'status' => DriverStatus::Ativo->value,
            'origin' => 'empresa',
        ]);

        return $driver;
    }
}
