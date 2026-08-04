<?php

namespace Tests\Feature;

use App\Enums\DefaultProviderMode;
use App\Enums\SubscriptionStatus;
use App\Enums\UserRole;
use App\Models\Client;
use App\Models\ClientPreference;
use App\Models\Company;
use App\Models\CompanySetting;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Services\Billing\Drivers\MockBillingGateway;
use App\Services\Subscription\SubscriptionLifecycleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SubscriptionTrialTest extends TestCase
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

    public function test_company_can_start_trial_and_expire_liberates_clients(): void
    {
        [$owner, $company, $plan] = $this->makeCompany();
        $client = $this->makeLinkedClient($company);

        Sanctum::actingAs($owner);

        $this->postJson("/api/v1/empresas/{$company->id}/subscribe", [
            'plan_id' => $plan->id,
            'mode' => 'trial',
        ])->assertCreated()
            ->assertJsonPath('mode', 'trial')
            ->assertJsonPath('has_access', true);

        $this->assertDatabaseHas('subscriptions', [
            'company_id' => $company->id,
            'status' => SubscriptionStatus::Trialing->value,
        ]);

        Subscription::query()->where('company_id', $company->id)->update([
            'trial_ends_at' => now()->subMinute(),
        ]);

        $this->artisan('subscriptions:expire-trials')->assertSuccessful();

        $company->refresh();
        $this->assertFalse($company->is_active);
        $this->assertSame(SubscriptionStatus::Expired, $company->subscriptions()->latest('id')->first()->status);

        $prefs = $client->preferences()->first();
        $this->assertSame(DefaultProviderMode::All, $prefs->default_provider_mode);
        $this->assertNull($prefs->default_company_id);
        $this->assertSame($company->id, $prefs->extra['provider_restore']['company_id'] ?? null);

        Sanctum::actingAs($this->makeClientUser());
        $providers = $this->getJson('/api/v1/fornecedores')->assertOk()->json('data') ?? [];
        $ids = collect($providers)->pluck('id')->map(fn ($id) => (int) $id)->all();
        $this->assertNotContains($company->id, $ids);
    }

    public function test_mock_checkout_activates_and_restores_provider(): void
    {
        [$owner, $company, $plan] = $this->makeCompany();
        $client = $this->makeLinkedClient($company);

        $lifecycle = app(SubscriptionLifecycleService::class);
        $lifecycle->startTrial($company, $plan);

        Subscription::query()->where('company_id', $company->id)->update([
            'trial_ends_at' => now()->subMinute(),
        ]);
        $lifecycle->suspendExpired($company->fresh());

        $this->assertSame(DefaultProviderMode::All, $client->preferences()->first()->default_provider_mode);

        /** @var MockBillingGateway $mock */
        $mock = app(MockBillingGateway::class);
        $checkout = $mock->startCheckout(
            $company->fresh(),
            $plan,
            'http://localhost/ok',
            'http://localhost/cancel',
        );

        $this->get($checkout->url)->assertOk();

        $company->refresh();
        $this->assertTrue($company->is_active);
        $this->assertTrue($lifecycle->companyHasAccess($company));

        $prefs = $client->preferences()->first()->fresh();
        $this->assertSame(DefaultProviderMode::Company, $prefs->default_provider_mode);
        $this->assertSame($company->id, $prefs->default_company_id);
    }

    public function test_company_created_client_must_change_password_and_login_by_phone(): void
    {
        [$owner, $company] = $this->makeCompany();
        Sanctum::actingAs($owner);

        $response = $this->postJson('/api/v1/clientes', [
            'name' => 'Cliente Convite',
            'email' => 'convite@test.com',
            'phone' => '11999998888',
            'company_id' => $company->id,
        ])->assertCreated();

        $temp = $response->json('temporary_password');
        $this->assertNotEmpty($temp);

        $user = User::query()->where('email', 'convite@test.com')->first();
        $this->assertTrue($user->must_change_password);

        $this->postJson('/api/v1/auth/login', [
            'login' => '11999998888',
            'password' => $temp,
        ])->assertOk();

        Sanctum::actingAs($user->fresh());

        $this->getJson('/api/v1/dashboard')
            ->assertForbidden()
            ->assertJsonPath('code', 'password_change_required');

        $this->postJson('/api/v1/auth/change-password', [
            'current_password' => $temp,
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ])->assertOk();

        $this->assertFalse($user->fresh()->must_change_password);

        $this->getJson('/api/v1/dashboard')->assertOk();
    }

    /**
     * @return array{0: User, 1: Company, 2: Plan}
     */
    private function makeCompany(): array
    {
        $owner = User::factory()->create(['email' => 'gestor-trial@test.com']);
        $owner->assignRole(UserRole::Empresa->value);

        $company = Company::query()->create([
            'owner_user_id' => $owner->id,
            'name' => 'Empresa Trial',
            'slug' => 'empresa-trial',
            'cnpj' => '22.000.000/0001-22',
            'email' => 'gestor-trial@test.com',
            'commission_rate' => 10,
            'is_provider' => true,
            'is_active' => true,
        ]);

        CompanySetting::query()->create([
            'company_id' => $company->id,
            'modelo_corridas' => 'AMBOS',
        ]);

        $plan = Plan::query()->create([
            'slug' => 'trial-plan',
            'name' => 'Trial Plan',
            'price' => 99.9,
            'billing_period' => 'monthly',
            'is_active' => true,
        ]);

        return [$owner, $company, $plan];
    }

    private function makeLinkedClient(Company $company): Client
    {
        $user = User::factory()->create();
        $user->assignRole(UserRole::Cliente->value);
        $client = Client::query()->create(['user_id' => $user->id]);
        $client->companies()->attach($company->id, ['origin' => 'empresa', 'is_active' => true]);
        ClientPreference::query()->create([
            'client_id' => $client->id,
            'default_provider_mode' => DefaultProviderMode::Company,
            'default_company_id' => $company->id,
        ]);

        return $client;
    }

    private function makeClientUser(): User
    {
        $user = User::factory()->create();
        $user->assignRole(UserRole::Cliente->value);

        return $user;
    }
}
