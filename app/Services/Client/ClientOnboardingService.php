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
            $tempPassword = Str::password(10);
            $wasNewUser = ! User::query()->where('email', $data['email'])->exists();

            $user = User::query()->firstOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'phone' => $data['phone'] ?? null,
                    'password' => $tempPassword,
                    'must_change_password' => true,
                ]
            );

            if ($wasNewUser) {
                $user->forceFill([
                    'must_change_password' => true,
                    'password' => $tempPassword,
                ])->save();
            } elseif (! empty($data['phone']) && ! $user->phone) {
                $user->update(['phone' => $data['phone']]);
            }

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

            if ($wasNewUser) {
                $login = $user->email ?: $user->phone;
                $link = rtrim((string) config('kinito.frontend_url'), '/').'/login';
                $accessMessage = "A empresa {$company->name} cadastrou você no Kinito. "
                    ."Acesse: {$link}\n"
                    ."Login: {$login}\n"
                    ."Senha temporária: {$tempPassword}\n"
                    .'No primeiro acesso você deverá trocar a senha.';

                $channels = ['email'];
                if (filled($user->phone) && config('kinito.whatsapp.enabled')) {
                    $channels[] = 'whatsapp';
                }

                $this->notifications->notifyChannels(
                    $user,
                    'Acesso Kinito',
                    $accessMessage,
                    $channels,
                    'sistema',
                    'info'
                );
            }

            $this->audit->log('CLIENT_CREATED_BY_ACTOR', $actor, $client, null, [
                'company_id' => $company->id,
                'origin' => $origin,
            ]);

            return [
                'user' => $user,
                'client' => $client,
                'tempPassword' => $wasNewUser ? $tempPassword : null,
            ];
        });
    }
}
