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
use App\Services\Provider\ProviderTransferService;
use App\Support\EnsureUserRoles;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ClientOnboardingService
{
    public function __construct(
        private readonly AuditService $audit,
        private readonly NotificationService $notifications,
        private readonly ProviderTransferService $transfers,
    ) {}

    /**
     * Public self-registration as CLIENTE.
     *
     * @param  array<string, mixed>  $data
     */
    public function selfRegister(array $data): array
    {
        $result = DB::transaction(function () use ($data) {
            $user = User::query()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'password' => $data['password'],
            ]);
            EnsureUserRoles::assign($user, UserRole::Cliente);

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

        $this->notifications->sendRegistrationEmail($result['user']);

        return $result;
    }

    /**
     * Company or driver creates a client and links them.
     * Existing clients get a consent transfer request instead of forced provider switch.
     *
     * @param  array<string, mixed>  $data
     */
    public function createByActor(array $data, User $actor, Company $company, string $origin = 'empresa'): array
    {
        $placeholderPassword = Str::password(32);
        $wasNewUser = ! User::query()->where('email', $data['email'])->exists();

        if (! $wasNewUser) {
            $user = User::query()->where('email', $data['email'])->firstOrFail();

            if (! $user->hasRole(UserRole::Cliente->value)) {
                EnsureUserRoles::assign($user, UserRole::Cliente);
            }

            $client = Client::query()->firstOrCreate(
                ['user_id' => $user->id],
                ['status' => ClientStatus::Ativo]
            );

            // Soft membership pending consent — no PII exposure as fully linked until accept.
            $company->clients()->syncWithoutDetaching([
                $client->id => [
                    'origin' => $origin,
                    'is_active' => false,
                ],
            ]);

            $result = $this->transfers->requestClientTransfer($client, $company, $actor);

            $this->audit->log('CLIENT_TRANSFER_REQUESTED_BY_ACTOR', $actor, $client, null, [
                'company_id' => $company->id,
                'transfer_pending' => $result['transfer_pending'],
            ]);

            return [
                'user' => $user->fresh(),
                'client' => $result['client'],
                'invite_pending' => false,
                'transfer_pending' => $result['transfer_pending'],
            ];
        }

        $result = DB::transaction(function () use ($data, $actor, $company, $origin, $placeholderPassword) {
            $user = User::query()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'password' => $placeholderPassword,
                'must_change_password' => true,
                'email_verified_at' => null,
            ]);

            EnsureUserRoles::assign($user, UserRole::Cliente);

            $client = Client::query()->create([
                'user_id' => $user->id,
                'status' => ClientStatus::Ativo,
            ]);

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

            $link = rtrim((string) config('kinito.frontend_url'), '/').'/login';
            $safeMessage = "A empresa {$company->name} cadastrou você no Kinito. "
                .'Confirme o e-mail enviado para ativar o acesso e receber a senha temporária.';

            $this->notifications->notify(
                $user,
                'Convite Kinito',
                $safeMessage,
                'sistema',
                'info',
                'in_app',
                $link,
            );

            $this->audit->log('CLIENT_CREATED_BY_ACTOR', $actor, $client, null, [
                'company_id' => $company->id,
                'origin' => $origin,
                'invite_pending' => true,
            ]);

            return [
                'user' => $user->fresh(),
                'client' => $client,
                'invite_pending' => true,
                'transfer_pending' => false,
            ];
        });

        if ($result['invite_pending'] ?? false) {
            $this->notifications->sendClientInviteEmail($result['user'], $company->name);
        }

        return $result;
    }
}
