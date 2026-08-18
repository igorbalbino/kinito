<?php

namespace App\Services\Provider;

use App\Enums\DefaultProviderMode;
use App\Enums\DriverStatus;
use App\Models\Client;
use App\Models\Company;
use App\Models\Driver;
use App\Models\User;
use App\Services\Audit\AuditService;
use App\Services\Mail\MailService;
use App\Services\Notification\NotificationService;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class ProviderPreferenceService
{
    public function __construct(
        private readonly AuditService $audit,
        private readonly MailService $mail,
        private readonly NotificationService $notifications,
    ) {}

    /**
     * @param  array{default_provider_mode?:string, default_company_id?:int|null}  $data
     */
    public function updateClientProvider(Client $client, array $data, ?User $actor = null): Client
    {
        $mode = isset($data['default_provider_mode'])
            ? DefaultProviderMode::from($data['default_provider_mode'])
            : ($client->preferences?->default_provider_mode ?? DefaultProviderMode::All);

        $companyId = array_key_exists('default_company_id', $data)
            ? $data['default_company_id']
            : $client->preferences?->default_company_id;

        if ($mode === DefaultProviderMode::All) {
            $companyId = null;
        }

        if ($mode === DefaultProviderMode::Company && ! $companyId) {
            throw new InvalidArgumentException('Selecione uma empresa como fornecedor principal.');
        }

        $before = $client->preferences?->only(['default_provider_mode', 'default_company_id']);

        DB::transaction(function () use ($client, $mode, $companyId) {
            if ($mode === DefaultProviderMode::Company && $companyId) {
                $client->companies()->syncWithoutDetaching([
                    $companyId => [
                        'origin' => 'self',
                        'is_active' => true,
                    ],
                ]);
            }

            $client->preferences()->updateOrCreate(
                ['client_id' => $client->id],
                [
                    'default_provider_mode' => $mode,
                    'default_company_id' => $companyId,
                ]
            );
        });

        $client = $client->fresh(['user', 'preferences', 'companies']);

        $this->audit->log('CLIENT_PROVIDER_UPDATED', $actor, $client, $before, [
            'default_provider_mode' => $mode->value,
            'default_company_id' => $companyId,
        ]);

        if ($mode === DefaultProviderMode::Company && $companyId) {
            $company = Company::query()->find($companyId);
            if ($company) {
                $this->notifyCompanyOfSelection($company, 'client', (string) ($client->user?->name ?? 'Cliente'));
            }
        }

        return $client;
    }

    /**
     * @param  array{provider_mode?: string, primary_company_id?: int|null}  $data
     */
    public function updateDriverProvider(Driver $driver, array $data, User $actor): Driver
    {
        if (! isset($data['provider_mode'])) {
            throw new InvalidArgumentException('Informe o modo de fornecedor.');
        }

        $mode = DefaultProviderMode::from($data['provider_mode']);
        $companyId = $data['primary_company_id'] ?? null;

        if ($mode === DefaultProviderMode::All) {
            $before = $driver->only(['provider_mode', 'primary_company_id']);

            DB::transaction(function () use ($driver) {
                $driver->forceFill([
                    'provider_mode' => DefaultProviderMode::All,
                    'primary_company_id' => null,
                    'provider_switch_pending' => false,
                    'previous_primary_company_id' => null,
                ])->save();
            });

            $driver = $driver->fresh(['user', 'companies', 'primaryCompany', 'previousPrimaryCompany']);

            $this->audit->log('DRIVER_PROVIDER_UPDATED', $actor, $driver, $before, [
                'provider_mode' => DefaultProviderMode::All->value,
            ]);

            return $driver;
        }

        if (! $companyId) {
            throw new InvalidArgumentException('Selecione uma empresa como fornecedor principal.');
        }

        $company = Company::query()->findOrFail($companyId);

        if (
            (int) $driver->primary_company_id === (int) $companyId
            && ($driver->provider_mode ?? DefaultProviderMode::Company) === DefaultProviderMode::Company
            && ! $driver->provider_switch_pending
        ) {
            return $driver->fresh(['user', 'companies', 'primaryCompany', 'previousPrimaryCompany']);
        }

        $updated = $this->switchDriverProvider($driver, $company, $actor);
        $updated->forceFill(['provider_mode' => DefaultProviderMode::Company])->save();

        return $updated->fresh(['user', 'companies', 'primaryCompany', 'previousPrimaryCompany']);
    }

    public function switchDriverProvider(Driver $driver, Company $company, User $actor): Driver
    {
        $currentPrimary = $driver->primary_company_id;

        if ($currentPrimary && (int) $currentPrimary === (int) $company->id && ! $driver->provider_switch_pending) {
            throw new InvalidArgumentException('Esta empresa já é o fornecedor principal.');
        }

        DB::transaction(function () use ($driver, $company, $currentPrimary) {
            if ($currentPrimary && (int) $currentPrimary !== (int) $company->id) {
                $driver->previous_primary_company_id = $currentPrimary;
            }

            $driver->companies()->syncWithoutDetaching([
                $company->id => [
                    'status' => DriverStatus::Pendente->value,
                    'approved_at' => null,
                    'approved_by' => null,
                ],
            ]);

            $driver->forceFill([
                'primary_company_id' => $company->id,
                'provider_switch_pending' => true,
                'provider_mode' => DefaultProviderMode::Company,
            ])->save();
        });

        $driver = $driver->fresh(['user', 'companies', 'primaryCompany', 'previousPrimaryCompany']);

        $this->audit->log('DRIVER_PROVIDER_SWITCH_REQUESTED', $actor, $driver, null, [
            'company_id' => $company->id,
            'previous_primary_company_id' => $driver->previous_primary_company_id,
        ]);

        $this->notifyCompanyOfSelection($company, 'driver', (string) ($driver->user?->name ?? 'Motorista'));

        $this->notifications->notify(
            $driver->user,
            'Troca de fornecedor pendente',
            "Você solicitou vínculo com {$company->name}. Ficará sem corridas até a empresa aceitar — ou volte ao fornecedor anterior.",
            'motorista',
            'warning',
            'in_app',
        );

        return $driver;
    }

    public function revertDriverProvider(Driver $driver, User $actor): Driver
    {
        if (! $driver->provider_switch_pending || ! $driver->previous_primary_company_id) {
            throw new InvalidArgumentException('Não há troca de fornecedor para reverter.');
        }

        $pendingCompanyId = $driver->primary_company_id;
        $previousId = $driver->previous_primary_company_id;

        DB::transaction(function () use ($driver, $pendingCompanyId, $previousId) {
            if ($pendingCompanyId) {
                $driver->companies()->detach($pendingCompanyId);
            }

            $driver->forceFill([
                'primary_company_id' => $previousId,
                'previous_primary_company_id' => null,
                'provider_switch_pending' => false,
                'provider_mode' => DefaultProviderMode::Company,
            ])->save();
        });

        $driver = $driver->fresh(['user', 'companies', 'primaryCompany']);

        $this->audit->log('DRIVER_PROVIDER_REVERTED', $actor, $driver, null, [
            'primary_company_id' => $previousId,
            'detached_company_id' => $pendingCompanyId,
        ]);

        return $driver;
    }

    public function completeDriverSwitchOnApprove(Driver $driver, Company $company): void
    {
        if (! $driver->provider_switch_pending) {
            return;
        }

        if ((int) $driver->primary_company_id !== (int) $company->id) {
            return;
        }

        $driver->forceFill([
            'provider_switch_pending' => false,
            'previous_primary_company_id' => null,
        ])->save();
    }

    private function notifyCompanyOfSelection(Company $company, string $who, string $personName): void
    {
        $recipients = collect([$company->owner])
            ->merge($company->users)
            ->filter()
            ->unique('id');

        foreach ($recipients as $user) {
            if (! $user instanceof User || ! filter_var($user->email, FILTER_VALIDATE_EMAIL)) {
                continue;
            }

            if ($who === 'driver') {
                $this->mail->sendProviderSelectedByDriver($user, $personName, $company->name);
            } else {
                $this->mail->sendProviderSelectedByClient($user, $personName, $company->name);
            }
        }
    }
}
