<?php

namespace Tests\Feature;

use App\Enums\FinancialStatus;
use App\Enums\RideStatus;
use App\Enums\UserRole;
use App\Models\Client;
use App\Models\Company;
use App\Models\Driver;
use App\Models\Ride;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class TenantIdorAndRidePaymentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (UserRole::cases() as $role) {
            Role::findOrCreate($role->value, 'web');
        }

        config(['kinito.stripe.secret' => null, 'kinito.stripe.webhook_secret' => null]);
    }

    public function test_motorista_cannot_see_or_patch_client_from_other_fleet(): void
    {
        [, $companyA] = $this->makeCompany('A');
        [, $companyB] = $this->makeCompany('B');

        $clientOther = $this->makeClientFor($companyB);
        $driverUser = $this->makeDriverUser($companyA);

        Sanctum::actingAs($driverUser);

        $ids = collect($this->getJson('/api/v1/clientes')->assertOk()->json('data') ?? [])
            ->pluck('id')
            ->map(fn ($id) => (string) $id)
            ->all();
        $this->assertNotContains((string) $clientOther->id, $ids);

        $this->getJson("/api/v1/clientes/{$clientOther->id}")->assertForbidden();

        $this->patchJson("/api/v1/clientes/{$clientOther->id}", [
            'phone' => '11999999999',
        ])->assertForbidden();
    }

    public function test_empresa_cannot_mutate_or_approve_rival_driver(): void
    {
        [$ownerA] = $this->makeCompany('A');
        [$ownerB, $companyB] = $this->makeCompany('B');

        $driverB = $this->makeDriverFor($companyB, 'PENDENTE');

        Sanctum::actingAs($ownerA);

        $this->patchJson("/api/v1/motoristas/{$driverB->id}", [
            'status' => 'ATIVO',
        ])->assertForbidden();

        $this->postJson("/api/v1/motoristas/{$driverB->id}/approve", [
            'company_id' => $companyB->id,
        ])->assertForbidden();
    }

    public function test_store_and_approve_reject_foreign_company_id(): void
    {
        [$ownerA] = $this->makeCompany('A');
        [, $companyB] = $this->makeCompany('B');

        Sanctum::actingAs($ownerA);

        $this->postJson('/api/v1/clientes', [
            'name' => 'Cliente Alheio',
            'email' => 'alheio@test.com',
            'company_id' => $companyB->id,
        ])->assertForbidden();

        $this->postJson('/api/v1/motoristas', [
            'name' => 'Motorista Alheio',
            'email' => 'motorista-alheio@test.com',
            'company_id' => $companyB->id,
        ])->assertForbidden();

        $driverOnA = $this->makeDriverFor(
            Company::query()->where('owner_user_id', $ownerA->id)->firstOrFail(),
            'PENDENTE'
        );

        $this->postJson("/api/v1/motoristas/{$driverOnA->id}/approve", [
            'company_id' => $companyB->id,
        ])->assertForbidden();
    }

    public function test_motorista_self_update_ignores_status(): void
    {
        [$owner, $company] = $this->makeCompany('Fleet');
        $driverUser = $this->makeDriverUser($company, 'ATIVO');
        $driver = $driverUser->driver;

        Sanctum::actingAs($driverUser);

        $this->patchJson("/api/v1/motoristas/{$driver->id}", [
            'vehicle_model' => 'Corolla',
            'status' => 'BLOQUEADO',
        ])->assertOk()
            ->assertJsonPath('data.status', 'ATIVO')
            ->assertJsonPath('data.vehicleModel', 'Corolla');
    }

    public function test_mock_payment_intent_and_webhook(): void
    {
        [$owner, $company] = $this->makeCompany('Pay');
        $client = $this->makeClientFor($company);
        $ride = $this->makeRide($company, $client);

        Sanctum::actingAs($owner);

        $response = $this->postJson("/api/v1/corridas/{$ride->id}/payment-intent")
            ->assertCreated()
            ->assertJsonPath('driver', 'mock');

        $intentId = (string) $response->json('payment.stripe_payment_intent_id');
        $this->assertStringStartsWith('pi_stub_', $intentId);

        $this->postJson('/api/v1/webhooks/stripe', [
            'type' => 'payment_intent.succeeded',
            'data' => ['object' => ['id' => $intentId]],
        ])->assertOk();

        $this->assertDatabaseHas('payments', [
            'stripe_payment_intent_id' => $intentId,
            'status' => 'PAGO',
        ]);
        $this->assertSame(FinancialStatus::Pago, $ride->fresh()->financial_status);
        $this->assertTrue((bool) $ride->fresh()->stripe_webhook_received);

        $this->postJson('/api/v1/webhooks/stripe', [
            'type' => 'payment_intent.succeeded',
            'data' => ['object' => ['id' => 'pi_stub_invented_does_not_exist']],
        ])->assertStatus(400);
    }

    public function test_stripe_mode_webhook_rejects_invalid_signature(): void
    {
        config([
            'kinito.stripe.secret' => 'sk_test_fake_secret_for_mode',
            'kinito.stripe.webhook_secret' => 'whsec_test_secret',
        ]);

        $this->postJson('/api/v1/webhooks/stripe', [
            'type' => 'payment_intent.succeeded',
            'data' => ['object' => ['id' => 'pi_anything']],
        ], [
            'Stripe-Signature' => 't=1,v1=invalid',
        ])->assertStatus(400);

        $this->postJson('/api/v1/webhooks/stripe', [
            'type' => 'payment_intent.succeeded',
            'data' => ['object' => ['id' => 'pi_anything']],
        ])->assertStatus(400);
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
        ]);

        return [$owner, $company];
    }

    private function makeClientFor(Company $company): Client
    {
        $user = User::factory()->create();
        $user->assignRole(UserRole::Cliente->value);
        $client = Client::query()->create(['user_id' => $user->id]);
        $client->companies()->attach($company->id, ['origin' => 'empresa', 'is_active' => true]);

        return $client;
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

    private function makeRide(Company $company, Client $client): Ride
    {
        return Ride::query()->create([
            'code' => 'RD-'.strtoupper(uniqid()),
            'client_id' => $client->id,
            'company_id' => $company->id,
            'origin' => ['address' => 'Rua A', 'city' => 'SP'],
            'destination' => ['address' => 'Rua B', 'city' => 'SP'],
            'distance_km' => 5,
            'status' => RideStatus::Finalizada,
            'financial_status' => FinancialStatus::Pendente,
            'payment_method' => 'pix',
            'gross_value' => 50.00,
        ]);
    }
}
