<?php

namespace App\Services\Provider;

use App\Enums\DefaultProviderMode;
use App\Enums\DriverStatus;
use App\Models\Client;
use App\Models\Company;
use App\Models\Driver;
use App\Models\ProviderTransferRequest;
use App\Models\User;
use App\Services\Audit\AuditService;
use App\Services\Notification\NotificationService;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class ProviderTransferService
{
    public function __construct(
        private readonly ProviderPreferenceService $providers,
        private readonly NotificationService $notifications,
        private readonly AuditService $audit,
    ) {}

    /**
     * When a company tries to onboard an existing client who is elsewhere or in ALL mode.
     *
     * @return array{client: Client, transfer_pending: bool, transfer?: ProviderTransferRequest}
     */
    public function requestClientTransfer(Client $client, Company $company, User $actor): array
    {
        $client->loadMissing(['preferences', 'user', 'companies']);
        $prefs = $client->preferences;
        $mode = $prefs?->default_provider_mode ?? DefaultProviderMode::All;
        $currentCompanyId = $prefs?->default_company_id;

        $alreadyPrimary = $mode === DefaultProviderMode::Company
            && $currentCompanyId
            && (int) $currentCompanyId === (int) $company->id;

        if ($alreadyPrimary) {
            $company->clients()->syncWithoutDetaching([
                $client->id => ['origin' => 'empresa', 'is_active' => true],
            ]);

            return ['client' => $client->fresh(['user', 'preferences', 'companies']), 'transfer_pending' => false];
        }

        $needsConsent = $mode === DefaultProviderMode::All
            || ($currentCompanyId && (int) $currentCompanyId !== (int) $company->id)
            || $client->companies()->where('companies.id', '!=', $company->id)->exists();

        if (! $needsConsent && ! $currentCompanyId) {
            // Brand-new client profile without preferences conflict — link directly.
            $this->providers->updateClientProvider($client, [
                'default_provider_mode' => DefaultProviderMode::Company->value,
                'default_company_id' => $company->id,
            ], $actor);

            return ['client' => $client->fresh(['user', 'preferences', 'companies']), 'transfer_pending' => false];
        }

        if ($needsConsent) {
            $transfer = $this->createPendingTransfer('client', $client->id, $company, $actor, $currentCompanyId);
            $this->notifySubject($client->user, $company, $transfer, 'cliente');

            return [
                'client' => $client->fresh(['user', 'preferences', 'companies']),
                'transfer_pending' => true,
                'transfer' => $transfer,
            ];
        }

        $this->providers->updateClientProvider($client, [
            'default_provider_mode' => DefaultProviderMode::Company->value,
            'default_company_id' => $company->id,
        ], $actor);

        return ['client' => $client->fresh(['user', 'preferences', 'companies']), 'transfer_pending' => false];
    }

    /**
     * @return array{driver: Driver, transfer_pending: bool, transfer?: ProviderTransferRequest}
     */
    public function requestDriverTransfer(Driver $driver, Company $company, User $actor): array
    {
        $driver->loadMissing(['user', 'companies', 'primaryCompany']);

        $alreadyPrimary = (int) $driver->primary_company_id === (int) $company->id
            && ($driver->provider_mode ?? DefaultProviderMode::Company) === DefaultProviderMode::Company
            && ! $driver->provider_switch_pending;

        if ($alreadyPrimary) {
            $driver->companies()->syncWithoutDetaching([
                $company->id => [
                    'status' => DriverStatus::Ativo->value,
                    'approved_at' => now(),
                    'approved_by' => $actor->id,
                    'origin' => 'empresa',
                ],
            ]);

            return ['driver' => $driver->fresh(['user', 'companies', 'primaryCompany']), 'transfer_pending' => false];
        }

        $mode = $driver->provider_mode ?? DefaultProviderMode::Company;
        $needsConsent = $mode === DefaultProviderMode::All
            || ($driver->primary_company_id && (int) $driver->primary_company_id !== (int) $company->id)
            || $driver->companies()->where('companies.id', '!=', $company->id)->exists();

        if ($needsConsent) {
            // Soft-link as pending fleet member without stealing primary.
            $driver->companies()->syncWithoutDetaching([
                $company->id => [
                    'status' => DriverStatus::Pendente->value,
                    'approved_at' => null,
                    'approved_by' => null,
                    'origin' => 'empresa',
                ],
            ]);

            $transfer = $this->createPendingTransfer(
                'driver',
                $driver->id,
                $company,
                $actor,
                $driver->primary_company_id
            );
            $this->notifySubject($driver->user, $company, $transfer, 'motorista');

            return [
                'driver' => $driver->fresh(['user', 'companies', 'primaryCompany']),
                'transfer_pending' => true,
                'transfer' => $transfer,
            ];
        }

        $driver->companies()->syncWithoutDetaching([
            $company->id => [
                'status' => DriverStatus::Ativo->value,
                'approved_at' => now(),
                'approved_by' => $actor->id,
                'origin' => 'empresa',
            ],
        ]);

        if (! $driver->primary_company_id) {
            $driver->forceFill([
                'primary_company_id' => $company->id,
                'provider_mode' => DefaultProviderMode::Company,
                'provider_switch_pending' => false,
            ])->save();
        }

        return ['driver' => $driver->fresh(['user', 'companies', 'primaryCompany']), 'transfer_pending' => false];
    }

    public function accept(ProviderTransferRequest $transfer, User $actor): ProviderTransferRequest
    {
        $this->assertOwnsSubject($transfer, $actor);
        abort_unless($transfer->status === 'pending', 422, 'Esta solicitação já foi resolvida.');

        return DB::transaction(function () use ($transfer, $actor) {
            $company = Company::query()->findOrFail($transfer->to_company_id);

            if ($transfer->subject_type === 'client') {
                $client = Client::query()->findOrFail($transfer->subject_id);
                $this->providers->updateClientProvider($client, [
                    'default_provider_mode' => DefaultProviderMode::Company->value,
                    'default_company_id' => $company->id,
                ], $actor);
            } else {
                $driver = Driver::query()->findOrFail($transfer->subject_id);
                $driver->companies()->syncWithoutDetaching([
                    $company->id => [
                        'status' => DriverStatus::Ativo->value,
                        'approved_at' => now(),
                        'approved_by' => $actor->id,
                        'origin' => 'empresa',
                    ],
                ]);
                $driver->forceFill([
                    'primary_company_id' => $company->id,
                    'previous_primary_company_id' => null,
                    'provider_switch_pending' => false,
                    'provider_mode' => DefaultProviderMode::Company,
                ])->save();
            }

            $transfer->update(['status' => 'accepted', 'resolved_at' => now()]);
            $this->audit->log('PROVIDER_TRANSFER_ACCEPTED', $actor, $transfer);
            $this->notifyRequester($transfer, true);

            return $transfer->fresh();
        });
    }

    public function reject(ProviderTransferRequest $transfer, User $actor): ProviderTransferRequest
    {
        $this->assertOwnsSubject($transfer, $actor);
        abort_unless($transfer->status === 'pending', 422, 'Esta solicitação já foi resolvida.');

        $transfer->update(['status' => 'rejected', 'resolved_at' => now()]);
        $this->audit->log('PROVIDER_TRANSFER_REJECTED', $actor, $transfer);
        $this->notifyRequester($transfer, false);

        return $transfer->fresh();
    }

    private function createPendingTransfer(
        string $subjectType,
        int $subjectId,
        Company $company,
        User $actor,
        ?int $fromCompanyId,
    ): ProviderTransferRequest {
        ProviderTransferRequest::query()
            ->where('subject_type', $subjectType)
            ->where('subject_id', $subjectId)
            ->where('to_company_id', $company->id)
            ->where('status', 'pending')
            ->update(['status' => 'rejected', 'resolved_at' => now()]);

        return ProviderTransferRequest::query()->create([
            'subject_type' => $subjectType,
            'subject_id' => $subjectId,
            'to_company_id' => $company->id,
            'from_company_id' => $fromCompanyId,
            'requested_by' => $actor->id,
            'status' => 'pending',
        ]);
    }

    private function notifySubject(?User $user, Company $company, ProviderTransferRequest $transfer, string $who): void
    {
        if (! $user) {
            return;
        }

        $this->notifications->notify(
            $user,
            'Solicitação de vínculo',
            "A empresa {$company->name} quer você como {$who} principal. Aceite ou recuse em Notificações.",
            $who === 'motorista' ? 'motorista' : 'sistema',
            'warning',
            'in_app',
            '/notificacoes',
            [
                'type' => 'provider_transfer',
                'transfer_id' => $transfer->id,
                'company_id' => $company->id,
                'company_name' => $company->name,
            ],
        );
    }

    private function notifyRequester(ProviderTransferRequest $transfer, bool $accepted): void
    {
        $requester = $transfer->requester;
        if (! $requester) {
            return;
        }

        $company = $transfer->toCompany;
        $label = $accepted ? 'aceitou' : 'recusou';
        $this->notifications->notify(
            $requester,
            'Resposta de vínculo',
            "O {$transfer->subject_type} {$label} o vínculo com {$company?->name}.",
            'sistema',
            $accepted ? 'success' : 'warning',
            'in_app',
        );
    }

    private function assertOwnsSubject(ProviderTransferRequest $transfer, User $actor): void
    {
        if ($transfer->subject_type === 'client') {
            $client = Client::query()->find($transfer->subject_id);
            abort_unless($client && (int) $client->user_id === (int) $actor->id, 403);
        } else {
            $driver = Driver::query()->find($transfer->subject_id);
            abort_unless($driver && (int) $driver->user_id === (int) $actor->id, 403);
        }
    }
}
