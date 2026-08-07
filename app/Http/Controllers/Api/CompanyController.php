<?php

namespace App\Http\Controllers\Api;

use App\Enums\PartnershipStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Company\RegisterCompanyRequest;
use App\Http\Resources\CompanyResource;
use App\Http\Resources\CompanySettingResource;
use App\Models\Company;
use App\Models\CompanyPartnership;
use App\Services\Company\CompanyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CompanyController extends Controller
{
    public function __construct(private readonly CompanyService $companies) {}

    public function register(RegisterCompanyRequest $request): JsonResponse
    {
        $result = $this->companies->register($request->validated());

        return response()->json([
            'message' => 'Empresa cadastrada. Confirme seu e-mail para acessar o painel.',
            'email_verification_required' => true,
            'email' => $result['user']->email,
            'company' => new CompanyResource($result['company']->load(['settings', 'users', 'activeSubscription.plan'])),
        ], 201);
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Company::class);

        $query = Company::query()->with(['settings', 'users', 'activeSubscription.plan'])
            ->withCount('rides');

        if (! $request->user()->hasRole('ADMIN')) {
            $ids = $request->user()->ownedCompanies()->pluck('id')
                ->merge($request->user()->companies()->pluck('companies.id'));
            $query->whereIn('id', $ids);
        }

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('cnpj', 'like', "%{$search}%");
            });
        }

        return CompanyResource::collection($query->latest()->paginate($request->integer('per_page', 20)));
    }

    public function show(Company $company): CompanyResource
    {
        $this->authorize('view', $company);

        return new CompanyResource($company->load(['settings', 'users', 'activeSubscription.plan', 'partnerships.partner']));
    }

    public function update(Request $request, Company $company): CompanyResource
    {
        $this->authorize('update', $company);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'logo' => ['nullable', 'string'],
            'commission_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'is_distributor' => ['sometimes', 'boolean'],
            'is_provider' => ['sometimes', 'boolean'],
            'is_partner_enabled' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $company->update($data);

        return new CompanyResource($company->fresh()->load(['settings', 'users', 'activeSubscription.plan']));
    }

    public function updateSettings(Request $request, Company $company): JsonResponse
    {
        $this->authorize('update', $company);

        $data = $request->validate([
            'modelo_corridas' => ['sometimes', 'in:INSTANTANEAS,AGENDAMENTO,AMBOS'],
            'accept_instant_rides' => ['sometimes', 'boolean'],
            'allow_scheduling' => ['sometimes', 'boolean'],
            'stripe_enabled' => ['sometimes', 'boolean'],
            'notifications_enabled' => ['sometimes', 'boolean'],
            'allow_partners' => ['sometimes', 'boolean'],
            'extra' => ['nullable', 'array'],
        ]);

        $settings = $this->companies->updateSettings($company, $data);

        return response()->json([
            'message' => 'Configurações atualizadas.',
            'settings' => new CompanySettingResource($settings),
        ]);
    }

    public function storePartnership(Request $request, Company $company): JsonResponse
    {
        $this->authorize('manage', $company);

        $data = $request->validate([
            'partner_company_id' => ['required', 'exists:companies,id'],
            'notes' => ['nullable', 'string'],
        ]);

        abort_if((int) $data['partner_company_id'] === $company->id, 422, 'Parceiro deve ser outra empresa.');
        $partnership = CompanyPartnership::query()->updateOrCreate(
            [
                'company_id' => $company->id,
                'partner_company_id' => $data['partner_company_id'],
            ],
            [
                'status' => PartnershipStatus::Pending,
                'notes' => $data['notes'] ?? null,
            ]
        );

        return response()->json(['data' => $partnership], 201);
    }

    public function updatePartnership(Request $request, Company $company, CompanyPartnership $partnership): JsonResponse
    {
        $this->authorize('manage', $company);

        abort_unless($partnership->company_id === $company->id || $partnership->partner_company_id === $company->id, 404);

        $data = $request->validate([
            'status' => ['required', 'in:PENDING,ACTIVE,REJECTED,SUSPENDED'],
            'notes' => ['nullable', 'string'],
        ]);

        $partnership->update($data);

        return response()->json(['data' => $partnership->fresh()]);
    }
}
