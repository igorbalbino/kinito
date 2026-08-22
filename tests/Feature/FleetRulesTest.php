<?php

namespace Tests\Feature;

use App\Enums\DefaultProviderMode;
use App\Enums\DriverStatus;
use App\Enums\ModeloCorridas;
use App\Enums\RideStatus;
use App\Enums\SubscriptionStatus;
use App\Enums\UserRole;
use App\Models\Client;
use App\Models\ClientPreference;
use App\Models\Company;
use App\Models\CompanySetting;
use App\Models\Driver;
use App\Models\Plan;
use App\Models\ProviderTransferRequest;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class FleetRulesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (UserRole::cases() as $role) {
            Role::findOrCreate($role->value, 'web');
        }
    }

    public function test_instant_company_auto_assigns_driver(): void
    {
        [$owner, $company] = $this->makeFleet('Auto', ModeloCorridas::Instantaneas);
        $client = $this->makeClientFor($company);
        $driver = $this->makeDriverFor($company);

        Sanctum::actingAs($owner);
        $res = $this->postJson('/api/v1/corridas', $this->ridePayload($client, [
            'company_id' => $company->id,
        ]))->assertCreated();

        $this->assertSame((string) $driver->id, (string) $res->json('ride.driverId'));
        $this->assertSame(RideStatus::Aceita->value, $res->json('ride.status'));
    }

    public function test_agendamento_company_does_not_auto_assign(): void
    {
        [$owner, $company] = $this->makeFleet('Sched', ModeloCorridas::Agendamento);
        $client = $this->makeClientFor($company);
        $this->makeDriverFor($company);

        Sanctum::actingAs($owner);
        $res = $this->postJson('/api/v1/corridas', $this->ridePayload($client, [
            'company_id' => $company->id,
            'scheduled_date' => now()->addDay()->toDateString(),
            'scheduled_time' => '10:00',
        ]))->assertCreated();

        $this->assertNull($res->json('ride.driverId'));
        $this->assertSame(RideStatus::Agendada->value, $res->json('ride.status'));
    }

    public function test_company_registering_existing_client_requires_consent(): void
    {
        [, $companyA] = $this->makeFleet('A');
        [$ownerB, $companyB] = $this->makeFleet('B');
        $client = $this->makeClientFor($companyA);

        Sanctum::actingAs($ownerB);
        $res = $this->postJson('/api/v1/clientes', [
            'name' => $client->user->name,
            'email' => $client->user->email,
            'company_id' => $companyB->id,
        ])->assertCreated();

        $this->assertTrue($res->json('transfer_pending'));
        $this->assertDatabaseHas('provider_transfer_requests', [
            'subject_type' => 'client',
            'subject_id' => $client->id,
            'to_company_id' => $companyB->id,
            'status' => 'pending',
        ]);

        $prefs = $client->fresh()->preferences;
        $this->assertSame(DefaultProviderMode::Company, $prefs->default_provider_mode);
        $this->assertSame($companyA->id, $prefs->default_company_id);
    }

    public function test_client_can_accept_transfer(): void
    {
        [, $companyA] = $this->makeFleet('A');
        [$ownerB, $companyB] = $this->makeFleet('B');
        $client = $this->makeClientFor($companyA);

        Sanctum::actingAs($ownerB);
        $this->postJson('/api/v1/clientes', [
            'name' => $client->user->name,
            'email' => $client->user->email,
            'company_id' => $companyB->id,
        ])->assertCreated();

        $transfer = ProviderTransferRequest::query()->firstOrFail();

        Sanctum::actingAs($client->user);
        $this->postJson("/api/v1/provider-transfers/{$transfer->id}/accept")
            ->assertOk()
            ->assertJsonPath('transfer.status', 'accepted');

        $prefs = $client->fresh()->preferences;
        $this->assertSame($companyB->id, $prefs->default_company_id);
    }

    public function test_driver_reentry_skips_pending_approval(): void
    {
        [$ownerA, $companyA] = $this->makeFleet('A');
        [, $companyB] = $this->makeFleet('B');
        $driver = $this->makeDriverFor($companyA);

        $driver->companies()->syncWithoutDetaching([
            $companyB->id => [
                'status' => DriverStatus::Ativo->value,
                'approved_at' => now(),
                'approved_by' => $ownerA->id,
                'origin' => 'empresa',
            ],
        ]);

        Sanctum::actingAs($driver->user);
        $this->postJson("/api/v1/motoristas/{$driver->id}/switch-provider", [
            'company_id' => $companyB->id,
        ])->assertOk();

        $driver->refresh();
        $this->assertFalse((bool) $driver->provider_switch_pending);
        $this->assertSame($companyB->id, $driver->primary_company_id);
    }

    /**
     * @return array{0: User, 1: Company}
     */
    private function makeFleet(string $suffix, ModeloCorridas $modelo = ModeloCorridas::Ambos): array
    {
        $owner = User::factory()->create([
            'email' => "owner-{$suffix}@test.com",
            'email_verified_at' => now(),
            'must_change_password' => false,
        ]);
        $owner->assignRole(UserRole::Empresa->value);

        $company = Company::query()->create([
            'owner_user_id' => $owner->id,
            'name' => "Empresa {$suffix}",
            'slug' => 'empresa-'.strtolower($suffix).'-'.uniqid(),
            'cnpj' => fake()->numerify('##.###.###/####-##'),
            'email' => "owner-{$suffix}@test.com",
            'commission_rate' => 10,
            'is_active' => true,
            'is_provider' => true,
            'trial_used_at' => now(),
        ]);

        CompanySetting::query()->create([
            'company_id' => $company->id,
            'modelo_corridas' => $modelo->value,
            'accept_instant_rides' => $modelo !== ModeloCorridas::Agendamento,
            'allow_scheduling' => $modelo !== ModeloCorridas::Instantaneas,
        ]);

        $plan = Plan::query()->first() ?? Plan::query()->create([
            'slug' => 'test-plan-'.uniqid(),
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

        return [$owner, $company->fresh(['settings'])];
    }

    private function makeClientFor(Company $company): Client
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
            'must_change_password' => false,
        ]);
        $user->assignRole(UserRole::Cliente->value);
        $client = Client::query()->create(['user_id' => $user->id]);
        $client->companies()->attach($company->id, ['origin' => 'empresa', 'is_active' => true]);
        ClientPreference::query()->create([
            'client_id' => $client->id,
            'default_provider_mode' => DefaultProviderMode::Company,
            'default_company_id' => $company->id,
        ]);

        return $client->fresh(['user', 'preferences']);
    }

    private function makeDriverFor(Company $company): Driver
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
            'must_change_password' => false,
        ]);
        $user->assignRole(UserRole::Motorista->value);
        $driver = Driver::query()->create([
            'user_id' => $user->id,
            'status' => DriverStatus::Ativo,
            'primary_company_id' => $company->id,
            'provider_mode' => DefaultProviderMode::Company,
            'provider_switch_pending' => false,
        ]);
        $driver->companies()->attach($company->id, [
            'status' => DriverStatus::Ativo->value,
            'approved_at' => now(),
            'origin' => 'empresa',
        ]);

        return $driver->fresh(['user']);
    }

    /**
     * @param  array<string, mixed>  $extra
     * @return array<string, mixed>
     */
    private function ridePayload(Client $client, array $extra = []): array
    {
        return array_merge([
            'client_id' => $client->id,
            'origin' => ['address' => 'A', 'lat' => 0, 'lng' => 0, 'city' => 'SP', 'neighborhood' => ''],
            'destination' => ['address' => 'B', 'lat' => 0, 'lng' => 0, 'city' => 'SP', 'neighborhood' => ''],
            'distance_km' => 5,
            'payment_method' => 'pix',
        ], $extra);
    }
}
