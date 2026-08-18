<?php

namespace Tests\Feature;

use App\Enums\DocumentStatus;
use App\Enums\FinancialStatus;
use App\Enums\RideStatus;
use App\Enums\SubscriptionStatus;
use App\Enums\UserRole;
use App\Models\Client;
use App\Models\Company;
use App\Models\CompanySetting;
use App\Models\Driver;
use App\Models\DriverDocument;
use App\Models\Plan;
use App\Models\Ride;
use App\Models\Subscription;
use App\Models\User;
use App\Services\Mail\MailService;
use App\Support\EnsureUserProfiles;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Mockery;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AlignmentScopeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (UserRole::cases() as $role) {
            Role::findOrCreate($role->value, 'web');
        }
    }

    public function test_client_cannot_create_ride_for_another_client(): void
    {
        [, $company] = $this->makeFleet('A');
        $mine = $this->makeClientFor($company);
        $other = $this->makeClientFor($company);

        Sanctum::actingAs($mine->user);
        $res = $this->postJson('/api/v1/corridas', $this->ridePayload($other))->assertCreated();

        $this->assertSame((string) $mine->id, $res->json('ride.clientId'));
    }

    public function test_empresa_cannot_create_ride_for_foreign_client(): void
    {
        [$ownerA] = $this->makeFleet('A');
        [, $companyB] = $this->makeFleet('B');
        $foreign = $this->makeClientFor($companyB);

        Sanctum::actingAs($ownerA);
        $this->postJson('/api/v1/corridas', $this->ridePayload($foreign, [
            'company_id' => $foreign->companies()->first()->id,
        ]))->assertForbidden();
    }

    public function test_motorista_does_not_list_fleet_clients_and_cannot_self_approve(): void
    {
        [, $company] = $this->makeFleet('A');
        $fleetClient = $this->makeClientFor($company);
        $driverUser = $this->makeDriverUser($company);
        $driver = $driverUser->driver;

        Sanctum::actingAs($driverUser);

        $ids = collect($this->getJson('/api/v1/clientes')->assertOk()->json('data') ?? [])
            ->pluck('id')
            ->map(fn ($id) => (string) $id)
            ->all();
        $this->assertNotContains((string) $fleetClient->id, $ids);

        $this->getJson("/api/v1/clientes/{$fleetClient->id}")->assertForbidden();

        $this->postJson("/api/v1/motoristas/{$driver->id}/approve", [
            'company_id' => $company->id,
        ])->assertForbidden();

        $doc = DriverDocument::query()->create([
            'driver_id' => $driver->id,
            'name' => 'CNH',
            'status' => DocumentStatus::Pendente,
            'uploaded_at' => now(),
        ]);
        $this->postJson("/api/v1/motoristas/{$driver->id}/documents/{$doc->id}/review", [
            'status' => 'APROVADO',
        ])->assertForbidden();
    }

    public function test_cliente_cannot_access_reports(): void
    {
        [, $company] = $this->makeFleet('C');
        $client = $this->makeClientFor($company);

        Sanctum::actingAs($client->user);
        $this->getJson('/api/v1/relatorios/consolidated')->assertForbidden();
        $this->getJson('/api/v1/financeiro/summary')->assertForbidden();
    }

    public function test_acting_role_scopes_rides_to_client_profile(): void
    {
        [$owner, $company] = $this->makeFleet('Act');
        EnsureUserProfiles::grantEmpresaSwitchProfiles($owner, $company);
        $owner->refresh();

        $otherClient = $this->makeClientFor($company);
        $ownRide = $this->makeRide($company, $owner->client);
        $otherRide = $this->makeRide($company, $otherClient);

        Sanctum::actingAs($owner);

        $asEmpresa = collect($this->getJson('/api/v1/corridas')->assertOk()->json('data'))
            ->pluck('id')
            ->map(fn ($id) => (string) $id);
        $this->assertContains((string) $ownRide->id, $asEmpresa);
        $this->assertContains((string) $otherRide->id, $asEmpresa);

        $asCliente = collect(
            $this->withHeader('X-Kinito-Role', 'CLIENTE')
                ->getJson('/api/v1/corridas')
                ->assertOk()
                ->json('data')
        )->pluck('id')->map(fn ($id) => (string) $id);

        $this->assertContains((string) $ownRide->id, $asCliente);
        $this->assertNotContains((string) $otherRide->id, $asCliente);
    }

    public function test_fornecedores_hides_company_pii(): void
    {
        [, $company] = $this->makeFleet('Prov');
        $client = $this->makeClientFor($company);

        Sanctum::actingAs($client->user);
        $row = collect($this->getJson('/api/v1/fornecedores')->assertOk()->json('data'))
            ->firstWhere('id', (string) $company->id);

        $this->assertNotNull($row);
        $this->assertArrayNotHasKey('cnpj', $row);
        $this->assertArrayNotHasKey('email', $row);
        $this->assertArrayNotHasKey('referralCode', $row);
        $this->assertArrayHasKey('name', $row);
    }

    public function test_finish_sends_client_and_driver_receipts(): void
    {
        $mail = Mockery::mock(MailService::class);
        $mail->shouldReceive('sendRideReceiptClient')->once()->andReturn(true);
        $mail->shouldReceive('sendRideReceiptDriver')->once()->andReturn(true);
        $this->app->instance(MailService::class, $mail);

        [$owner, $company] = $this->makeFleet('Mail');
        $client = $this->makeClientFor($company);
        $driver = $this->makeDriverFor($company);
        $ride = $this->makeRide($company, $client, [
            'driver_id' => $driver->id,
            'status' => RideStatus::EmAndamento,
            'gross_value' => 40,
            'driver_net' => 30,
        ]);

        Sanctum::actingAs($owner);
        $this->postJson("/api/v1/corridas/{$ride->id}/finish")->assertOk()
            ->assertJsonPath('data.status', RideStatus::Finalizada->value);
    }

    public function test_reassign_rejects_foreign_driver(): void
    {
        [$ownerA, $companyA] = $this->makeFleet('Ra');
        [, $companyB] = $this->makeFleet('Rb');
        $client = $this->makeClientFor($companyA);
        $foreign = $this->makeDriverFor($companyB);
        $ride = $this->makeRide($companyA, $client, ['status' => RideStatus::Aceita]);

        Sanctum::actingAs($ownerA);
        $this->postJson("/api/v1/corridas/{$ride->id}/reassign", [
            'driver_id' => $foreign->id,
        ])->assertUnprocessable();
    }

    /**
     * @return array{0: User, 1: Company}
     */
    private function makeFleet(string $suffix): array
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

        CompanySetting::query()->create([
            'company_id' => $company->id,
            'modelo_corridas' => 'AMBOS',
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

    private function makeDriverUser(Company $company): User
    {
        return $this->makeDriverFor($company)->user->fresh(['driver']);
    }

    /**
     * @param  array<string, mixed>  $extra
     */
    private function makeRide(Company $company, Client $client, array $extra = []): Ride
    {
        return Ride::query()->create(array_merge([
            'code' => 'RD-'.strtoupper(uniqid()),
            'client_id' => $client->id,
            'company_id' => $company->id,
            'origin' => ['address' => 'Rua A', 'city' => 'SP'],
            'destination' => ['address' => 'Rua B', 'city' => 'SP'],
            'distance_km' => 5,
            'status' => RideStatus::Disponivel,
            'financial_status' => FinancialStatus::Pendente,
            'payment_method' => 'pix',
            'gross_value' => 50,
        ], $extra));
    }

    /**
     * @param  array<string, mixed>  $extra
     * @return array<string, mixed>
     */
    private function ridePayload(Client $client, array $extra = []): array
    {
        return array_merge([
            'client_id' => $client->id,
            'origin' => ['address' => 'Rua A', 'city' => 'SP', 'lat' => -23.5, 'lng' => -46.6],
            'destination' => ['address' => 'Rua B', 'city' => 'SP', 'lat' => -23.6, 'lng' => -46.7],
            'distance_km' => 10,
            'payment_method' => 'pix',
        ], $extra);
    }
}
