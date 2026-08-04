<?php

namespace App\Services\Driver;

use App\Enums\DocumentStatus;
use App\Enums\DriverStatus;
use App\Enums\UserRole;
use App\Models\Company;
use App\Models\Driver;
use App\Models\DriverDocument;
use App\Models\User;
use App\Services\Audit\AuditService;
use App\Services\Notification\NotificationService;
use App\Support\EnsureUserRoles;
use Illuminate\Support\Facades\DB;

class DriverApprovalService
{
    public function __construct(
        private readonly AuditService $audit,
        private readonly NotificationService $notifications,
    ) {}

    /**
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

            return compact('user', 'driver');
        });
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

        $driver->update(['status' => DriverStatus::Ativo]);

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

        return $driver->refresh();
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
