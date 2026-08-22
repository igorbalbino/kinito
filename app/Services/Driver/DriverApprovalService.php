<?php

namespace App\Services\Driver;

use App\Enums\DefaultProviderMode;
use App\Enums\DocumentStatus;
use App\Enums\DriverStatus;
use App\Enums\UserRole;
use App\Models\Company;
use App\Models\Driver;
use App\Models\DriverDocument;
use App\Models\User;
use App\Services\Audit\AuditService;
use App\Services\Notification\NotificationService;
use App\Services\Provider\ProviderPreferenceService;
use App\Support\EnsureUserRoles;
use App\Support\EnsureUserProfiles;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DriverApprovalService
{
    public function __construct(
        private readonly AuditService $audit,
        private readonly NotificationService $notifications,
        private readonly ProviderPreferenceService $providers,
        private readonly \App\Services\Provider\ProviderTransferService $transfers,
    ) {}

    /**
     * Company creates a driver linked to the fleet (can receive rides).
     * Existing drivers get a consent transfer request instead of forced primary switch.
     *
     * @param  array<string, mixed>  $data
     */
    public function createByCompany(array $data, User $actor, Company $company): array
    {
        $placeholderPassword = Str::password(32);
        $wasNewUser = ! User::query()->where('email', $data['email'])->exists();

        if (! $wasNewUser) {
            $user = User::query()->where('email', $data['email'])->firstOrFail();

            if (! $user->hasRole(UserRole::Motorista->value)) {
                EnsureUserRoles::assign($user, UserRole::Motorista);
            }

            $driver = Driver::query()->firstOrCreate(
                ['user_id' => $user->id],
                [
                    'status' => DriverStatus::Ativo,
                    'vehicle_model' => $data['vehicle_model'] ?? null,
                    'vehicle_plate' => $data['vehicle_plate'] ?? null,
                    'vehicle_color' => $data['vehicle_color'] ?? null,
                    'city' => $data['city'] ?? null,
                ]
            );

            $driver->fill(array_filter([
                'vehicle_model' => $data['vehicle_model'] ?? null,
                'vehicle_plate' => $data['vehicle_plate'] ?? null,
                'vehicle_color' => $data['vehicle_color'] ?? null,
                'city' => $data['city'] ?? null,
            ], fn ($v) => $v !== null && $v !== ''))->save();

            if ($driver->documents()->doesntExist()) {
                foreach (['CNH', 'CRLV'] as $docName) {
                    DriverDocument::query()->create([
                        'driver_id' => $driver->id,
                        'name' => $docName,
                        'status' => DocumentStatus::Pendente,
                        'uploaded_at' => now(),
                    ]);
                }
            }

            EnsureUserProfiles::grantDriverClientProfile($user, $company);

            $result = $this->transfers->requestDriverTransfer($driver, $company, $actor);

            $this->audit->log('DRIVER_TRANSFER_REQUESTED_BY_COMPANY', $actor, $driver, null, [
                'company_id' => $company->id,
                'transfer_pending' => $result['transfer_pending'],
            ]);

            return [
                'user' => $user->fresh(),
                'driver' => $result['driver'],
                'invite_pending' => false,
                'transfer_pending' => $result['transfer_pending'],
            ];
        }

        $result = DB::transaction(function () use ($data, $actor, $company, $placeholderPassword) {
            $user = User::query()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'password' => $placeholderPassword,
                'must_change_password' => true,
                'email_verified_at' => null,
            ]);

            EnsureUserRoles::assign($user, UserRole::Motorista);

            $driver = Driver::query()->create([
                'user_id' => $user->id,
                'status' => DriverStatus::Ativo,
                'vehicle_model' => $data['vehicle_model'] ?? null,
                'vehicle_plate' => $data['vehicle_plate'] ?? null,
                'vehicle_color' => $data['vehicle_color'] ?? null,
                'city' => $data['city'] ?? null,
                'primary_company_id' => $company->id,
                'provider_switch_pending' => false,
                'provider_mode' => DefaultProviderMode::Company,
            ]);

            $driver->companies()->syncWithoutDetaching([
                $company->id => [
                    'status' => DriverStatus::Ativo->value,
                    'approved_at' => now(),
                    'approved_by' => $actor->id,
                    'origin' => 'empresa',
                ],
            ]);

            foreach (['CNH', 'CRLV'] as $docName) {
                DriverDocument::query()->create([
                    'driver_id' => $driver->id,
                    'name' => $docName,
                    'status' => DocumentStatus::Pendente,
                    'uploaded_at' => now(),
                ]);
            }

            EnsureUserProfiles::grantDriverClientProfile($user, $company);

            $link = rtrim((string) config('kinito.frontend_url'), '/').'/login';
            $this->notifications->notify(
                $user,
                'Convite Kinito — motorista',
                "A empresa {$company->name} cadastrou você como motorista. "
                .'Confirme o e-mail enviado para ativar o acesso e receber a senha temporária.',
                'motorista',
                'info',
                'in_app',
                $link,
            );

            $this->audit->log('DRIVER_CREATED_BY_COMPANY', $actor, $driver, null, [
                'company_id' => $company->id,
                'invite_pending' => true,
            ]);

            return [
                'user' => $user->fresh(),
                'driver' => $driver->fresh(),
                'invite_pending' => true,
                'transfer_pending' => false,
            ];
        });

        if ($result['invite_pending'] ?? false) {
            $this->notifications->sendDriverInviteEmail($result['user'], $company->name);
        }

        return $result;
    }

    /**
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
            EnsureUserRoles::assign($user, UserRole::Motorista);

            $driver = Driver::query()->create([
                'user_id' => $user->id,
                'status' => DriverStatus::Pendente,
                'vehicle_model' => $data['vehicle_model'] ?? null,
                'vehicle_plate' => $data['vehicle_plate'] ?? null,
                'vehicle_color' => $data['vehicle_color'] ?? null,
                'city' => $data['city'] ?? null,
            ]);

            foreach ($data['documents'] ?? ['CNH', 'CRLV'] as $docName) {
                DriverDocument::query()->create([
                    'driver_id' => $driver->id,
                    'name' => is_array($docName) ? ($docName['name'] ?? 'Documento') : $docName,
                    'status' => DocumentStatus::Pendente,
                    'uploaded_at' => now(),
                    'file_url' => is_array($docName) ? ($docName['file_url'] ?? null) : null,
                ]);
            }

            if (! empty($data['company_id'])) {
                $driver->companies()->attach($data['company_id'], [
                    'status' => DriverStatus::Pendente->value,
                ]);
            }

            $this->audit->log('DRIVER_SELF_REGISTERED', $user, $driver);

            EnsureUserProfiles::grantDriverClientProfile($user);

            return compact('user', 'driver');
        });

        $this->notifications->sendRegistrationEmail($result['user']);

        return $result;
    }

    public function approveForCompany(Driver $driver, Company $company, User $actor): Driver
    {
        $driver->companies()->syncWithoutDetaching([
            $company->id => [
                'status' => DriverStatus::Ativo->value,
                'approved_at' => now(),
                'approved_by' => $actor->id,
            ],
        ]);

        $driver->update([
            'status' => DriverStatus::Ativo,
            'primary_company_id' => $driver->primary_company_id ?: $company->id,
        ]);

        $this->providers->completeDriverSwitchOnApprove($driver->fresh(), $company);

        $this->notifications->notify(
            $driver->user,
            'Motorista aprovado',
            "Você foi aprovado pela empresa {$company->name}.",
            'motorista',
            'success'
        );

        $this->audit->log('DRIVER_APPROVED', $actor, $driver, null, [
            'company_id' => $company->id,
        ]);

        return $driver->fresh(['user', 'documents', 'companies', 'primaryCompany']);
    }

    public function block(Driver $driver, User $actor, ?Company $company = null): Driver
    {
        $driver->update(['status' => DriverStatus::Bloqueado]);

        if ($company) {
            $driver->companies()->updateExistingPivot($company->id, [
                'status' => DriverStatus::Bloqueado->value,
            ]);
        }

        $this->audit->log('DRIVER_BLOCKED', $actor, $driver);

        return $driver->refresh();
    }

    public function reviewDocument(DriverDocument $document, DocumentStatus $status, User $actor): DriverDocument
    {
        $before = $document->toArray();
        $document->update(['status' => $status]);

        $driver = $document->driver;
        $allApproved = $driver->documents()->where('status', '!=', DocumentStatus::Aprovado->value)->doesntExist();

        if ($allApproved && $driver->documents()->exists()) {
            $driver->update(['status' => DriverStatus::Ativo]);
        }

        $this->audit->log('DRIVER_DOCUMENT_REVIEWED', $actor, $document, $before, $document->fresh()->toArray());

        return $document->refresh();
    }
}
