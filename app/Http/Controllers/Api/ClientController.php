<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\ClientResource;
use App\Models\Client;
use App\Models\Company;
use App\Services\Client\ClientOnboardingService;
use App\Services\Provider\ProviderPreferenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ClientController extends Controller
{
    public function __construct(
        private readonly ClientOnboardingService $clients,
        private readonly ProviderPreferenceService $providers,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Client::class);

        $query = Client::query()->with(['user', 'preferences', 'companies']);
        $user = $request->user();
        $acting = $user->actingRole();

        if ($acting === UserRole::Admin) {
            // all
        } elseif ($acting === UserRole::Empresa) {
            $companyIds = $user->accessibleCompanyIds();
            $query->whereHas('companies', fn ($q) => $q->whereIn('companies.id', $companyIds));
        } else {
            $query->where('user_id', $user->id);
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

        $perPage = min(100, max(1, $request->integer('per_page', 50)));

        return ClientResource::collection($query->latest()->paginate($perPage));
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
        abort_unless($request->user()->canAccessCompany($company), 403, 'Sem permissão nesta empresa.');

        $origin = $request->user()->hasRole('MOTORISTA') && ! $request->user()->hasRole('EMPRESA')
            ? 'motorista'
            : 'empresa';
        $result = $this->clients->createByActor($data, $request->user(), $company, $origin);

        $invitePending = (bool) ($result['invite_pending'] ?? false);
        $transferPending = (bool) ($result['transfer_pending'] ?? false);

        $message = match (true) {
            $invitePending => 'Cliente criado. Enviamos um e-mail para ele confirmar a conta e receber a senha.',
            $transferPending => 'Cliente já existe. Enviamos uma notificação para ele aceitar ou recusar a troca de empresa.',
            default => 'Cliente vinculado à empresa.',
        };

        return response()->json([
            'message' => $message,
            'invite_pending' => $invitePending,
            'transfer_pending' => $transferPending,
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

        $providerTouched = array_key_exists('default_provider_mode', $data)
            || array_key_exists('default_company_id', $data);

        if ($providerTouched) {
            $this->providers->updateClientProvider($client, [
                'default_provider_mode' => $data['default_provider_mode']
                    ?? $client->preferences?->default_provider_mode?->value,
                'default_company_id' => array_key_exists('default_company_id', $data)
                    ? $data['default_company_id']
                    : $client->preferences?->default_company_id,
            ], $request->user());
        } else {
            $prefs = array_filter([
                'favorite_addresses' => $data['favorite_addresses'] ?? null,
            ], fn ($v) => $v !== null);

            if ($prefs) {
                $client->preferences()->updateOrCreate(['client_id' => $client->id], $prefs);
            }
        }

        return new ClientResource($client->fresh()->load(['user', 'preferences', 'companies']));
    }
}
