<?php

namespace Tests\Feature;

use App\Enums\FinancialStatus;
use App\Enums\RideStatus;
use App\Enums\SubscriptionStatus;
use App\Enums\UserRole;
use App\Models\AuditLog;
use App\Models\Client;
use App\Models\Company;
use App\Models\Driver;
use App\Models\Plan;
use App\Models\Ride;
use App\Models\RideDetailLog;
use App\Models\RideLog;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class LogTenantScopeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (UserRole::cases() as $role) {
            Role::findOrCreate($role->value, 'web');
        }
    }

    public function test_motorista_and_cliente_only_see_own_ride_logs(): void
    {
        [, $companyA] = $this->makeCompany('A');
        [, $companyB] = $this->makeCompany('B');

        $clientA = $this->makeClientFor($companyA);
        $clientB = $this->makeClientFor($companyB);
        $driverUser = $this->makeDriverUser($companyA);
        $driver = $driverUser->driver;

        $rideOwn = $this->makeRide($companyA, $clientA, $driver);
        $rideOther = $this->makeRide($companyB, $clientB);

        $logOwn = $this->makeRideLog($rideOwn, 'own');
        $logOther = $this->makeRideLog($rideOther, 'other');

        Sanctum::actingAs($driverUser);
        $driverIds = collect($this->getJson('/api/v1/logs/rides')->assertOk()->json('data') ?? [])
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();
        $this->assertContains($logOwn->id, $driverIds);
        $this->assertNotContains($logOther->id, $driverIds);

        Sanctum::actingAs($clientA->user);
        $clientIds = collect($this->getJson('/api/v1/logs/rides')->assertOk()->json('data') ?? [])
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();
        $this->assertContains($logOwn->id, $clientIds);
        $this->assertNotContains($logOther->id, $clientIds);
    }

    public function test_empresa_details_and_audits_are_tenant_scoped(): void
    {
        [$ownerA, $companyA] = $this->makeCompany('A');
        [, $companyB] = $this->makeCompany('B');

        $clientA = $this->makeClientFor($companyA);
        $clientB = $this->makeClientFor($companyB);
        $rideA = $this->makeRide($companyA, $clientA);
        $rideB = $this->makeRide($companyB, $clientB);

        $detailA = RideDetailLog::query()->create([
            'ride_id' => $rideA->id,
            'payload' => ['fleet' => 'A'],
        ]);
        $detailB = RideDetailLog::query()->create([
            'ride_id' => $rideB->id,
            'payload' => ['fleet' => 'B'],
        ]);

        $auditA = AuditLog::query()->create([
            'user_id' => $ownerA->id,
            'action' => 'RIDE_CREATED',
            'auditable_type' => Ride::class,
            'auditable_id' => $rideA->id,
            'ip' => '127.0.0.1',
        ]);
        $auditB = AuditLog::query()->create([
            'user_id' => null,
            'action' => 'RIDE_CREATED',
            'auditable_type' => Ride::class,
            'auditable_id' => $rideB->id,
            'ip' => '127.0.0.1',
        ]);
        $auditCompanyB = AuditLog::query()->create([
            'user_id' => null,
            'action' => 'COMPANY_SETTINGS_UPDATED',
            'auditable_type' => Company::class,
            'auditable_id' => $companyB->id,
            'ip' => '127.0.0.1',
        ]);

        Sanctum::actingAs($ownerA);

        $detailIds = collect($this->getJson('/api/v1/logs/rides/details')->assertOk()->json('data') ?? [])
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();
        $this->assertContains($detailA->id, $detailIds);
        $this->assertNotContains($detailB->id, $detailIds);

        $auditIds = collect($this->getJson('/api/v1/logs/audits')->assertOk()->json('data') ?? [])
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();
        $this->assertContains($auditA->id, $auditIds);
        $this->assertNotContains($auditB->id, $auditIds);
        $this->assertNotContains($auditCompanyB->id, $auditIds);
    }

    public function test_ride_id_query_of_foreign_ride_is_forbidden(): void
    {
        [$ownerA, $companyA] = $this->makeCompany('A');
        [, $companyB] = $this->makeCompany('B');

        $clientB = $this->makeClientFor($companyB);
        $driverUser = $this->makeDriverUser($companyA);
        $rideOther = $this->makeRide($companyB, $clientB);
        $this->makeRideLog($rideOther, 'secret');

        Sanctum::actingAs($driverUser);
        $this->getJson('/api/v1/logs/rides?ride_id='.$rideOther->id)->assertForbidden();

        Sanctum::actingAs($ownerA);
        $this->getJson('/api/v1/logs/rides/details?ride_id='.$rideOther->id)->assertForbidden();
    }

    /**
     * @return array{0: User, 1: Company}
     */
    private function makeCompany(string $suffix): array
    {
        $owner = User::factory()->create(['email' => "owner-{$suffix}@test.com"]);
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

        $plan = Plan::query()->create([
            'slug' => 'plan-'.strtolower($suffix).'-'.uniqid(),
            'name' => 'Plan',
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

        return [$owner, $company];
    }

    private function makeClientFor(Company $company): Client
    {
        $user = User::factory()->create();
        $user->assignRole(UserRole::Cliente->value);
        $client = Client::query()->create(['user_id' => $user->id]);
        $client->companies()->attach($company->id, ['origin' => 'empresa', 'is_active' => true]);

        return $client->load('user');
    }

    private function makeDriverFor(Company $company, string $status = 'ATIVO'): Driver
    {
        $user = User::factory()->create();
        $user->assignRole(UserRole::Motorista->value);
        $driver = Driver::query()->create([
            'user_id' => $user->id,
            'status' => $status,
        ]);
        $driver->companies()->attach($company->id, ['status' => $status]);

        return $driver;
    }

    private function makeDriverUser(Company $company, string $status = 'ATIVO'): User
    {
        $driver = $this->makeDriverFor($company, $status);

        return $driver->user->fresh(['driver']);
    }

    private function makeRide(Company $company, Client $client, ?Driver $driver = null): Ride
    {
        return Ride::query()->create([
            'code' => 'RD-'.strtoupper(uniqid()),
            'client_id' => $client->id,
            'company_id' => $company->id,
            'driver_id' => $driver?->id,
            'origin' => ['address' => 'Rua A', 'city' => 'SP'],
            'destination' => ['address' => 'Rua B', 'city' => 'SP'],
            'distance_km' => 5,
            'status' => RideStatus::Finalizada,
            'financial_status' => FinancialStatus::Pendente,
            'payment_method' => 'pix',
            'gross_value' => 50.00,
        ]);
    }

    private function makeRideLog(Ride $ride, string $label): RideLog
    {
        return RideLog::query()->create([
            'ride_id' => $ride->id,
            'client_name' => "Client {$label}",
            'driver_name' => "Driver {$label}",
            'origin' => 'Origin '.$label,
            'destination' => 'Dest '.$label,
            'occurred_at' => now(),
            'status' => 'FINALIZADA',
        ]);
    }
}
