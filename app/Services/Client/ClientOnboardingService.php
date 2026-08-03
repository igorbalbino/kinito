<?php

namespace App\Services\Client;

use App\Enums\ClientStatus;
use App\Enums\DefaultProviderMode;
use App\Enums\UserRole;
use App\Models\Client;
use App\Models\ClientPreference;
use App\Models\Company;
use App\Models\User;
use App\Services\Audit\AuditService;
use App\Services\Notification\NotificationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ClientOnboardingService
{
    public function __construct(
        private readonly AuditService $audit,
        private readonly NotificationService $notifications,
    ) {}

    /**
     * Public self-registration as CLIENTE.
     *
     * @param  array<string, mixed>  $data
     */
    public function selfRegister(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $user = User::query()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'password' => $data['password'],
            ]);
            $user->assignRole(UserRole::Cliente->value);

            $client = Client::query()->create([
                'user_id' => $user->id,
                'status' => ClientStatus::Ativo,
            ]);

            ClientPreference::query()->create([
                'client_id' => $client->id,
                'default_provider_mode' => DefaultProviderMode::All,
                'favorite_addresses' => [],
            ]);

            $this->audit->log('CLIENT_SELF_REGISTERED', $user, $client);

            return compact('user', 'client');
        });
    }

    /**
     * Company or driver creates a client and links them.
     *
     * @param  array<string, mixed>  $data
     */
    public function createByActor(array $data, User $actor, Company $company, string $origin = 'empresa'): array
    {
        return DB::transaction(function () use ($data, $actor, $company, $origin) {
            $tempPassword = $data['password'] ?? Str::password(10);

            $user = User::query()->firstOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'phone' => $data['phone'] ?? null,
                    'password' => $tempPassword,
                ]
            );

            if (! $user->hasRole(UserRole::Cliente->value)) {
                $user->assignRole(UserRole::Cliente->value);
            }

            $client = Client::query()->firstOrCreate(
                ['user_id' => $user->id],
                ['status' => ClientStatus::Ativo]
            );

            $company->clients()->syncWithoutDetaching([
                $client->id => [
                    'origin' => $origin,
                    'is_active' => true,
                ],
            ]);

            ClientPreference::query()->updateOrCreate(
                ['client_id' => $client->id],
                [
                    'default_provider_mode' => DefaultProviderMode::Company,
                    'default_company_id' => $company->id,
                    'favorite_addresses' => $data['favorite_addresses'] ?? [],
                ]
            );

            $this->notifications->notify(
                $user,
                'Acesso KINITO',
                "Olá {$user->name}, sua conta foi criada pela empresa {$company->name}. Email: {$user->email}. Senha temporária: {$tempPassword}",
                'sistema',
                'info',
                'email'
            );

            // WhatsApp stub prepared for future integration.
            $this->audit->log('CLIENT_CREATED_BY_ACTOR', $actor, $client, null, [
                'company_id' => $company->id,
                'origin' => $origin,
            ]);

            return compact('user', 'client', 'tempPassword');
        });
    }
}
