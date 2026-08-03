<?php

namespace App\Http\Controllers\Api;

use App\Enums\DocumentStatus;
use App\Enums\DriverStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\DriverResource;
use App\Models\Company;
use App\Models\Driver;
use App\Models\DriverDocument;
use App\Services\Driver\DriverApprovalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class DriverController extends Controller
{
    public function __construct(private readonly DriverApprovalService $drivers) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Driver::class);

        $query = Driver::query()->with(['user', 'documents', 'companies']);

        if ($request->user()->hasRole('EMPRESA') && ! $request->user()->hasRole('ADMIN')) {
            $companyIds = $request->user()->ownedCompanies()->pluck('id')
                ->merge($request->user()->companies()->pluck('companies.id'));
            $query->whereHas('companies', fn ($q) => $q->whereIn('companies.id', $companyIds));
        }

        if ($request->user()->hasRole('MOTORISTA') && ! $request->user()->hasRole('ADMIN')) {
            $query->where('user_id', $request->user()->id);
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

        return DriverResource::collection($query->latest()->paginate($request->integer('per_page', 20)));
    }

    public function show(Driver $driver): DriverResource
    {
        $this->authorize('view', $driver);

        return new DriverResource($driver->load(['user', 'documents', 'companies']));
    }

    public function update(Request $request, Driver $driver): DriverResource
    {
        $this->authorize('update', $driver);

        $data = $request->validate([
            'vehicle_model' => ['sometimes', 'string', 'max:100'],
            'vehicle_plate' => ['sometimes', 'string', 'max:20'],
            'vehicle_color' => ['nullable', 'string', 'max:50'],
            'city' => ['nullable', 'string', 'max:100'],
            'status' => ['sometimes', 'in:PENDENTE,ATIVO,BLOQUEADO,INDISPONIVEL'],
        ]);

        $driver->update($data);

        return new DriverResource($driver->fresh()->load(['user', 'documents', 'companies']));
    }

    public function approve(Request $request, Driver $driver): DriverResource
    {
        $company = $this->resolveCompany($request);
        $this->authorize('update', $driver);

        return new DriverResource(
            $this->drivers->approveForCompany($driver, $company, $request->user())->load(['user', 'documents', 'companies'])
        );
    }

    public function block(Request $request, Driver $driver): DriverResource
    {
        $this->authorize('update', $driver);
        $company = null;
        try {
            $company = $this->resolveCompany($request);
        } catch (\Throwable) {
            // admin block without company
        }

        return new DriverResource(
            $this->drivers->block($driver, $request->user(), $company)->load(['user', 'documents', 'companies'])
        );
    }

    public function reviewDocument(Request $request, Driver $driver, DriverDocument $document): JsonResponse
    {
        abort_unless($document->driver_id === $driver->id, 404);
        $this->authorize('update', $driver);

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
            return Company::query()->findOrFail($request->integer('company_id'));
        }

        $company = $request->user()->primaryCompany();
        abort_unless($company, 422, 'Empresa não encontrada para o usuário.');

        return $company;
    }
}
