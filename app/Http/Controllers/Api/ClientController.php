<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ClientResource;
use App\Models\Client;
use App\Models\Company;
use App\Services\Client\ClientOnboardingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ClientController extends Controller
{
    public function __construct(private readonly ClientOnboardingService $clients) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Client::class);

        $query = Client::query()->with(['user', 'preferences', 'companies']);

        if ($request->user()->hasRole('CLIENTE') && ! $request->user()->hasRole('ADMIN')) {
            $query->where('user_id', $request->user()->id);
        }

        if ($request->user()->hasRole('EMPRESA') && ! $request->user()->hasRole('ADMIN')) {
            $companyIds = $request->user()->ownedCompanies()->pluck('id')
                ->merge($request->user()->companies()->pluck('companies.id'));
            $query->whereHas('companies', fn ($q) => $q->whereIn('companies.id', $companyIds));
        }

        if ($status = $request->string('status')->toString()) {
            $query->where('status', strtoupper($status));
        }

        if ($search = $request->string('search')->toString()) {
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        return ClientResource::collection($query->latest()->paginate($request->integer('per_page', 20)));
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Client::class);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'company_id' => ['nullable', 'exists:companies,id'],
            'favorite_addresses' => ['nullable', 'array'],
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        $company = null;
        if (! empty($data['company_id'])) {
            $company = Company::query()->findOrFail($data['company_id']);
        } else {
            $company = $request->user()->primaryCompany();
        }

        abort_unless($company, 422, 'Informe a empresa para vincular o cliente.');

        $origin = $request->user()->hasRole('MOTORISTA') ? 'motorista' : 'empresa';
        $result = $this->clients->createByActor($data, $request->user(), $company, $origin);

        return response()->json([
            'message' => 'Cliente criado e vinculado.',
            'temporary_password' => $result['tempPassword'] ?? null,
            'client' => new ClientResource($result['client']->load(['user', 'preferences', 'companies'])),
        ], 201);
    }

    public function show(Client $client): ClientResource
    {
        $this->authorize('view', $client);

        return new ClientResource($client->load(['user', 'preferences', 'companies']));
    }

    public function update(Request $request, Client $client): ClientResource
    {
        $this->authorize('update', $client);

        $data = $request->validate([
            'status' => ['sometimes', 'in:ATIVO,SUSPENSO,VIP'],
            'name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'default_provider_mode' => ['sometimes', 'in:COMPANY,ALL'],
            'default_company_id' => ['nullable', 'exists:companies,id'],
            'favorite_addresses' => ['nullable', 'array'],
        ]);

        if (isset($data['status'])) {
            $client->update(['status' => $data['status']]);
        }

        if (isset($data['name']) || array_key_exists('phone', $data)) {
            $client->user?->update(array_filter([
                'name' => $data['name'] ?? null,
                'phone' => $data['phone'] ?? null,
            ], fn ($v) => $v !== null));
        }

        $prefs = array_filter([
            'default_provider_mode' => $data['default_provider_mode'] ?? null,
            'default_company_id' => $data['default_company_id'] ?? null,
            'favorite_addresses' => $data['favorite_addresses'] ?? null,
        ], fn ($v) => $v !== null);

        if ($prefs) {
            $client->preferences()->updateOrCreate(['client_id' => $client->id], $prefs);
        }

        return new ClientResource($client->fresh()->load(['user', 'preferences', 'companies']));
    }
}
