<?php

namespace Tests\Feature;

use App\Enums\FinancialStatus;
use App\Enums\RideStatus;
use App\Enums\SubscriptionStatus;
use App\Enums\UserRole;
use App\Models\Client;
use App\Models\Company;
use App\Models\CompanySetting;
use App\Models\Driver;
use App\Models\Plan;
use App\Models\Ride;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RideLifecycleAuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (UserRole::cases() as $role) {
            Role::findOrCreate($role->value, 'web');
        }
    }

    public function test_create_rejects_foreign_company_and_strips_client_driver_id(): void
    {
        [$ownerA, $companyA] = $this->makeFleet('A');
        [, $companyB] = $this->makeFleet('B');
        $client = $this->makeClientFor($companyA);
        $foreignDriver = $this->makeDriverFor($companyB);

        Sanctum::actingAs($ownerA);
        $this->postJson('/api/v1/corridas', $this->ridePayload($client, [
            'company_id' => $companyB->id,
        ]))->assertForbidden();

        Sanctum::actingAs($client->user);
        $res = $this->postJson('/api/v1/corridas', $this->ridePayload($client, [
            'company_id' => $companyA->id,
            'driver_id' => $foreignDriver->id,
            'partner_company_id' => $companyB->id,
        ]))->assertCreated();

        $this->assertNull($res->json('ride.driverId'));
        $this->assertNull($res->json('ride.partnerCompanyId'));
        $this->assertSame(RideStatus::Disponivel->value, $res->json('ride.status'));
    }

    public function test_client_can_cancel_but_not_start_or_finish(): void
    {
        [, $company] = $this->makeFleet('C');
        $client = $this->makeClientFor($company);
        $driver = $this->makeDriverFor($company);

        $ride = $this->makeRide($company, $client, [
            'driver_id' => $driver->id,
            'status' => RideStatus::Aceita,
        ]);

        Sanctum::actingAs($client->user);
        $this->postJson("/api/v1/corridas/{$ride->id}/start")->assertForbidden();
        $this->postJson("/api/v1/corridas/{$ride->id}/finish")->assertForbidden();
        $this->postJson("/api/v1/corridas/{$ride->id}/cancel")->assertOk()
            ->assertJsonPath('data.status', RideStatus::Cancelada->value);
    }

    public function test_motorista_can_accept_open_ride_from_own_fleet_only(): void
    {
        [, $companyA] = $this->makeFleet('A');
        [, $companyB] = $this->makeFleet('B');
        $clientA = $this->makeClientFor($companyA);
        $clientB = $this->makeClientFor($companyB);
        $driverUser = $this->makeDriverUser($companyA);

        $openA = $this->makeRide($companyA, $clientA, ['status' => RideStatus::Disponivel]);
        $openB = $this->makeRide($companyB, $clientB, ['status' => RideStatus::Disponivel]);

        Sanctum::actingAs($driverUser);
        $this->postJson("/api/v1/corridas/{$openA->id}/accept")->assertOk()
            ->assertJsonPath('data.status', RideStatus::Aceita->value)
            ->assertJsonPath('data.driverId', (string) $driverUser->driver->id);

        $this->postJson("/api/v1/corridas/{$openB->id}/accept")->assertForbidden();
    }

    public function test_finish_keeps_financial_pending_even_with_stripe_provider(): void
    {
        config(['kinito.payment_provider' => 'stripe']);

        [$owner, $company] = $this->makeFleet('Pay');
        $client = $this->makeClientFor($company);
        $driver = $this->makeDriverFor($company);
        $ride = $this->makeRide($company, $client, [
            'driver_id' => $driver->id,
            'status' => RideStatus::EmAndamento,
            'gross_value' => 40,
        ]);

        Sanctum::actingAs($owner);
        $this->postJson("/api/v1/corridas/{$ride->id}/finish")->assertOk()
            ->assertJsonPath('data.status', RideStatus::Finalizada->value)
            ->assertJsonPath('data.financialStatus', FinancialStatus::Pendente->value);
    }

    public function test_update_settings_does_not_leak_whatsapp_webhook_secret(): void
    {
        [$owner, $company] = $this->makeFleet('Sec');
        $company->settings->update(['whatsapp_webhook_secret' => 'whsec_should_not_leak']);

        Sanctum::actingAs($owner);
        $res = $this->putJson("/api/v1/empresas/{$company->id}/settings", [
            'notifications_enabled' => true,
        ])->assertOk();

        $payload = json_encode($res->json());
        $this->assertStringNotContainsString('whsec_should_not_leak', $payload);
        $this->assertArrayNotHasKey('whatsapp_webhook_secret', $res->json('settings') ?? []);
        $this->assertArrayNotHasKey('whatsappWebhookSecret', $res->json('settings') ?? []);
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
