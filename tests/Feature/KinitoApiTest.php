<?php

namespace Tests\Feature;

use App\Enums\SubscriptionStatus;
use App\Enums\UserRole;
use App\Models\Client;
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

class KinitoApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (UserRole::cases() as $role) {
            Role::findOrCreate($role->value, 'web');
        }
    }

    public function test_client_can_register_and_must_verify_email_before_login(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Cliente Teste',
            'email' => 'cliente@test.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'CLIENTE',
        ]);

        $response->assertCreated()
            ->assertJsonPath('email_verification_required', true)
            ->assertJsonPath('email', 'cliente@test.com')
            ->assertJsonMissingPath('token');

        $this->postJson('/api/v1/auth/login', [
            'email' => 'cliente@test.com',
            'password' => 'password',
        ])->assertUnprocessable()
            ->assertJsonPath('email_unverified', true);

        $user = User::query()->where('email', 'cliente@test.com')->firstOrFail();
        $user->forceFill(['email_verified_at' => now()])->save();

        $this->postJson('/api/v1/auth/login', [
            'email' => 'cliente@test.com',
            'password' => 'password',
        ])->assertOk()->assertJsonStructure(['token']);
    }

    public function test_public_register_rejects_empresa_role(): void
    {
        $this->postJson('/api/v1/auth/register', [
            'name' => 'Empresa',
            'email' => 'emp@test.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'EMPRESA',
        ])->assertUnprocessable();
    }

    public function test_company_can_create_ride(): void
    {
        $owner = User::factory()->create(['email' => 'owner@test.com']);
        $owner->assignRole(UserRole::Empresa->value);

        $company = Company::query()->create([
            'owner_user_id' => $owner->id,
            'name' => 'Empresa Teste',
            'slug' => 'empresa-teste',
            'cnpj' => '00.000.000/0001-00',
            'email' => 'owner@test.com',
            'commission_rate' => 10,
        ]);

        CompanySetting::query()->create([
            'company_id' => $company->id,
            'modelo_corridas' => 'AMBOS',
        ]);

        $plan = Plan::query()->create([
            'slug' => 'test-plan',
            'name' => 'Test',
            'price' => 99,
            'billing_period' => 'monthly',
            'is_active' => true,
        ]);
        Subscription::query()->create([
            'company_id' => $company->id,
            'plan_id' => $plan->id,
            'status' => SubscriptionStatus::Active,
            'starts_at' => now(),
            'ends_at' => now()->addMonth(),
        ]);
        $company->update(['is_active' => true, 'is_provider' => true, 'trial_used_at' => now()]);

        $clientUser = User::factory()->create();
        $clientUser->assignRole(UserRole::Cliente->value);
        $client = Client::query()->create(['user_id' => $clientUser->id]);
        $client->companies()->attach($company->id, ['origin' => 'empresa', 'is_active' => true]);

        Sanctum::actingAs($owner);

        $response = $this->postJson('/api/v1/corridas', [
            'client_id' => $client->id,
            'company_id' => $company->id,
            'origin' => ['address' => 'Rua A', 'city' => 'SP', 'lat' => -23.5, 'lng' => -46.6, 'neighborhood' => 'Centro'],
            'destination' => ['address' => 'Rua B', 'city' => 'SP', 'lat' => -23.6, 'lng' => -46.7, 'neighborhood' => 'Pinheiros'],
            'distance_km' => 10,
            'payment_method' => 'pix',
        ]);

        $response->assertCreated()
            ->assertJsonPath('ride.companyId', (string) $company->id)
            ->assertJsonStructure(['ride' => ['code', 'status', 'financialStatus']]);
    }

    public function test_company_can_approve_driver(): void
    {
        $owner = User::factory()->create();
        $owner->assignRole(UserRole::Empresa->value);

        $company = Company::query()->create([
            'owner_user_id' => $owner->id,
            'name' => 'Frota X',
            'slug' => 'frota-x',
            'cnpj' => '11.000.000/0001-11',
            'email' => 'frota@test.com',
            'commission_rate' => 10,
            'is_active' => true,
            'is_provider' => true,
            'trial_used_at' => now(),
        ]);

        CompanySetting::query()->create([
            'company_id' => $company->id,
            'modelo_corridas' => 'AMBOS',
        ]);

        $plan = Plan::query()->create([
            'slug' => 'approve-plan',
            'name' => 'Approve',
            'price' => 99,
            'billing_period' => 'monthly',
            'is_active' => true,
        ]);

        Subscription::query()->create([
            'company_id' => $company->id,
            'plan_id' => $plan->id,
            'status' => SubscriptionStatus::Active,
            'starts_at' => now(),
            'ends_at' => now()->addMonth(),
        ]);

        $driverUser = User::factory()->create();
        $driverUser->assignRole(UserRole::Motorista->value);
        $driver = Driver::query()->create([
            'user_id' => $driverUser->id,
            'status' => 'PENDENTE',
        ]);
        $driver->companies()->attach($company->id, ['status' => 'PENDENTE', 'origin' => 'empresa']);

        Sanctum::actingAs($owner);

        $this->postJson("/api/v1/motoristas/{$driver->id}/approve", [
            'company_id' => $company->id,
        ])->assertOk()
            ->assertJsonPath('data.status', 'ATIVO');
    }
}
