<?php

namespace Database\Seeders;

use App\Enums\ClientStatus;
use App\Enums\CompanyCollaboratorRole;
use App\Enums\DefaultProviderMode;
use App\Enums\DocumentStatus;
use App\Enums\DriverStatus;
use App\Enums\FinancialStatus;
use App\Enums\ModeloCorridas;
use App\Enums\PartnershipStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentProvider;
use App\Enums\RideStatus;
use App\Enums\SubscriptionStatus;
use App\Enums\TransactionType;
use App\Enums\UserRole;
use App\Models\AppNotification;
use App\Models\AuditLog;
use App\Models\Client;
use App\Models\ClientPreference;
use App\Models\Company;
use App\Models\CompanyPartnership;
use App\Models\CompanySetting;
use App\Models\Driver;
use App\Models\DriverDocument;
use App\Models\FeatureFlag;
use App\Models\FinancialTransaction;
use App\Models\Plan;
use App\Models\PlatformSetting;
use App\Models\Ride;
use App\Models\RideDetailLog;
use App\Models\RideLog;
use App\Models\Subscription;
use App\Models\User;
use App\Services\Finance\FinanceService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedRolesAndPermissions();
        $this->seedPlans();
        $this->seedFeatureFlags();
        $this->seedPlatformSettings();

        $admin = $this->seedAdmin();
        $companies = $this->seedCompanies();
        $this->seedPartnerships($companies);
        $drivers = $this->seedDrivers($companies);
        $clients = $this->seedClients($companies);
        $this->seedRides($companies, $drivers, $clients);
        $this->seedNotifications($admin, $companies);
        $this->seedAudits($admin);

        $this->command?->info('Kinito seed concluído.');
        $this->command?->info('Admin: admin@kinito.test / password');
    }

    private function seedRolesAndPermissions(): void
    {
        $permissions = [
            'rides.view', 'rides.create', 'rides.manage',
            'drivers.view', 'drivers.manage',
            'clients.view', 'clients.manage',
            'companies.view', 'companies.manage',
            'finance.view', 'finance.manage',
            'reports.view', 'logs.view', 'settings.manage',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        foreach (UserRole::cases() as $roleEnum) {
            Role::findOrCreate($roleEnum->value, 'web');
        }

        Role::findByName(UserRole::Admin->value)->syncPermissions($permissions);
        Role::findByName(UserRole::Empresa->value)->syncPermissions([
            'rides.view', 'rides.create', 'rides.manage',
            'drivers.view', 'drivers.manage',
            'clients.view', 'clients.manage',
            'companies.view', 'companies.manage',
            'finance.view', 'finance.manage',
            'reports.view', 'logs.view', 'settings.manage',
        ]);
        Role::findByName(UserRole::Motorista->value)->syncPermissions([
            'rides.view', 'drivers.view', 'clients.view', 'clients.manage',
        ]);
        Role::findByName(UserRole::Cliente->value)->syncPermissions([
            'rides.view', 'rides.create', 'clients.view',
        ]);
    }

    private function seedPlans(): void
    {
        $plans = [
            [
                'slug' => 'starter',
                'name' => 'Starter',
                'description' => 'Ideal para frotas pequenas',
                'price' => 99.90,
                'max_drivers' => 10,
                'max_rides_month' => 500,
                'features' => ['corridas', 'clientes', 'relatorios_basicos'],
            ],
            [
                'slug' => 'pro',
                'name' => 'Pro',
                'description' => 'Para operações com parceiros',
                'price' => 249.90,
                'max_drivers' => 50,
                'max_rides_month' => 5000,
                'features' => ['corridas', 'parceiros', 'financeiro', 'relatorios'],
            ],
            [
                'slug' => 'enterprise',
                'name' => 'Enterprise',
                'description' => 'Sem limites operacionais',
                'price' => 799.90,
                'max_drivers' => null,
                'max_rides_month' => null,
                'features' => ['tudo', 'api', 'sla', 'suporte_prioritario'],
            ],
        ];

        foreach ($plans as $plan) {
            Plan::query()->updateOrCreate(['slug' => $plan['slug']], $plan + [
                'billing_period' => 'monthly',
                'is_active' => true,
            ]);
        }
    }

    private function seedFeatureFlags(): void
    {
        $flags = [
            'saasMode' => true,
            'stripe' => false,
            'comissaoAutomatica' => true,
            'geolocalizacao' => true,
            'apiPublica' => false,
            'logsAvancados' => true,
            'notificacoesPush' => false,
            'moduloClientes' => true,
            'moduloMotoristas' => true,
            'relatoriosFinanceiros' => true,
            'auditoriaSistema' => true,
        ];

        foreach ($flags as $key => $enabled) {
            FeatureFlag::query()->updateOrCreate(
                ['key' => $key],
                ['enabled' => $enabled, 'description' => "Flag {$key}"]
            );
        }
    }

    private function seedPlatformSettings(): void
    {
        PlatformSetting::setValue('PAYMENT_PROVIDER', config('kinito.payment_provider', 'manual'));
        PlatformSetting::setValue('PLATFORM_NAME', 'Kinito');
    }

    private function seedAdmin(): User
    {
        $admin = User::query()->updateOrCreate(
            ['email' => 'admin@kinito.test'],
            [
                'name' => 'Admin Kinito',
                'phone' => '11999990000',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'is_active' => true,
            ]
        );
        $admin->syncRoles([UserRole::Admin->value]);

        return $admin;
    }

    /**
     * @return array<int, Company>
     */
    private function seedCompanies(): array
    {
        $defs = [
            ['name' => 'Alpha Mobilidade', 'cnpj' => '11.111.111/0001-11', 'email' => 'empresa1@kinito.test', 'plan' => 'pro'],
            ['name' => 'Beta Transfer', 'cnpj' => '22.222.222/0001-22', 'email' => 'empresa2@kinito.test', 'plan' => 'starter'],
            ['name' => 'Gamma Logistics', 'cnpj' => '33.333.333/0001-33', 'email' => 'empresa3@kinito.test', 'plan' => 'enterprise'],
        ];

        $companies = [];

        foreach ($defs as $i => $def) {
            $user = User::query()->updateOrCreate(
                ['email' => $def['email']],
                [
                    'name' => "Gestor {$def['name']}",
                    'phone' => '1198888'.str_pad((string) ($i + 1), 4, '0', STR_PAD_LEFT),
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                    'is_active' => true,
                ]
            );
            $user->syncRoles([UserRole::Empresa->value]);

            $company = Company::query()->updateOrCreate(
                ['cnpj' => $def['cnpj']],
                [
                    'owner_user_id' => $user->id,
                    'name' => $def['name'],
                    'slug' => Str::slug($def['name']),
                    'email' => $def['email'],
                    'phone' => $user->phone,
                    'commission_rate' => 10,
                    'is_distributor' => true,
                    'is_provider' => true,
                    'is_partner_enabled' => true,
                    'is_active' => true,
                ]
            );

            $company->users()->syncWithoutDetaching([
                $user->id => ['role' => CompanyCollaboratorRole::Dono->value, 'is_active' => true],
            ]);

            CompanySetting::query()->updateOrCreate(
                ['company_id' => $company->id],
                [
                    'modelo_corridas' => ModeloCorridas::Ambos,
                    'accept_instant_rides' => true,
                    'allow_scheduling' => true,
                    'stripe_enabled' => false,
                    'notifications_enabled' => true,
                    'allow_partners' => true,
                ]
            );

            $plan = Plan::query()->where('slug', $def['plan'])->first();
            Subscription::query()->updateOrCreate(
                ['company_id' => $company->id, 'plan_id' => $plan->id],
                [
                    'status' => SubscriptionStatus::Active,
                    'starts_at' => now()->subMonth(),
                    'ends_at' => now()->addYear(),
                ]
            );

            $companies[] = $company;
        }

        return $companies;
    }

    /**
     * @param  array<int, Company>  $companies
     */
    private function seedPartnerships(array $companies): void
    {
        CompanyPartnership::query()->updateOrCreate(
            [
                'company_id' => $companies[0]->id,
                'partner_company_id' => $companies[1]->id,
            ],
            [
                'status' => PartnershipStatus::Active,
                'notes' => 'Parceria operacional Alpha ↔ Beta',
            ]
        );
    }

    /**
     * @param  array<int, Company>  $companies
     * @return array<int, Driver>
     */
    private function seedDrivers(array $companies): array
    {
        $drivers = [];

        for ($i = 1; $i <= 8; $i++) {
            $user = User::query()->updateOrCreate(
                ['email' => "motorista{$i}@kinito.test"],
                [
                    'name' => "Motorista {$i}",
                    'phone' => '1197777'.str_pad((string) $i, 4, '0', STR_PAD_LEFT),
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                    'is_active' => true,
                ]
            );
            $user->syncRoles([UserRole::Motorista->value]);

            $status = $i <= 6 ? DriverStatus::Ativo : DriverStatus::Pendente;

            $driver = Driver::query()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'status' => $status,
                    'vehicle_model' => 'Toyota Corolla',
                    'vehicle_plate' => 'ABC1D'.str_pad((string) $i, 2, '0', STR_PAD_LEFT),
                    'vehicle_color' => 'Prata',
                    'city' => 'São Paulo',
                    'rating' => 4.5 + ($i % 5) * 0.1,
                    'total_rides' => $i * 10,
                    'total_earnings' => $i * 450,
                    'pending_balance' => $i * 50,
                ]
            );

            foreach (['CNH Categoria B', 'CRLV', 'Antecedentes'] as $doc) {
                DriverDocument::query()->updateOrCreate(
                    ['driver_id' => $driver->id, 'name' => $doc],
                    [
                        'status' => $status === DriverStatus::Ativo ? DocumentStatus::Aprovado : DocumentStatus::Pendente,
                        'uploaded_at' => now()->subDays(10),
                        'expires_at' => now()->addYear(),
                    ]
                );
            }

            $company = $companies[($i - 1) % count($companies)];
            $driver->companies()->syncWithoutDetaching([
                $company->id => [
                    'status' => $status->value,
                    'approved_at' => $status === DriverStatus::Ativo ? now() : null,
                ],
            ]);

            $drivers[] = $driver;
        }

        return $drivers;
    }

    /**
     * @param  array<int, Company>  $companies
     * @return array<int, Client>
     */
    private function seedClients(array $companies): array
    {
        $clients = [];

        for ($i = 1; $i <= 10; $i++) {
            $user = User::query()->updateOrCreate(
                ['email' => "cliente{$i}@kinito.test"],
                [
                    'name' => "Cliente {$i}",
                    'phone' => '1196666'.str_pad((string) $i, 4, '0', STR_PAD_LEFT),
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                    'is_active' => true,
                ]
            );
            $user->syncRoles([UserRole::Cliente->value]);

            $client = Client::query()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'status' => $i === 1 ? ClientStatus::Vip : ClientStatus::Ativo,
                    'rating' => 4.8,
                    'total_rides' => $i * 3,
                    'total_spent' => $i * 120,
                ]
            );

            $company = $companies[($i - 1) % count($companies)];
            $linked = $i <= 7;

            if ($linked) {
                $client->companies()->syncWithoutDetaching([
                    $company->id => [
                        'origin' => $i <= 4 ? 'empresa' : 'self',
                        'is_active' => true,
                    ],
                ]);
            }

            ClientPreference::query()->updateOrCreate(
                ['client_id' => $client->id],
                [
                    'default_provider_mode' => $linked ? DefaultProviderMode::Company : DefaultProviderMode::All,
                    'default_company_id' => $linked ? $company->id : null,
                    'favorite_addresses' => [
                        'Av. Paulista, 1000 - São Paulo',
                        'Rua Augusta, 500 - São Paulo',
                    ],
                ]
            );

            $clients[] = $client;
        }

        return $clients;
    }

    /**
     * @param  array<int, Company>  $companies
     * @param  array<int, Driver>  $drivers
     * @param  array<int, Client>  $clients
     */
    private function seedRides(array $companies, array $drivers, array $clients): void
    {
        $finance = app(FinanceService::class);
        $statuses = [
            RideStatus::Disponivel,
            RideStatus::Aceita,
            RideStatus::EmAndamento,
            RideStatus::Finalizada,
            RideStatus::Agendada,
            RideStatus::Cancelada,
        ];

        for ($i = 1; $i <= 20; $i++) {
            $company = $companies[($i - 1) % count($companies)];
            $client = $clients[($i - 1) % count($clients)];
            $driver = $drivers[($i - 1) % count($drivers)];
            $status = $statuses[($i - 1) % count($statuses)];
            $partner = $i % 5 === 0 ? $companies[1] : null;

            $distance = 5 + ($i % 20);
            $gross = round(max(12, $distance * 3.5), 2);

            $ride = Ride::query()->updateOrCreate(
                ['code' => 'COR-SEED-'.str_pad((string) $i, 4, '0', STR_PAD_LEFT)],
                [
                    'client_id' => $client->id,
                    'company_id' => $company->id,
                    'partner_company_id' => $partner?->id,
                    'driver_id' => in_array($status, [RideStatus::Disponivel, RideStatus::Agendada], true) ? null : $driver->id,
                    'origin' => [
                        'address' => "Origem {$i}, São Paulo",
                        'lat' => -23.55,
                        'lng' => -46.63,
                        'city' => 'São Paulo',
                        'neighborhood' => 'Centro',
                    ],
                    'destination' => [
                        'address' => "Destino {$i}, São Paulo",
                        'lat' => -23.56,
                        'lng' => -46.65,
                        'city' => 'São Paulo',
                        'neighborhood' => 'Pinheiros',
                    ],
                    'scheduled_date' => $status === RideStatus::Agendada ? now()->addDays(2)->toDateString() : null,
                    'scheduled_time' => $status === RideStatus::Agendada ? '14:00' : null,
                    'distance_km' => $distance,
                    'duration_min' => $distance * 3,
                    'status' => $status,
                    'financial_status' => match ($status) {
                        RideStatus::Finalizada => FinancialStatus::Pago,
                        RideStatus::Cancelada => FinancialStatus::Estornado,
                        default => FinancialStatus::Pendente,
                    },
                    'payment_method' => PaymentMethod::Pix,
                    'payment_provider' => PaymentProvider::Manual,
                    'gross_value' => $gross,
                    'notes' => "Corrida seed #{$i}",
                    'requested_at' => now()->subDays(20 - $i),
                    'started_at' => in_array($status, [RideStatus::EmAndamento, RideStatus::Finalizada], true) ? now()->subHours(2) : null,
                    'completed_at' => $status === RideStatus::Finalizada ? now()->subHour() : null,
                    'cancelled_at' => $status === RideStatus::Cancelada ? now()->subHours(3) : null,
                ]
            );

            $finance->applyToRide($ride->fresh(['company']), $gross);

            if ($status === RideStatus::Finalizada) {
                $ride->update(['financial_status' => FinancialStatus::Pago]);
                FinancialTransaction::query()->updateOrCreate(
                    ['code' => 'TX-SEED-'.str_pad((string) $i, 4, '0', STR_PAD_LEFT)],
                    [
                        'ride_id' => $ride->id,
                        'company_id' => $company->id,
                        'type' => TransactionType::Corrida,
                        'amount' => $ride->gross_value,
                        'gross_value' => $ride->gross_value,
                        'platform_fee' => $ride->platform_commission,
                        'company_fee' => $ride->company_cut,
                        'driver_fee' => $ride->driver_net,
                        'stripe_fee' => $ride->stripe_fee,
                        'status' => 'CONFIRMADO',
                        'payment_mode' => PaymentProvider::Manual,
                        'sender' => $client->user->name,
                        'recipient' => $company->name,
                        'description' => 'Corrida '.$ride->code,
                    ]
                );
            }

            RideLog::query()->updateOrCreate(
                ['ride_id' => $ride->id, 'status' => $status->value],
                [
                    'client_name' => $client->user->name,
                    'driver_name' => $ride->driver_id ? $driver->user->name : null,
                    'origin' => $ride->origin['address'],
                    'destination' => $ride->destination['address'],
                    'occurred_at' => now()->subDays(20 - $i),
                ]
            );

            RideDetailLog::query()->create([
                'ride_id' => $ride->id,
                'payload' => [
                    'event' => 'seed',
                    'status' => $status->value,
                    'at' => now()->toIso8601String(),
                ],
            ]);
        }
    }

    /**
     * @param  array<int, Company>  $companies
     */
    private function seedNotifications(User $admin, array $companies): void
    {
        AppNotification::query()->updateOrCreate(
            ['user_id' => $admin->id, 'title' => 'Bem-vindo ao Kinito'],
            [
                'message' => 'Backend API operacional com seed inicial.',
                'category' => 'sistema',
                'type' => 'success',
                'channel' => 'email',
                'read' => false,
                'sent_at' => now(),
            ]
        );

        foreach ($companies as $company) {
            AppNotification::query()->updateOrCreate(
                ['user_id' => $company->owner_user_id, 'title' => 'Empresa ativa'],
                [
                    'message' => "A empresa {$company->name} está pronta para operar.",
                    'category' => 'sistema',
                    'type' => 'info',
                    'channel' => 'email',
                    'read' => false,
                    'sent_at' => now(),
                ]
            );
        }
    }

    private function seedAudits(User $admin): void
    {
        AuditLog::query()->create([
            'user_id' => $admin->id,
            'action' => 'SEED_COMPLETED',
            'auditable_type' => null,
            'auditable_id' => null,
            'before' => null,
            'after' => ['seed' => true],
            'ip' => '127.0.0.1',
            'user_agent' => 'seeder',
        ]);
    }
}
