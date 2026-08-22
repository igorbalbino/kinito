<?php

namespace App\Http\Controllers\Api;

use App\Enums\RideStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Ride\StoreRideRequest;
use App\Http\Resources\RideResource;
use App\Models\Client;
use App\Models\Company;
use App\Models\Driver;
use App\Models\Ride;
use App\Services\Finance\FinanceService;
use App\Services\Ride\RideService;
use App\Support\RideQueryScope;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class RideController extends Controller
{
    public function __construct(
        private readonly RideService $rides,
        private readonly FinanceService $finance,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Ride::class);

        $query = Ride::query()->with(['client.user', 'driver.user', 'company', 'partnerCompany']);
        RideQueryScope::apply($query, $request->user());

        if ($status = $request->string('status')->toString()) {
            $query->where('status', strtoupper($status));
        }

        if ($financial = $request->string('financial_status')->toString()) {
            $query->where('financial_status', strtoupper($financial));
        }

        if ($request->filled('company_id')) {
            $query->where('company_id', $request->integer('company_id'));
        }

        if ($request->filled('driver_id')) {
            $query->where('driver_id', $request->integer('driver_id'));
        }

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->integer('client_id'));
        }

        if ($request->filled('from')) {
            $query->whereDate('requested_at', '>=', $request->date('from'));
        }

        if ($request->filled('to')) {
            $query->whereDate('requested_at', '<=', $request->date('to'));
        }

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('origin->address', 'like', "%{$search}%")
                    ->orWhere('destination->address', 'like', "%{$search}%");
            });
        }

        $perPage = min(100, max(1, $request->integer('per_page', 50)));

        return RideResource::collection($query->latest()->paginate($perPage));
    }

    public function store(StoreRideRequest $request): JsonResponse
    {
        $this->authorize('create', Ride::class);

        $data = $request->validated();
        $user = $request->user();
        $acting = $user->actingRole();

        if (! in_array($acting, [UserRole::Admin, UserRole::Empresa], true)) {
            unset($data['driver_id'], $data['partner_company_id']);
        }

        if (in_array($acting, [UserRole::Empresa, UserRole::Motorista], true) && ! empty($data['company_id'])) {
            abort_unless($user->canAccessCompany((int) $data['company_id']), 403, 'Sem permissão nesta empresa.');
        }

        $client = $this->resolveRideClient($user, $acting, $data);
        $data['client_id'] = $client->id;

        $ride = $this->rides->create($data, $client);

        return response()->json([
            'message' => 'Corrida criada.',
            'ride' => new RideResource($ride),
        ], 201);
    }

    public function show(Ride $ride): RideResource
    {
        $this->authorize('view', $ride);

        return new RideResource($ride->load(['client.user', 'driver.user', 'company', 'partnerCompany', 'logs', 'detailLogs']));
    }

    public function accept(Request $request, Ride $ride): RideResource
    {
        $this->authorize('accept', $ride);

        $user = $request->user();
        if ($user->isActingAs(UserRole::Motorista)) {
            $driver = $user->driver;
            abort_unless($driver, 403, 'Perfil de motorista não encontrado.');
        } else {
            $driver = Driver::query()->findOrFail($request->integer('driver_id'));
        }

        return new RideResource($this->rides->accept($ride, $driver)->load(['client.user', 'driver.user', 'company']));
    }

    public function start(Ride $ride): RideResource
    {
        $this->authorize('operate', $ride);

        return new RideResource($this->rides->start($ride)->load(['client.user', 'driver.user', 'company']));
    }

    public function finish(Ride $ride): RideResource
    {
        $this->authorize('operate', $ride);

        return new RideResource($this->rides->finish($ride)->load(['client.user', 'driver.user', 'company']));
    }

    public function cancel(Request $request, Ride $ride): RideResource
    {
        $this->authorize('cancel', $ride);

        $data = $request->validate(['reason' => ['nullable', 'string']]);

        return new RideResource($this->rides->cancel($ride, $data['reason'] ?? null)->load(['client.user', 'driver.user', 'company']));
    }

    public function reassign(Request $request, Ride $ride): RideResource
    {
        $this->authorize('manage', $ride);

        $data = $request->validate(['driver_id' => ['required', 'exists:drivers,id']]);
        $driver = Driver::query()->findOrFail($data['driver_id']);

        return new RideResource($this->rides->reassign($ride, $driver)->load(['client.user', 'driver.user', 'company']));
    }

    public function transferPartner(Request $request, Ride $ride): RideResource
    {
        $this->authorize('manage', $ride);

        $data = $request->validate(['partner_company_id' => ['required', 'exists:companies,id']]);
        $partner = Company::query()->findOrFail($data['partner_company_id']);

        return new RideResource($this->rides->transferToPartner($ride, $partner)->load(['client.user', 'driver.user', 'company', 'partnerCompany']));
    }

    public function manualFinance(Request $request, Ride $ride): RideResource
    {
        $this->authorize('adjustPrice', $ride);

        if (in_array($ride->status, [RideStatus::Finalizada, RideStatus::Cancelada], true)) {
            abort(422, 'Não é possível alterar o valor de uma corrida finalizada ou cancelada.');
        }

        $data = $request->validate([
            'gross_value' => ['required', 'numeric', 'min:0'],
            'platform_commission' => ['nullable', 'numeric', 'min:0'],
            'company_cut' => ['nullable', 'numeric', 'min:0'],
            'driver_net' => ['nullable', 'numeric', 'min:0'],
            'manual_override_notes' => ['nullable', 'string'],
        ]);

        $acting = $request->user()->actingRole();
        $isAdmin = $acting === UserRole::Admin && $request->user()->hasRole(UserRole::Admin->value);

        // Empresa/motorista: só gross_value → split recalculado (inclui stripe_fee).
        // Overrides de platform_commission / cuts: somente admin.
        if (! $isAdmin) {
            $this->finance->applyToRide($ride, (float) $data['gross_value'], true);
            if (! empty($data['manual_override_notes'])) {
                $ride->update(['manual_override_notes' => $data['manual_override_notes']]);
            }

            return new RideResource($ride->fresh()->load(['client.user', 'driver.user', 'company']));
        }

        if (isset($data['platform_commission']) || isset($data['driver_net']) || isset($data['company_cut'])) {
            $gross = (float) $data['gross_value'];
            $paymentMethod = $ride->payment_method;
            $methodValue = $paymentMethod instanceof \BackedEnum
                ? $paymentMethod->value
                : (is_string($paymentMethod) ? $paymentMethod : null);
            $split = $this->finance->calculateSplit(
                $gross,
                (float) ($ride->company?->commission_rate ?? config('kinito.commissions.company_percent', 10)),
                $methodValue,
            );

            $ride->update([
                'gross_value' => $gross,
                'stripe_fee' => $split['stripe_fee'],
                'platform_commission' => $data['platform_commission'] ?? $split['platform_commission'],
                'company_cut' => $data['company_cut'] ?? $split['company_cut'],
                'driver_net' => $data['driver_net'] ?? $split['driver_net'],
                'manual_override_notes' => $data['manual_override_notes'] ?? null,
                'financial_status' => $gross > 0 ? 'PENDENTE' : 'INCOMPLETO',
            ]);
        } else {
            $this->finance->applyToRide($ride, (float) $data['gross_value'], true);
            if (! empty($data['manual_override_notes'])) {
                $ride->update(['manual_override_notes' => $data['manual_override_notes']]);
            }
        }

        return new RideResource($ride->fresh()->load(['client.user', 'driver.user', 'company']));
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function resolveRideClient($user, UserRole $acting, array $data): Client
    {
        if (in_array($acting, [UserRole::Cliente, UserRole::Motorista], true)) {
            abort_unless($user->client, 422, 'Perfil de cliente não encontrado.');

            return $user->client;
        }

        abort_unless(! empty($data['client_id']), 422, 'Informe o cliente da corrida.');

        $client = Client::query()->findOrFail((int) $data['client_id']);

        if ($acting === UserRole::Admin) {
            return $client;
        }

        $companyIds = $user->accessibleCompanyIds();
        $linked = $companyIds->isNotEmpty()
            && $client->companies()->whereIn('companies.id', $companyIds)->exists();

        abort_unless($linked, 403, 'Cliente não pertence à empresa.');

        return $client;
    }
}
