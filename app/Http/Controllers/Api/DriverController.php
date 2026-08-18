<?php

namespace App\Http\Controllers\Api;

use App\Enums\DocumentStatus;
use App\Enums\DriverStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\DriverResource;
use App\Models\Company;
use App\Models\Driver;
use App\Models\DriverDocument;
use App\Services\Driver\DriverApprovalService;
use App\Services\Provider\ProviderPreferenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class DriverController extends Controller
{
    public function __construct(
        private readonly DriverApprovalService $drivers,
        private readonly ProviderPreferenceService $providers,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Driver::class);

        $query = Driver::query()->with(['user', 'documents', 'companies', 'primaryCompany', 'previousPrimaryCompany']);

        $user = $request->user();
        $acting = $user->actingRole();

        if ($acting === UserRole::Empresa) {
            $companyIds = $user->accessibleCompanyIds();
            $query->whereHas('companies', fn ($q) => $q->whereIn('companies.id', $companyIds));
        } elseif ($acting !== UserRole::Admin) {
            $query->where('user_id', $user->id);
        }

        if ($status = $request->string('status')->toString()) {
            $query->where('status', strtoupper($status));
        }

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('vehicle_plate', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%"));
            });
        }

        $perPage = min(100, max(1, $request->integer('per_page', 50)));

        return DriverResource::collection($query->latest()->paginate($perPage));
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Driver::class);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'company_id' => ['nullable', 'exists:companies,id'],
            'vehicle_model' => ['nullable', 'string', 'max:100'],
            'vehicle_plate' => ['nullable', 'string', 'max:20'],
            'vehicle_color' => ['nullable', 'string', 'max:50'],
            'city' => ['nullable', 'string', 'max:100'],
        ]);

        $company = ! empty($data['company_id'])
            ? Company::query()->findOrFail($data['company_id'])
            : $request->user()->primaryCompany();

        abort_unless($company, 422, 'Informe a empresa para vincular o motorista.');
        abort_unless($request->user()->canAccessCompany($company), 403, 'Sem permissão nesta empresa.');

        $result = $this->drivers->createByCompany($data, $request->user(), $company);
        $invitePending = (bool) ($result['invite_pending'] ?? false);

        return response()->json([
            'message' => $invitePending
                ? 'Motorista criado. Enviamos um e-mail para ele confirmar a conta e receber a senha.'
                : 'Motorista vinculado à empresa.',
            'invite_pending' => $invitePending,
            'driver' => new DriverResource($result['driver']->load(['user', 'documents', 'companies', 'primaryCompany'])),
        ], 201);
    }

    public function show(Driver $driver): DriverResource
    {
        $this->authorize('view', $driver);

        return new DriverResource($driver->load(['user', 'documents', 'companies', 'primaryCompany', 'previousPrimaryCompany']));
    }

    public function update(Request $request, Driver $driver): DriverResource
    {
        $this->authorize('update', $driver);

        $rules = [
            'vehicle_model' => ['sometimes', 'string', 'max:100'],
            'vehicle_plate' => ['sometimes', 'string', 'max:20'],
            'vehicle_color' => ['nullable', 'string', 'max:50'],
            'city' => ['nullable', 'string', 'max:100'],
        ];

        $isSelfDriver = $request->user()->driver?->id === $driver->id
            && ! $request->user()->hasRole('ADMIN')
            && ! $request->user()->hasRole('EMPRESA');

        if (! $isSelfDriver) {
            $rules['status'] = ['sometimes', 'in:PENDENTE,ATIVO,BLOQUEADO,INDISPONIVEL'];
        }

        $data = $request->validate($rules);

        $driver->update($data);

        return new DriverResource($driver->fresh()->load(['user', 'documents', 'companies', 'primaryCompany', 'previousPrimaryCompany']));
    }

    public function approve(Request $request, Driver $driver): DriverResource
    {
        $company = $this->resolveCompany($request);
        $this->authorize('manageFleet', $driver);

        return new DriverResource(
            $this->drivers->approveForCompany($driver, $company, $request->user())->load(['user', 'documents', 'companies', 'primaryCompany', 'previousPrimaryCompany'])
        );
    }

    public function switchProvider(Request $request, Driver $driver): JsonResponse
    {
        $this->authorize('update', $driver);

        $data = $request->validate([
            'company_id' => ['required', 'exists:companies,id'],
        ]);

        $company = Company::query()->findOrFail($data['company_id']);
        $updated = $this->providers->switchDriverProvider($driver, $company, $request->user());

        return response()->json([
            'message' => 'Solicitação enviada. Aguarde o aceite da empresa ou reverta para o fornecedor anterior.',
            'driver' => new DriverResource($updated),
        ]);
    }

    public function revertProvider(Request $request, Driver $driver): JsonResponse
    {
        $this->authorize('update', $driver);

        $updated = $this->providers->revertDriverProvider($driver, $request->user());

        return response()->json([
            'message' => 'Fornecedor anterior restaurado. Você volta a receber corridas dele.',
            'driver' => new DriverResource($updated),
        ]);
    }

    public function block(Request $request, Driver $driver): DriverResource
    {
        $this->authorize('manageFleet', $driver);
        $company = null;
        try {
            $company = $this->resolveCompany($request);
        } catch (\Throwable) {
            // admin block without company
        }

        return new DriverResource(
            $this->drivers->block($driver, $request->user(), $company)->load(['user', 'documents', 'companies', 'primaryCompany'])
        );
    }

    public function reviewDocument(Request $request, Driver $driver, DriverDocument $document): JsonResponse
    {
        abort_unless($document->driver_id === $driver->id, 404);
        $this->authorize('manageFleet', $driver);

        $data = $request->validate([
            'status' => ['required', 'in:APROVADO,REJEITADO,PENDENTE,VENCIDO'],
        ]);

        $doc = $this->drivers->reviewDocument(
            $document,
            DocumentStatus::from($data['status']),
            $request->user()
        );

        return response()->json(['data' => $doc]);
    }

    public function linkCompany(Request $request, Driver $driver): JsonResponse
    {
        $this->authorize('update', $driver);

        $data = $request->validate([
            'company_id' => ['required', 'exists:companies,id'],
        ]);

        $driver->companies()->syncWithoutDetaching([
            $data['company_id'] => ['status' => DriverStatus::Pendente->value],
        ]);

        return response()->json(['message' => 'Vínculo solicitado.', 'driver' => new DriverResource($driver->load(['user', 'companies']))]);
    }

    private function resolveCompany(Request $request): Company
    {
        if ($request->filled('company_id')) {
            $company = Company::query()->findOrFail($request->integer('company_id'));
        } else {
            $company = $request->user()->primaryCompany();
            abort_unless($company, 422, 'Empresa não encontrada para o usuário.');
        }

        abort_unless($request->user()->canAccessCompany($company), 403, 'Sem permissão nesta empresa.');

        return $company;
    }
}
